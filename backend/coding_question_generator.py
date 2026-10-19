import json
import re
import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from groq import Groq
from rag_coding.retriever import retrieve_coding_knowledge

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY is missing from .env")

client = Groq(api_key=api_key)


def repair_pseudo_json_expressions(text: str) -> str:
    """Repairs pseudo-JSON where models write Python expressions like 'a' + 'b' or 'x' * 10."""
    if not text:
        return ""

    def eval_repeat(m):
        base = m.group(1)
        try:
            n = min(int(m.group(2)), 10)
            return '"' + (base * n) + '"'
        except Exception:
            return '"' + base + '"'

    text = re.sub(r'"([^"\\]*)"\s*\*\s*(\d+)', eval_repeat, text)

    for _ in range(10):
        new_text = re.sub(r'"([^"\\]*)"\s*\+\s*"([^"\\]*)"', r'"\1\2"', text)
        if new_text == text:
            break
        text = new_text

    text = re.sub(r',\s*([\}\]])', r'\1', text)
    return text


def safe_parse_json(text: str) -> Optional[dict]:
    """Robust JSON parser that handles code blocks, unescaped newlines, and trailing commas."""
    if not text:
        return None

    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

  
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start:end+1]

    cleaned = repair_pseudo_json_expressions(cleaned)

   
    try:
        res = json.loads(cleaned, strict=False)
        if isinstance(res, dict) and "title" in res:
            return res
    except Exception:
        pass

   
    try:
        sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', cleaned)
        res = json.loads(sanitized, strict=False)
        if isinstance(res, dict) and "title" in res:
            return res
    except Exception:
        pass

  
    try:
        open_braces = cleaned.count("{") - cleaned.count("}")
        open_brackets = cleaned.count("[") - cleaned.count("]")
        repaired = cleaned
        if open_brackets > 0:
            repaired += "]" * open_brackets
        if open_braces > 0:
            repaired += "}" * open_braces
        res = json.loads(repaired, strict=False)
        if isinstance(res, dict) and "title" in res:
            return res
    except Exception:
        pass

    return None


def get_default_starter_code(language: str = "python") -> str:
    lang = (language or "python").lower().strip()
    if lang in ["javascript", "js"]:
        return (
            "const fs = require('fs');\n\n"
            "function solve() {\n"
            "    const input = fs.readFileSync(0, 'utf-8').trim();\n"
            "    if (!input) return;\n"
            "    // Read input lines/tokens and print result\n"
            "}\n\n"
            "solve();\n"
        )
    elif lang in ["java"]:
        return (
            "import java.util.*;\n"
            "import java.io.*;\n\n"
            "public class Solution {\n"
            "    public static void main(String[] args) {\n"
            "        Scanner sc = new Scanner(System.in);\n"
            "        // Read from standard input and print output\n"
            "    }\n"
            "}\n"
        )
    elif lang in ["c"]:
        return (
            "#include <stdio.h>\n"
            "#include <stdlib.h>\n"
            "#include <string.h>\n\n"
            "int main() {\n"
            "    // Read from standard input (e.g. scanf / fgets)\n"
            "    // Write your solution here\n"
            "    return 0;\n"
            "}\n"
        )
    elif lang in ["cpp", "c++"]:
        return (
            "#include <iostream>\n"
            "#include <vector>\n"
            "#include <string>\n"
            "#include <algorithm>\n\n"
            "using namespace std;\n\n"
            "int main() {\n"
            "    ios_base::sync_with_stdio(false);\n"
            "    cin.tie(NULL);\n"
            "    // Read input and print output\n"
            "    return 0;\n"
            "}\n"
        )
    else:
        return (
            "import sys\n\n"
            "def solve():\n"
            "    # Read from standard input (e.g. sys.stdin.read().split())\n"
            "    pass\n\n"
            "if __name__ == '__main__':\n"
            "    solve()\n"
        )


