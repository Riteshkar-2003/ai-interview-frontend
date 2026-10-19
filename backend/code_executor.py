"""
code_executor.py
================
Robust multi-language code execution engine supporting both Judge0 API and
local sandboxed execution for Python, JavaScript (Node.js), Java, C, and C++.

Execution strategy:
1. If Judge0 is reachable at JUDGE0_URL, code submissions are securely routed to Judge0.
2. If Judge0 is unreachable (Docker offline or network down), execution automatically
   and transparently falls back to the host's local execution engine with automatic
   toolchain discovery (Python, Node.js, OpenJDK, GCC/G++/Clang).
"""

import asyncio
import base64
import glob
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("code_executor")

# judge0 configuration 
JUDGE0_URL: str = os.getenv("JUDGE0_URL", "http://localhost:2358").rstrip("/")
_SUBMISSIONS_ENDPOINT = f"{JUDGE0_URL}/submissions"

# timeout for individual judge0 http calls
JUDGE0_HTTP_TIMEOUT: float = float(os.getenv("JUDGE0_HTTP_TIMEOUT", "10"))

# Whether to try judge0 and whether to allow automatic local fallback
USE_JUDGE0: bool = os.getenv("USE_JUDGE0", "false").lower() in ("true", "1", "yes")
ENABLE_LOCAL_FALLBACK: bool = os.getenv("ENABLE_LOCAL_FALLBACK", "true").lower() in ("true", "1", "yes")

# state tracking for judge0 reachability to prevent blocking roundtrips when down
_judge0_healthy: Optional[bool] = None
_judge0_last_check: float = 0.0
JUDGE0_COOLDOWN_SECONDS: float = 300.0  

# language id mapping (judge0 language ids) 
LANGUAGE_IDS: dict[str, int] = {
    "python":     71,   
    "javascript": 63,   
    "java":       62,   
    "cpp":        54,   
    "c++":        54,   
    "c":          50,   
    "js":         63,   
    "node":       63,   
}

# judge0 status ids → platform status strings 
_JUDGE0_STATUS: dict[int, str] = {
    1:  "In Queue",
    2:  "Processing",
    3:  "Passed",            
    4:  "Wrong Answer",
    5:  "Time Limit Exceeded",
    6:  "Compilation Error",
    7:  "Runtime Error",     
    8:  "Runtime Error",     
    9:  "Runtime Error",     
    10: "Runtime Error",     
    11: "Runtime Error",     
    12: "Runtime Error",     
    13: "Internal Error",
    14: "Execution Format Error",
}

_COMPILE_ERROR_IDS = {6}
_TLE_IDS = {5}
_FINISHED_IDS = {3, 4}



_TOOLCHAIN_CACHE: dict[str, Optional[str]] = {}

def _find_binary(binary_names: list[str]) -> Optional[str]:
    """
    Locates an executable by scanning:
    1. Dedicated environment variables (e.g. JAVAC_PATH, JAVA_PATH, JAVA_HOME, NODE_PATH)
    2. System PATH (via shutil.which)
    3. Linux / Unix JVM and system paths (/usr/lib/jvm/**/bin, /opt/java/**/bin, /usr/bin, /nix/...)
    4. WinGet installed portable packages (%LOCALAPPDATA%\\Microsoft\\WinGet)
    5. Common Windows installation paths (Node.js, Oracle Java, MSYS2, MinGW, Chocolatey, Adoptium)
    Caches results for performance.
    """
    cache_key = ":".join(binary_names)
    if cache_key in _TOOLCHAIN_CACHE:
        return _TOOLCHAIN_CACHE[cache_key]

    is_windows = os.name == "nt"

    # 1. Check explicit environment overrides
    env_var_map = {
        "javac": ["JAVAC_PATH", "JDK_BIN"],
        "java":  ["JAVA_PATH", "JRE_BIN"],
        "node":  ["NODE_PATH", "NODE_BIN"],
        "gcc":   ["GCC_PATH"],
        "g++":   ["GXX_PATH", "CPP_PATH"],
    }
    for b in binary_names:
        for ev in env_var_map.get(b, []):
            custom_path = os.environ.get(ev)
            if custom_path and os.path.isfile(custom_path):
                _TOOLCHAIN_CACHE[cache_key] = custom_path
                return custom_path

    # Check JAVA_HOME specifically for javac or java
    java_home = os.environ.get("JAVA_HOME")
    if java_home and any(b in ("java", "javac") for b in binary_names):
        bin_dir = os.path.join(java_home, "bin")
        for b in binary_names:
            candidates = [os.path.join(bin_dir, f"{b}.exe"), os.path.join(bin_dir, b)] if is_windows else [os.path.join(bin_dir, b), os.path.join(bin_dir, f"{b}.exe")]
            for cand in candidates:
                if os.path.isfile(cand):
                    _TOOLCHAIN_CACHE[cache_key] = cand
                    return cand

    # 2. Check system PATH via shutil.which
    for b in binary_names:
        found = shutil.which(b)
        if found:
            _TOOLCHAIN_CACHE[cache_key] = found
            return found

    # 3. Unix / Linux JVM & standard paths (Render, Railway, Ubuntu, Debian, Docker, etc.)
    unix_search_dirs = [
        "/usr/lib/jvm/default-java/bin",
        "/usr/bin",
        "/usr/local/bin",
        "/etc/alternatives",
        "/nix/var/nix/profiles/default/bin",
        "/root/.nix-profile/bin",
        "/home/linuxbrew/.linuxbrew/bin",
    ]
    # Expand Linux JVM patterns like /usr/lib/jvm/java-*-openjdk*/bin
    for pattern in ["/usr/lib/jvm/*/bin", "/opt/java/*/bin", "/opt/jdk/*/bin"]:
        unix_search_dirs.extend(glob.glob(pattern))

    for d in unix_search_dirs:
        if os.path.isdir(d):
            for b in binary_names:
                cand = os.path.join(d, b)
                if os.path.isfile(cand):
                    _TOOLCHAIN_CACHE[cache_key] = cand
                    return cand

    # 4. Windows WinGet packages
    if is_windows:
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            winget_pkgs = os.path.join(local_app_data, "Microsoft", "WinGet", "Packages")
            winget_links = os.path.join(local_app_data, "Microsoft", "WinGet", "Links")
            for b in binary_names:
                link_candidate = os.path.join(winget_links, f"{b}.exe")
                if os.path.exists(link_candidate):
                    _TOOLCHAIN_CACHE[cache_key] = link_candidate
                    return link_candidate

                matches = glob.glob(os.path.join(winget_pkgs, "**", f"{b}.exe"), recursive=True)
                if matches:
                    _TOOLCHAIN_CACHE[cache_key] = matches[0]
                    return matches[0]

        # 5. Windows standard installation directories
        std_dirs = [
            r"C:\Program Files\nodejs",
            r"C:\Program Files (x86)\nodejs",
            r"C:\Program Files\Common Files\Oracle\Java\javapath",
            r"C:\ProgramData\chocolatey\bin",
            r"C:\MinGW\bin",
            r"C:\msys64\mingw64\bin",
            r"C:\msys64\ucrt64\bin",
            r"C:\msys64\usr\bin",
            r"C:\w64devkit\bin",
        ]

        java_base_dirs = [
            r"C:\Program Files\Eclipse Adoptium",
            r"C:\Program Files\Microsoft",
            r"C:\Program Files\Java",
            r"C:\Program Files (x86)\Java",
        ]
        for jbase in java_base_dirs:
            if os.path.isdir(jbase):
                for entry in sorted(os.listdir(jbase), reverse=True):
                    if "jdk" in entry.lower() or "openjdk" in entry.lower():
                        bin_dir = os.path.join(jbase, entry, "bin")
                        if os.path.isdir(bin_dir) and bin_dir not in std_dirs:
                            std_dirs.append(bin_dir)
        for d in std_dirs:
            for b in binary_names:
                for ext in [".exe", ""]:
                    candidate = os.path.join(d, f"{b}{ext}")
                    if os.path.isfile(candidate):
                        _TOOLCHAIN_CACHE[cache_key] = candidate
                        return candidate

    _TOOLCHAIN_CACHE[cache_key] = None
    return None