def get_fallback_question(difficulty: str = "Easy", language: str = "python") -> dict:
    starter = get_default_starter_code(language)
    lang = (language or "python").lower().strip()

    if lang in ["javascript", "js"]:
        ref_code = (
            "const fs = require('fs');\n\n"
            "function solve() {\n"
            "    const input = fs.readFileSync(0, 'utf-8').trim();\n"
            "    if (!input) return;\n"
            "    const tokens = input.split(/\\s+/);\n"
            "    const n = parseInt(tokens[0], 10);\n"
            "    let sum = 0;\n"
            "    for (let i = 1; i <= n; i++) {\n"
            "        sum += parseInt(tokens[i], 10);\n"
            "    }\n"
            "    console.log(sum);\n"
            "}\n\n"
            "solve();\n"
        )
    elif lang in ["java"]:
        ref_code = (
            "import java.util.*;\n\n"
            "public class Solution {\n"
            "    public static void main(String[] args) {\n"
            "        Scanner sc = new Scanner(System.in);\n"
            "        if (!sc.hasNextInt()) return;\n"
            "        int n = sc.nextInt();\n"
            "        long sum = 0;\n"
            "        for (int i = 0; i < n; i++) {\n"
            "            sum += sc.nextLong();\n"
            "        }\n"
            "        System.out.println(sum);\n"
            "    }\n"
            "}\n"
        )
    elif lang in ["c"]:
        ref_code = (
            "#include <stdio.h>\n\n"
            "int main() {\n"
            "    int n;\n"
            "    if (scanf(\"%d\", &n) != 1) return 0;\n"
            "    long long sum = 0;\n"
            "    for (int i = 0; i < n; i++) {\n"
            "        long long val;\n"
            "        scanf(\"%lld\", &val);\n"
            "        sum += val;\n"
            "    }\n"
            "    printf(\"%lld\\n\", sum);\n"
            "    return 0;\n"
            "}\n"
        )
    elif lang in ["cpp", "c++"]:
        ref_code = (
            "#include <iostream>\n"
            "using namespace std;\n\n"
            "int main() {\n"
            "    ios_base::sync_with_stdio(false);\n"
            "    cin.tie(NULL);\n"
            "    int n;\n"
            "    if (!(cin >> n)) return 0;\n"
            "    long long sum = 0;\n"
            "    for (int i = 0; i < n; i++) {\n"
            "        long long val;\n"
            "        cin >> val;\n"
            "        sum += val;\n"
            "    }\n"
            "    cout << sum << \"\\n\";\n"
            "    return 0;\n"
            "}\n"
        )
    else:
        ref_code = (
            "import sys\n\n"
            "def solve():\n"
            "    lines = sys.stdin.read().split()\n"
            "    if not lines:\n"
            "        return\n"
            "    n = int(lines[0])\n"
            "    nums = [int(x) for x in lines[1:n+1]]\n"
            "    print(sum(nums))\n\n"
            "if __name__ == '__main__':\n"
            "    solve()\n"
        )

    return {
        "title": "Array Element Sum",
        "description": "Given a list of integers, compute and print the sum of all elements in the list.",
        "input_format": "The first line contains an integer N. The second line contains N space-separated integers.",
        "output_format": "Print a single integer representing the sum of the elements.",
        "constraints": [
            "1 <= N <= 1000",
            "-10^4 <= each integer <= 10^4"
        ],
        "starter_code": starter,
        "reference_solution": ref_code,
        "correct_answer": ref_code,
        "time_complexity": "O(N)",
        "space_complexity": "O(1)",
        "solution_explanation": "Iterates through the array accumulating the total sum in O(N) time with O(1) auxiliary space.",
        "sample_test_cases": [
            {
                "input": "4\n1 2 3 4",
                "expected_output": "10",
                "explanation": "1 + 2 + 3 + 4 = 10"
            },
            {
                "input": "3\n5 -2 7",
                "expected_output": "10",
                "explanation": "5 + (-2) + 7 = 10"
            }
        ],
        "hidden_test_cases": [
            {
                "input": "1\n42",
                "expected_output": "42",
                "category": "single_element"
            },
            {
                "input": "3\n0 0 0",
                "expected_output": "0",
                "category": "zero_elements"
            },
            {
                "input": "4\n-10 -20 -30 -40",
                "expected_output": "-100",
                "category": "negative_numbers"
            }
        ],
        "examples": [
            {
                "input": "4\n1 2 3 4",
                "output": "10",
                "explanation": "1 + 2 + 3 + 4 = 10"
            }
        ]
    }