def _get_execution_env(binary_path: Optional[str]) -> dict:
    """Returns an environment with the binary's containing folder prepended to PATH and JAVA_HOME exported."""
    env = os.environ.copy()
    if binary_path:
        b_dir = os.path.dirname(os.path.abspath(binary_path))
        if b_dir not in env.get("PATH", ""):
            env["PATH"] = b_dir + os.pathsep + env.get("PATH", "")
        # If binary is java or javac, ensure JAVA_HOME is also configured
        base_name = os.path.basename(binary_path).lower()
        if (base_name.startswith("java") or base_name.startswith("javac")) and "JAVA_HOME" not in env:
            parent_home = os.path.dirname(b_dir)
            env["JAVA_HOME"] = parent_home
    return env




def _normalize_language(language: str) -> str:
    """Return a canonical lower-case language key used across executors."""
    lang = (language or "python").lower().strip()
    if lang in ("js", "javascript", "node"):
        return "javascript"
    if lang in ("c++", "cpp"):
        return "cpp"
    return lang


def _get_language_id(language: str) -> Optional[int]:
    return LANGUAGE_IDS.get(_normalize_language(language))


def _decode_b64(value: Optional[str]) -> str:
    """Judge0 base64-encodes stdout/stderr – decode safely."""
    if not value:
        return ""
    try:
        return base64.b64decode(value).decode("utf-8", errors="replace").strip()
    except Exception:
        return str(value).strip()


def _outputs_match(actual: str, expected: str) -> bool:
    """Normalized comparison: strip whitespace on each line and ignore trailing newlines."""
    if actual == expected:
        return True
    actual_norm = "\n".join(line.strip() for line in actual.splitlines() if line.strip())
    expected_norm = "\n".join(line.strip() for line in expected.splitlines() if line.strip())
    return actual_norm == expected_norm


def _build_error_result(
    error: str,
    status: str = "Execution Error",
    execution_time: float = 0.0,
) -> dict:
    """Return the standard single-test-case error dict."""
    return {
        "passed":          False,
        "actual_output":   "",
        "error":           error,
        "execution_time":  round(execution_time, 3),
        "status":          status,
    }


def _should_try_judge0() -> bool:
    """Check if we should attempt connecting to Judge0 or skip straight to local execution."""
    global _judge0_healthy, _judge0_last_check
    if not USE_JUDGE0 or not JUDGE0_URL:
        return False
    if _judge0_healthy is False:
        if (time.time() - _judge0_last_check) < JUDGE0_COOLDOWN_SECONDS:
            return False
    return True


def _mark_judge0_success():
    global _judge0_healthy, _judge0_last_check
    if _judge0_healthy is not True:
        logger.info(f"Connected to Judge0 at {JUDGE0_URL}.")
    _judge0_healthy = True
    _judge0_last_check = time.time()


def _mark_judge0_failure():
    global _judge0_healthy, _judge0_last_check
    if _judge0_healthy is not False:
        logger.warning(
            f"Judge0 at {JUDGE0_URL} unreachable. "
            f"{'Using local fallback execution engine.' if ENABLE_LOCAL_FALLBACK else ''}"
        )
    _judge0_healthy = False
    _judge0_last_check = time.time()




def _run_local_python(code: str, stdin: str, timeout: int = 5) -> dict:
    wall_start = time.monotonic()
    with tempfile.TemporaryDirectory() as tmp_dir:
        script_path = os.path.join(tmp_dir, "solution.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)
        try:
            proc = subprocess.run(
                [sys.executable, script_path],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace",
                cwd=tmp_dir,
            )
            exec_time = time.monotonic() - wall_start
            if proc.returncode != 0:
                is_compile_err = "SyntaxError:" in proc.stderr or "IndentationError:" in proc.stderr
                return {
                    "stdout": proc.stdout or "",
                    "stderr": proc.stderr.strip(),
                    "compile_output": proc.stderr.strip() if is_compile_err else "",
                    "execution_time": exec_time,
                    "status": "Compilation Error" if is_compile_err else "Runtime Error",
                    "error": proc.stderr.strip() or f"Process exited with code {proc.returncode}.",
                }
            return {
                "stdout": proc.stdout or "",
                "stderr": "",
                "compile_output": "",
                "execution_time": exec_time,
                "status": "OK",
                "error": None,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"Time limit exceeded ({timeout}s).",
                "compile_output": "",
                "execution_time": float(timeout),
                "status": "Time Limit Exceeded",
                "error": f"Time limit exceeded ({timeout}s).",
            }
        except Exception as exc:
            return {
                "stdout": "",
                "stderr": str(exc),
                "compile_output": "",
                "execution_time": time.monotonic() - wall_start,
                "status": "Execution Error",
                "error": str(exc),
            }


def _run_local_javascript(code: str, stdin: str, timeout: int = 5) -> dict:
    node_bin = _find_binary(["node"])
    if not node_bin:
        return {
            "stdout": "",
            "stderr": "Node.js runtime not found.",
            "compile_output": "",
            "execution_time": 0.0,
            "status": "Internal Error",
            "error": "Node.js is not installed or not found in system paths.",
        }

   
    sanitized_code = re.sub(r"""['"]/dev/stdin['"]""", "0", code)

   
    is_esm = bool(re.search(r"^\s*(?:import|export)\s+", sanitized_code, re.MULTILINE))
    ext = "mjs" if is_esm else "js"

    wall_start = time.monotonic()
    env = _get_execution_env(node_bin)

    with tempfile.TemporaryDirectory() as tmp_dir:
        script_path = os.path.join(tmp_dir, f"solution.{ext}")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(sanitized_code)
        try:
            proc = subprocess.run(
                [node_bin, script_path],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace",
                env=env,
                cwd=tmp_dir,
            )
            exec_time = time.monotonic() - wall_start
            if proc.returncode != 0:
                is_compile_err = "SyntaxError:" in proc.stderr
                return {
                    "stdout": proc.stdout or "",
                    "stderr": proc.stderr.strip(),
                    "compile_output": proc.stderr.strip() if is_compile_err else "",
                    "execution_time": exec_time,
                    "status": "Compilation Error" if is_compile_err else "Runtime Error",
                    "error": proc.stderr.strip() or f"Node exited with code {proc.returncode}.",
                }
            return {
                "stdout": proc.stdout or "",
                "stderr": "",
                "compile_output": "",
                "execution_time": exec_time,
                "status": "OK",
                "error": None,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"Time limit exceeded ({timeout}s).",
                "compile_output": "",
                "execution_time": float(timeout),
                "status": "Time Limit Exceeded",
                "error": f"Time limit exceeded ({timeout}s).",
            }
        except Exception as exc:
            return {
                "stdout": "",
                "stderr": str(exc),
                "compile_output": "",
                "execution_time": time.monotonic() - wall_start,
                "status": "Execution Error",
                "error": str(exc),
            }


def _run_local_java(code: str, stdin: str, timeout: int = 5) -> dict:
    javac_bin = _find_binary(["javac"])
    java_bin = _find_binary(["java"])
    if not javac_bin or not java_bin:
        missing = []
        if not javac_bin:
            missing.append("javac")
        if not java_bin:
            missing.append("java")
        missing_str = "/".join(missing)
        return {
            "stdout": "",
            "stderr": f"Java JDK ({missing_str}) not found on system.",
            "compile_output": "",
            "execution_time": 0.0,
            "status": "Internal Error",
            "error": (
                f"Java JDK ({missing_str}) is not installed or not in PATH.\n"
                "To fix: Deploy with the included Dockerfile, or install OpenJDK (e.g. 'apt-get install -y default-jdk'), "
                "or set JAVA_HOME in your environment variables."
            ),
        }

    wall_start = time.monotonic()
    env = _get_execution_env(javac_bin)

    with tempfile.TemporaryDirectory() as tmp_dir:
       
        match = re.search(r'public\s+(?:final\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)', code)
        if match:
            class_name = match.group(1)
        else:
            match_any = re.search(r'class\s+([A-Za-z_][A-Za-z0-9_]*)', code)
            class_name = match_any.group(1) if match_any else "Solution"

        source_path = os.path.join(tmp_dir, f"{class_name}.java")
        with open(source_path, "w", encoding="utf-8") as f:
            f.write(code)

     
        compile_timeout = max(timeout, 30)

        try:
      
            compile_proc = subprocess.run(
                [javac_bin, f"{class_name}.java"],
                capture_output=True,
                text=True,
                timeout=compile_timeout,
                encoding="utf-8",
                errors="replace",
                env=env,
                cwd=tmp_dir,
            )
            if compile_proc.returncode != 0:
                return {
                    "stdout": "",
                    "stderr": compile_proc.stderr.strip(),
                    "compile_output": compile_proc.stderr.strip(),
                    "execution_time": time.monotonic() - wall_start,
                    "status": "Compilation Error",
                    "error": compile_proc.stderr.strip() or "Java compilation failed.",
                }

          
            run_proc = subprocess.run(
                [java_bin, "-cp", tmp_dir, class_name],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace",
                env=env,
                cwd=tmp_dir,
            )
            exec_time = time.monotonic() - wall_start
            if run_proc.returncode != 0:
                return {
                    "stdout": run_proc.stdout or "",
                    "stderr": run_proc.stderr.strip(),
                    "compile_output": "",
                    "execution_time": exec_time,
                    "status": "Runtime Error",
                    "error": run_proc.stderr.strip() or f"Java exited with code {run_proc.returncode}.",
                }
            return {
                "stdout": run_proc.stdout or "",
                "stderr": "",
                "compile_output": "",
                "execution_time": exec_time,
                "status": "OK",
                "error": None,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"Time limit exceeded ({timeout}s).",
                "compile_output": "",
                "execution_time": float(timeout),
                "status": "Time Limit Exceeded",
                "error": f"Time limit exceeded ({timeout}s).",
            }
        except Exception as exc:
            return {
                "stdout": "",
                "stderr": str(exc),
                "compile_output": "",
                "execution_time": time.monotonic() - wall_start,
                "status": "Execution Error",
                "error": str(exc),
            }


def _run_local_c_cpp(code: str, language: str, stdin: str, timeout: int = 5) -> dict:
    is_cpp = language in ("cpp", "c++")
    compiler = _find_binary(["g++", "clang++"]) if is_cpp else _find_binary(["gcc", "clang"])

    if not compiler:
        return {
            "stdout": "",
            "stderr": f"C/C++ compiler ({'g++' if is_cpp else 'gcc'}) not found on host.",
            "compile_output": "",
            "execution_time": 0.0,
            "status": "Compilation Error",
            "error": (
                f"{'C++' if is_cpp else 'C'} compiler (GCC/Clang) is not installed on this system. "
                "Please install MinGW-w64 or use Python, JavaScript, or Java, or start Judge0 via Docker."
            ),
        }

    wall_start = time.monotonic()
    env = _get_execution_env(compiler)

    with tempfile.TemporaryDirectory() as tmp_dir:
        ext = "cpp" if is_cpp else "c"
        src_path = os.path.join(tmp_dir, f"solution.{ext}")
        exe_path = os.path.join(tmp_dir, "solution.exe" if os.name == "nt" else "solution")
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(code)

      
        compile_timeout = max(timeout, 30)

        try:
         
            compile_proc = subprocess.run(
                [compiler, "-O2", src_path, "-o", exe_path],
                capture_output=True,
                text=True,
                timeout=compile_timeout,
                encoding="utf-8",
                errors="replace",
                env=env,
                cwd=tmp_dir,
            )
            if compile_proc.returncode != 0:
                return {
                    "stdout": "",
                    "stderr": compile_proc.stderr.strip(),
                    "compile_output": compile_proc.stderr.strip(),
                    "execution_time": time.monotonic() - wall_start,
                    "status": "Compilation Error",
                    "error": compile_proc.stderr.strip() or "C/C++ compilation failed.",
                }

         
            run_proc = subprocess.run(
                [exe_path],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace",
                env=env,
                cwd=tmp_dir,
            )
            exec_time = time.monotonic() - wall_start
            if run_proc.returncode != 0:
                return {
                    "stdout": run_proc.stdout or "",
                    "stderr": run_proc.stderr.strip(),
                    "compile_output": "",
                    "execution_time": exec_time,
                    "status": "Runtime Error",
                    "error": run_proc.stderr.strip() or f"Process exited with code {run_proc.returncode}.",
                }
            return {
                "stdout": run_proc.stdout or "",
                "stderr": "",
                "compile_output": "",
                "execution_time": exec_time,
                "status": "OK",
                "error": None,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"Time limit exceeded ({timeout}s).",
                "compile_output": "",
                "execution_time": float(timeout),
                "status": "Time Limit Exceeded",
                "error": f"Time limit exceeded ({timeout}s).",
            }
        except Exception as exc:
            return {
                "stdout": "",
                "stderr": str(exc),
                "compile_output": "",
                "execution_time": time.monotonic() - wall_start,
                "status": "Execution Error",
                "error": str(exc),
            }


def _execute_locally(code: str, language: str, stdin: str, timeout: int = 5) -> dict:
    """Dispatches execution to the appropriate local runtime."""
    lang = _normalize_language(language)
    if lang == "python":
        return _run_local_python(code, stdin, timeout)
    elif lang == "javascript":
        return _run_local_javascript(code, stdin, timeout)
    elif lang == "java":
        return _run_local_java(code, stdin, timeout)
    elif lang in ("cpp", "c"):
        return _run_local_c_cpp(code, lang, stdin, timeout)
    else:
        return {
            "stdout": "",
            "stderr": f"Unsupported language: '{language}'",
            "compile_output": "",
            "execution_time": 0.0,
            "status": "Compiler Error",
            "error": f"Unsupported language: '{language}'. Supported: python, javascript, java, c, c++",
        }




async def _submit_to_judge0(
    source_code: str,
    language_id: int,
    stdin: str = "",
    expected_output: str = "",
) -> dict:
    """
    POST a single submission to Judge0 with ?wait=true.
    Raises exception if connection fails or times out.
    """
    async with httpx.AsyncClient(timeout=JUDGE0_HTTP_TIMEOUT) as client:
        response = await client.post(
            f"{_SUBMISSIONS_ENDPOINT}?wait=true&base64_encoded=true",
            json={
                "source_code":     base64.b64encode(source_code.encode()).decode(),
                "language_id":     language_id,
                "stdin":           base64.b64encode(stdin.encode()).decode() if stdin else "",
                "expected_output": (
                    base64.b64encode(expected_output.encode()).decode()
                    if expected_output else ""
                ),
            },
        )
        response.raise_for_status()
        return response.json()




async def execute_single_test_case_async(
    code: str,
    test_input: str,
    expected_output: str,
    language: str = "python",
    timeout: int = 5,
) -> dict:
    """
    Execute *code* against one test case.
    Prefers Judge0 if available, gracefully falling back to local runner if unavailable.

    Returns:
        passed          bool
        actual_output   str
        error           str | None
        execution_time  float
        status          str
    """
    if not code or not code.strip():
        return _build_error_result("Code cannot be empty.", status="Execution Error")

    lang_id = _get_language_id(language)
    if lang_id is None:
        return _build_error_result(
            f"Unsupported language: '{language}'. Supported: python, javascript, java, c, c++",
            status="Compiler Error",
        )

    wall_start = time.monotonic()
    result = None

    
    if _should_try_judge0():
        try:
            result = await _submit_to_judge0(
                source_code=code,
                language_id=lang_id,
                stdin=str(test_input),
                expected_output=str(expected_output),
            )
            _mark_judge0_success()
        except (httpx.ConnectError, httpx.TimeoutException) as exc:
            _mark_judge0_failure()
            if not ENABLE_LOCAL_FALLBACK:
                return _build_error_result(
                    f"Cannot reach Judge0 at {JUDGE0_URL}. "
                    "Make sure `docker compose up -d` has been run and the server is healthy.",
                    status="Internal Error",
                    execution_time=round(time.monotonic() - wall_start, 3),
                )
        except httpx.HTTPStatusError as exc:
            return _build_error_result(
                f"Judge0 returned HTTP {exc.response.status_code}: {exc.response.text[:200]}",
                status="Internal Error",
                execution_time=round(time.monotonic() - wall_start, 3),
            )
        except Exception as exc:
            _mark_judge0_failure()
            if not ENABLE_LOCAL_FALLBACK:
                return _build_error_result(
                    f"Unexpected error communicating with Judge0: {str(exc)}",
                    status="Execution Error",
                    execution_time=round(time.monotonic() - wall_start, 3),
                )

   
    if result is not None:
        status_obj    = result.get("status") or {}
        status_id     = int(status_obj.get("id", 0))
        status_desc   = status_obj.get("description", "Unknown")
        stdout        = _decode_b64(result.get("stdout"))
        compile_out   = _decode_b64(result.get("compile_output"))
        stderr        = _decode_b64(result.get("stderr"))
        exec_time     = float(result.get("time") or 0.0)

        platform_status = _JUDGE0_STATUS.get(status_id, status_desc)

        if status_id in _COMPILE_ERROR_IDS:
            err_msg = compile_out or stderr or "Compilation failed."
            return {
                "passed":         False,
                "actual_output":  "",
                "error":          err_msg,
                "execution_time": round(exec_time, 3),
                "status":         "Compilation Error",
            }

        if status_id in _TLE_IDS:
            return {
                "passed":         False,
                "actual_output":  "",
                "error":          f"Time limit exceeded ({timeout}s).",
                "execution_time": round(exec_time or float(timeout), 3),
                "status":         "Time Limit Exceeded",
            }

        if status_id not in _FINISHED_IDS and status_id > 4:
            err_msg = stderr or compile_out or f"Execution failed ({status_desc})."
            return {
                "passed":         False,
                "actual_output":  stdout,
                "error":          err_msg,
                "execution_time": round(exec_time, 3),
                "status":         platform_status,
            }

        expected_clean = str(expected_output).strip()
        passed = _outputs_match(stdout, expected_clean)

        return {
            "passed":         passed,
            "actual_output":  stdout,
            "error":          None,
            "execution_time": round(exec_time, 3),
            "status":         "Passed" if passed else "Wrong Answer",
        }

   
    local_res = _execute_locally(
        code=code,
        language=language,
        stdin=str(test_input),
        timeout=timeout,
    )

    status = local_res["status"]
    stdout = str(local_res.get("stdout") or "").strip()
    exec_time = round(local_res.get("execution_time") or 0.0, 3)
    expected_clean = str(expected_output).strip()

    if status == "Compilation Error":
        return {
            "passed":         False,
            "actual_output":  "",
            "error":          local_res.get("error") or "Compilation failed.",
            "execution_time": exec_time,
            "status":         "Compilation Error",
        }

    if status == "Time Limit Exceeded":
        return {
            "passed":         False,
            "actual_output":  "",
            "error":          local_res.get("error") or f"Time limit exceeded ({timeout}s).",
            "execution_time": exec_time,
            "status":         "Time Limit Exceeded",
        }

    if status in ("Runtime Error", "Execution Error", "Internal Error", "Compiler Error"):
        return {
            "passed":         False,
            "actual_output":  stdout,
            "error":          local_res.get("error") or "Execution failed.",
            "execution_time": exec_time,
            "status":         status,
        }

   
    passed = _outputs_match(stdout, expected_clean)

    return {
        "passed":         passed,
        "actual_output":  stdout,
        "error":          None,
        "execution_time": exec_time,
        "status":         "Passed" if passed else "Wrong Answer",
    }




def execute_single_test_case(
    code: str,
    test_input: str,
    expected_output: str,
    language: str = "python",
    timeout: int = 5,
) -> dict:
    """
    Synchronous wrapper around execute_single_test_case_async.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError("closed")
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    try:
        return loop.run_until_complete(
            execute_single_test_case_async(
                code=code,
                test_input=test_input,
                expected_output=expected_output,
                language=language,
                timeout=timeout,
            )
        )
    except Exception as exc:
        return _build_error_result(
            f"Executor error: {str(exc)}",
            status="Execution Error",
        )




def run_test_suite(
    code: str,
    test_cases: list,
    language: str = "python",
    is_hidden: bool = False,
    timeout: int = 5,
) -> dict:
    """
    Run *code* against every test case in *test_cases*.

    Returns:
        {
            "total":      int,
            "passed":     int,
            "failed":     int,
            "all_passed": bool,
            "results":    list[dict],
        }
    """
    results: list[dict] = []
    passed_count = 0

    for idx, tc in enumerate(test_cases or []):
        test_inp     = str(tc.get("input", ""))
        expected_out = str(tc.get("expected_output", tc.get("output", "")))

        case_res = execute_single_test_case(
            code=code,
            test_input=test_inp,
            expected_output=expected_out,
            language=language,
            timeout=timeout,
        )

        if case_res["passed"]:
            passed_count += 1

        if not is_hidden:
            results.append({
                "test_index":      idx + 1,
                "input":           test_inp,
                "expected_output": expected_out,
                "actual_output":   case_res["actual_output"],
                "passed":          case_res["passed"],
                "status":          case_res["status"],
                "execution_time":  case_res["execution_time"],
                "error":           case_res["error"],
                "explanation":     tc.get("explanation", ""),
            })
        else:
            results.append({
                "test_index":     idx + 1,
                "category":       tc.get("category", "edge_case"),
                "passed":         case_res["passed"],
                "status":         case_res["status"],
                "execution_time": case_res["execution_time"],
                "error":          "Execution error occurred" if case_res.get("error") else None,
            })

    total = len(test_cases or [])
    return {
        "total":      total,
        "passed":     passed_count,
        "failed":     total - passed_count,
        "all_passed": (total > 0 and passed_count == total),
        "results":    results,
    }




def execute_code_custom_input(
    code: str,
    language: str,
    stdin_data: str = "",
) -> dict:
    """
    Execute *code* with arbitrary stdin (no expected_output comparison).
    Used by /coding/run for the Run button.
    """
    result = execute_single_test_case(
        code=code,
        test_input=stdin_data,
        expected_output="",
        language=language,
    )

    success = result["error"] is None and result["status"] not in (
        "Compilation Error", "Runtime Error", "Internal Error",
        "Execution Error", "Time Limit Exceeded",
    )

    return {
        "success":        success,
        "stdout":         result["actual_output"],
        "stderr":         result["error"] or "",
        "execution_time": result["execution_time"],
    }