def generate_coding_question(
    resume_text: str,
    difficulty: str = "Easy",
    language: str = "python",
    previous_questions: list = None
):
    avoid_clause = ""
    if previous_questions:
        prev_list = ", ".join([f'"{q}"' for q in previous_questions if q])
        if prev_list:
            avoid_clause = f"\n10. Do NOT generate problems similar to previously asked: {prev_list}. Pick a different algorithmic concept."

    clean_resume = resume_text.strip() if resume_text else "Software engineering candidate skilled in algorithms and data structures."
    starter_template = get_default_starter_code(language)

  
    rag_coding_context = retrieve_coding_knowledge(
        query=f"{difficulty} algorithm problem data structures",
        language=language,
        k=3
    )

    prompt = f"""
You are an AI coding interview question generator.

Generate ONE coding interview question based on the candidate's resume and knowledge base.
CRITICAL DESIGN REQUIREMENT: You MUST separate visible sample test cases from hidden test cases, AND provide the optimal working reference solution (Correct Answer).
- Visible sample tests (2 cases): Used by candidate during interview to test and debug their code.
- Hidden test cases (3 to 4 cases): Used during final submission to evaluate edge cases, boundary conditions, zero/negative inputs, or empty/single elements. Candidate should NOT see hidden test cases upfront.
- Reference Solution (Correct Answer): Working optimal code in {language} that reads stdin and prints stdout.

Candidate Resume:
{clean_resume}

Difficulty:
{difficulty}

Programming Language:
{language}

{f"RAG CODING KNOWLEDGE BASE CONTEXT:\n{rag_coding_context}\n" if rag_coding_context else ""}

Requirements:
1. Generate exactly ONE coding problem suitable for {language}.
2. The problem must strictly match the requested difficulty: {difficulty}.
3. Use skills/topics mentioned in the resume and RAG knowledge base.
4. Provide the complete optimal reference solution code (Correct Answer) in {language}.
5. Standard I/O (stdin / stdout): The problem must read input from standard input (stdin) and print output to standard output (stdout).
6. Provide exactly 2 visible sample test cases with clear explanations.
7. Provide 3-4 hidden test cases testing edge cases and boundary limits.
8. CRITICAL SYNTAX RULE: All JSON values must be plain literal strings. NEVER use code expressions, string concatenation ('+' operator), or repetition ('*' operator) in JSON strings. Write literal inputs directly (e.g. "5\\n1 2 3 4 5"). Keep boundary inputs concrete and under 100 characters.
9. Return ONLY a valid JSON object. Do not include markdown codeblocks.{avoid_clause}

Return exactly this JSON structure:

{{
    "title": "Problem title",
    "description": "Detailed problem description explaining the task clearly",
    "input_format": "Input format description (e.g. First line contains integer N, followed by...)",
    "output_format": "Output format description (e.g. Print a single integer representing...)",
    "constraints": [
        "1 <= N <= 10^5",
        "0 <= elements <= 10^9"
    ],
    "starter_code": {json.dumps(starter_template)},
    "reference_solution": "Complete working optimal solution code in {language} reading stdin and printing stdout",
    "correct_answer": "Complete working optimal solution code in {language}",
    "time_complexity": "O(N)",
    "space_complexity": "O(1)",
    "solution_explanation": "Explanation of the optimal approach",
    "sample_test_cases": [
        {{
            "input": "Sample input string exactly as passed to stdin",
            "expected_output": "Sample expected output string exactly as printed to stdout",
            "explanation": "Why this output is produced"
        }}
    ],
    "hidden_test_cases": [
        {{
            "input": "Hidden input string for edge/boundary case",
            "expected_output": "Expected output string",
            "category": "edge_case"
        }},
        {{
            "input": "Another hidden test input",
            "expected_output": "Expected output string",
            "category": "boundary_limit"
        }},
        {{
            "input": "Another hidden test input",
            "expected_output": "Expected output string",
            "category": "special_values"
        }}
    ],
    "examples": [
        {{
            "input": "Same as sample_test_cases[0].input",
            "output": "Same as sample_test_cases[0].expected_output",
            "explanation": "Same as sample_test_cases[0].explanation"
        }}
    ]
}}
"""

    content = ""
    parsed_q = None

 
    try:
        response = client.chat.completions.create(
            model=os.getenv("MODEL_NAME"),
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional coding interview question generator. "
                        "Return strictly valid JSON only. Every string value must be validly JSON-escaped. "
                        "In programming code, escape all inner quotes as \\\" and write newlines as \\n. "
                        "Never output unescaped raw newlines or quotes inside JSON values."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=4096
        )
        content = response.choices[0].message.content.strip()
        parsed_q = safe_parse_json(content)
    except Exception as api_err:
        err_msg = str(api_err)
        print("Groq JSON generation notice (will retry with plain format):", err_msg[:160])
        parsed_q = None

  
    if not parsed_q:
        try:
            print("Retrying coding question generation with flexible plain JSON format...")
            retry_resp = client.chat.completions.create(
                model=os.getenv("MODEL_NAME"),
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a professional coding interview question generator. "
                            "Output ONLY a raw valid JSON object starting with { and ending with }. "
                            "Do not include markdown codeblocks or preamble text. "
                            "Escape all double quotes in code as \\\"."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt + "\n\nCRITICAL: Return valid JSON object ONLY. Escape all quotes inside code strings."
                    }
                ],
                temperature=0.2,
                max_tokens=4096
            )
            content = retry_resp.choices[0].message.content.strip()
            parsed_q = safe_parse_json(content)
        except Exception as retry_err:
            print("Retry generation failed:", retry_err)
            return get_fallback_question(difficulty=difficulty, language=language)

    if not parsed_q:
        print("Could not parse AI question JSON, using fallback question.")
        return get_fallback_question(difficulty=difficulty, language=language)

    question = parsed_q

   
    required_fields = [
        "title",
        "description",
        "input_format",
        "output_format"
    ]

    for field in required_fields:
        if field not in question or not question[field]:
            print(f"Missing required field {field}, using fallback")
            return get_fallback_question(difficulty=difficulty, language=language)

  
    sample_tests = question.get("sample_test_cases") or []
    if not sample_tests and question.get("examples"):
        sample_tests = []
        for ex in question.get("examples", []):
            sample_tests.append({
                "input": str(ex.get("input", "")),
                "expected_output": str(ex.get("output", ex.get("expected_output", ""))),
                "explanation": ex.get("explanation", "")
            })

    normalized_samples = []
    for s in sample_tests:
        inp = str(s.get("input", "")).strip()
        exp = str(s.get("expected_output", s.get("output", ""))).strip()
        normalized_samples.append({
            "input": inp,
            "expected_output": exp,
            "explanation": s.get("explanation", "")
        })

    if not normalized_samples:
        normalized_samples.append({
            "input": "0",
            "expected_output": "0",
            "explanation": "Default sample case"
        })

   
    hidden_tests = question.get("hidden_test_cases") or []
    normalized_hidden = []
    for h in hidden_tests:
        inp = str(h.get("input", "")).strip()
        exp = str(h.get("expected_output", h.get("output", ""))).strip()
        cat = h.get("category", "edge_case")
        normalized_hidden.append({
            "input": inp,
            "expected_output": exp,
            "category": cat
        })

    if not normalized_hidden:
        normalized_hidden = [
            {
                "input": normalized_samples[0]["input"],
                "expected_output": normalized_samples[0]["expected_output"],
                "category": "standard_check"
            }
        ]

  
    examples = []
    for s in normalized_samples:
        examples.append({
            "input": s["input"],
            "output": s["expected_output"],
            "explanation": s.get("explanation", "")
        })

    question["sample_test_cases"] = normalized_samples
    question["hidden_test_cases"] = normalized_hidden
    question["examples"] = examples

    if not question.get("starter_code"):
        question["starter_code"] = get_default_starter_code(language)

    return question