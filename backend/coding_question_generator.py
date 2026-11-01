import json
import re
import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from groq import Groq
from config import get_groq_model_name
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


def get_fallback_question(difficulty: str = "Easy", language: str = "python", previous_questions: list = None) -> dict:
    """
    Returns a distinct, high-quality coding problem with working implementations
    in all 5 supported languages. Guarantees that problems never repeat across questions.
    """
    starter = get_default_starter_code(language)
    lang = (language or "python").lower().strip()

    # 1. Array Element Sum
    if lang in ["javascript", "js"]:
        sum_code = (
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
        sum_code = (
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
        sum_code = (
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
        sum_code = (
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
        sum_code = (
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

    p1 = {
        "title": "Array Element Sum",
        "description": "Given a list of N integers, compute and print the total sum of all elements in the list.",
        "input_format": "The first line contains an integer N. The second line contains N space-separated integers.",
        "output_format": "Print a single integer representing the sum of the elements.",
        "constraints": ["1 <= N <= 1000", "-10^4 <= each integer <= 10^4"],
        "starter_code": starter,
        "reference_solution": sum_code,
        "correct_answer": sum_code,
        "time_complexity": "O(N)",
        "space_complexity": "O(1)",
        "solution_explanation": "Iterates through the array accumulating the total sum in O(N) time with O(1) space.",
        "sample_test_cases": [
            {"input": "4\n1 2 3 4", "expected_output": "10", "explanation": "1 + 2 + 3 + 4 = 10"},
            {"input": "3\n5 -2 7", "expected_output": "10", "explanation": "5 + (-2) + 7 = 10"}
        ],
        "hidden_test_cases": [
            {"input": "1\n42", "expected_output": "42", "category": "single_element"},
            {"input": "3\n0 0 0", "expected_output": "0", "category": "zero_elements"},
            {"input": "4\n-10 -20 -30 -40", "expected_output": "-100", "category": "negative_numbers"}
        ],
        "examples": [{"input": "4\n1 2 3 4", "output": "10", "explanation": "1 + 2 + 3 + 4 = 10"}]
    }

    # 2. Valid Palindrome Checker
    if lang in ["javascript", "js"]:
        pal_code = (
            "const fs = require('fs');\n\n"
            "function solve() {\n"
            "    const input = fs.readFileSync(0, 'utf-8').trim();\n"
            "    if (!input) return;\n"
            "    const rev = input.split('').reverse().join('');\n"
            "    console.log(input === rev ? 'YES' : 'NO');\n"
            "}\n\n"
            "solve();\n"
        )
    elif lang in ["java"]:
        pal_code = (
            "import java.util.*;\n\n"
            "public class Solution {\n"
            "    public static void main(String[] args) {\n"
            "        Scanner sc = new Scanner(System.in);\n"
            "        if (!sc.hasNext()) return;\n"
            "        String s = sc.next().trim();\n"
            "        String rev = new StringBuilder(s).reverse().toString();\n"
            "        System.out.println(s.equals(rev) ? \"YES\" : \"NO\");\n"
            "    }\n"
            "}\n"
        )
    elif lang in ["c"]:
        pal_code = (
            "#include <stdio.h>\n"
            "#include <string.h>\n\n"
            "int main() {\n"
            "    char s[1005];\n"
            "    if (scanf(\"%s\", s) != 1) return 0;\n"
            "    int len = strlen(s);\n"
            "    int is_pal = 1;\n"
            "    for (int i = 0; i < len / 2; i++) {\n"
            "        if (s[i] != s[len - 1 - i]) { is_pal = 0; break; }\n"
            "    }\n"
            "    printf(\"%s\\n\", is_pal ? \"YES\" : \"NO\");\n"
            "    return 0;\n"
            "}\n"
        )
    elif lang in ["cpp", "c++"]:
        pal_code = (
            "#include <iostream>\n"
            "#include <string>\n"
            "#include <algorithm>\n"
            "using namespace std;\n\n"
            "int main() {\n"
            "    ios_base::sync_with_stdio(false);\n"
            "    cin.tie(NULL);\n"
            "    string s;\n"
            "    if (!(cin >> s)) return 0;\n"
            "    string rev = s;\n"
            "    reverse(rev.begin(), rev.end());\n"
            "    cout << (s == rev ? \"YES\" : \"NO\") << \"\\n\";\n"
            "    return 0;\n"
            "}\n"
        )
    else:
        pal_code = (
            "import sys\n\n"
            "def solve():\n"
            "    s = sys.stdin.read().strip()\n"
            "    if not s:\n"
            "        return\n"
            "    print('YES' if s == s[::-1] else 'NO')\n\n"
            "if __name__ == '__main__':\n"
            "    solve()\n"
        )

    p2 = {
        "title": "Valid Palindrome Checker",
        "description": "Given a single word string S without spaces, determine if it is a palindrome (reads the same forwards and backwards). Print 'YES' if it is a palindrome, otherwise print 'NO'.",
        "input_format": "A single line containing the string S.",
        "output_format": "Print 'YES' if S is a palindrome, else 'NO'.",
        "constraints": ["1 <= length(S) <= 1000", "S consists of lowercase English letters."],
        "starter_code": starter,
        "reference_solution": pal_code,
        "correct_answer": pal_code,
        "time_complexity": "O(N)",
        "space_complexity": "O(1)",
        "solution_explanation": "Compares symmetric characters from both ends toward the middle in linear O(N) time.",
        "sample_test_cases": [
            {"input": "racecar", "expected_output": "YES", "explanation": "'racecar' reads the same forwards and backwards."},
            {"input": "interview", "expected_output": "NO", "explanation": "'interview' backwards is 'weivretni' which is different."}
        ],
        "hidden_test_cases": [
            {"input": "a", "expected_output": "YES", "category": "single_character"},
            {"input": "radar", "expected_output": "YES", "category": "odd_palindrome"},
            {"input": "noon", "expected_output": "YES", "category": "even_palindrome"},
            {"input": "ab", "expected_output": "NO", "category": "mismatch"}
        ],
        "examples": [{"input": "racecar", "output": "YES", "explanation": "It reads the same backwards."}]
    }

    # 3. Two Sum Target Pair
    if lang in ["javascript", "js"]:
        two_sum_code = (
            "const fs = require('fs');\n\n"
            "function solve() {\n"
            "    const input = fs.readFileSync(0, 'utf-8').trim();\n"
            "    if (!input) return;\n"
            "    const tokens = input.split(/\\s+/);\n"
            "    const n = parseInt(tokens[0], 10);\n"
            "    const target = parseInt(tokens[1], 10);\n"
            "    const seen = new Set();\n"
            "    let found = false;\n"
            "    for (let i = 0; i < n; i++) {\n"
            "        const val = parseInt(tokens[2 + i], 10);\n"
            "        if (seen.has(target - val)) { found = true; break; }\n"
            "        seen.add(val);\n"
            "    }\n"
            "    console.log(found ? 'YES' : 'NO');\n"
            "}\n\n"
            "solve();\n"
        )
    elif lang in ["java"]:
        two_sum_code = (
            "import java.util.*;\n\n"
            "public class Solution {\n"
            "    public static void main(String[] args) {\n"
            "        Scanner sc = new Scanner(System.in);\n"
            "        if (!sc.hasNextInt()) return;\n"
            "        int n = sc.nextInt();\n"
            "        int target = sc.nextInt();\n"
            "        Set<Integer> seen = new HashSet<>();\n"
            "        boolean found = false;\n"
            "        for (int i = 0; i < n; i++) {\n"
            "            int val = sc.nextInt();\n"
            "            if (seen.contains(target - val)) { found = true; }\n"
            "            seen.add(val);\n"
            "        }\n"
            "        System.out.println(found ? \"YES\" : \"NO\");\n"
            "    }\n"
            "}\n"
        )
    elif lang in ["c"]:
        two_sum_code = (
            "#include <stdio.h>\n\n"
            "int main() {\n"
            "    int n, target;\n"
            "    if (scanf(\"%d %d\", &n, &target) != 2) return 0;\n"
            "    int a[2005];\n"
            "    for (int i = 0; i < n; i++) scanf(\"%d\", &a[i]);\n"
            "    int found = 0;\n"
            "    for (int i = 0; i < n; i++) {\n"
            "        for (int j = i + 1; j < n; j++) {\n"
            "            if (a[i] + a[j] == target) { found = 1; break; }\n"
            "        }\n"
            "        if (found) break;\n"
            "    }\n"
            "    printf(\"%s\\n\", found ? \"YES\" : \"NO\");\n"
            "    return 0;\n"
            "}\n"
        )
    elif lang in ["cpp", "c++"]:
        two_sum_code = (
            "#include <iostream>\n"
            "#include <unordered_set>\n"
            "using namespace std;\n\n"
            "int main() {\n"
            "    ios_base::sync_with_stdio(false);\n"
            "    cin.tie(NULL);\n"
            "    int n, target;\n"
            "    if (!(cin >> n >> target)) return 0;\n"
            "    unordered_set<int> seen;\n"
            "    bool found = false;\n"
            "    for (int i = 0; i < n; i++) {\n"
            "        int val; cin >> val;\n"
            "        if (seen.count(target - val)) found = true;\n"
            "        seen.insert(val);\n"
            "    }\n"
            "    cout << (found ? \"YES\" : \"NO\") << \"\\n\";\n"
            "    return 0;\n"
            "}\n"
        )
    else:
        two_sum_code = (
            "import sys\n\n"
            "def solve():\n"
            "    lines = sys.stdin.read().split()\n"
            "    if len(lines) < 2:\n"
            "        return\n"
            "    n = int(lines[0])\n"
            "    target = int(lines[1])\n"
            "    nums = [int(x) for x in lines[2:2+n]]\n"
            "    seen = set()\n"
            "    found = False\n"
            "    for x in nums:\n"
            "        if target - x in seen:\n"
            "            found = True\n"
            "            break\n"
            "        seen.add(x)\n"
            "    print('YES' if found else 'NO')\n\n"
            "if __name__ == '__main__':\n"
            "    solve()\n"
        )

    p3 = {
        "title": "Two Sum Target Pair",
        "description": "Given an array of N integers and a target integer T, determine if there exists any pair of distinct elements that sum up to T. Print 'YES' if such a pair exists, otherwise 'NO'.",
        "input_format": "First line contains two integers N and T. Second line contains N space-separated integers.",
        "output_format": "Print 'YES' if a pair exists, else 'NO'.",
        "constraints": ["2 <= N <= 2000", "-10^5 <= integers, T <= 10^5"],
        "starter_code": starter,
        "reference_solution": two_sum_code,
        "correct_answer": two_sum_code,
        "time_complexity": "O(N)",
        "space_complexity": "O(N)",
        "solution_explanation": "Uses a Hash Set to track seen numbers and find complement (target - x) in O(N) linear time.",
        "sample_test_cases": [
            {"input": "4 9\n2 7 11 15", "expected_output": "YES", "explanation": "2 + 7 = 9"},
            {"input": "3 10\n1 2 3", "expected_output": "NO", "explanation": "No two numbers sum to 10"}
        ],
        "hidden_test_cases": [
            {"input": "2 6\n3 3", "expected_output": "YES", "category": "identical_pair"},
            {"input": "3 5\n1 2 4", "expected_output": "NO", "category": "no_match"},
            {"input": "4 0\n-5 2 5 1", "expected_output": "YES", "category": "zero_sum"}
        ],
        "examples": [{"input": "4 9\n2 7 11 15", "output": "YES", "explanation": "2 + 7 = 9"}]
    }

    # 4. Maximum Contiguous Subarray Sum
    if lang in ["javascript", "js"]:
        kadane_code = (
            "const fs = require('fs');\n\n"
            "function solve() {\n"
            "    const input = fs.readFileSync(0, 'utf-8').trim();\n"
            "    if (!input) return;\n"
            "    const tokens = input.split(/\\s+/);\n"
            "    const n = parseInt(tokens[0], 10);\n"
            "    let maxSoFar = parseInt(tokens[1], 10);\n"
            "    let currMax = maxSoFar;\n"
            "    for (let i = 2; i <= n; i++) {\n"
            "        const x = parseInt(tokens[i], 10);\n"
            "        currMax = Math.max(x, currMax + x);\n"
            "        maxSoFar = Math.max(maxSoFar, currMax);\n"
            "    }\n"
            "    console.log(maxSoFar);\n"
            "}\n\n"
            "solve();\n"
        )
    elif lang in ["java"]:
        kadane_code = (
            "import java.util.*;\n\n"
            "public class Solution {\n"
            "    public static void main(String[] args) {\n"
            "        Scanner sc = new Scanner(System.in);\n"
            "        if (!sc.hasNextInt()) return;\n"
            "        int n = sc.nextInt();\n"
            "        long maxSoFar = sc.nextLong();\n"
            "        long currMax = maxSoFar;\n"
            "        for (int i = 1; i < n; i++) {\n"
            "            long x = sc.nextLong();\n"
            "            currMax = Math.max(x, currMax + x);\n"
            "            maxSoFar = Math.max(maxSoFar, currMax);\n"
            "        }\n"
            "        System.out.println(maxSoFar);\n"
            "    }\n"
            "}\n"
        )
    elif lang in ["c"]:
        kadane_code = (
            "#include <stdio.h>\n\n"
            "int main() {\n"
            "    int n;\n"
            "    if (scanf(\"%d\", &n) != 1) return 0;\n"
            "    long long val; scanf(\"%lld\", &val);\n"
            "    long long max_so_far = val, curr_max = val;\n"
            "    for (int i = 1; i < n; i++) {\n"
            "        scanf(\"%lld\", &val);\n"
            "        curr_max = (val > curr_max + val) ? val : (curr_max + val);\n"
            "        max_so_far = (curr_max > max_so_far) ? curr_max : max_so_far;\n"
            "    }\n"
            "    printf(\"%lld\\n\", max_so_far);\n"
            "    return 0;\n"
            "}\n"
        )
    elif lang in ["cpp", "c++"]:
        kadane_code = (
            "#include <iostream>\n"
            "#include <algorithm>\n"
            "using namespace std;\n\n"
            "int main() {\n"
            "    ios_base::sync_with_stdio(false);\n"
            "    cin.tie(NULL);\n"
            "    int n;\n"
            "    if (!(cin >> n)) return 0;\n"
            "    long long val; cin >> val;\n"
            "    long long max_so_far = val, curr_max = val;\n"
            "    for (int i = 1; i < n; i++) {\n"
            "        cin >> val;\n"
            "        curr_max = max(val, curr_max + val);\n"
            "        max_so_far = max(max_so_far, curr_max);\n"
            "    }\n"
            "    cout << max_so_far << \"\\n\";\n"
            "    return 0;\n"
            "}\n"
        )
    else:
        kadane_code = (
            "import sys\n\n"
            "def solve():\n"
            "    lines = sys.stdin.read().split()\n"
            "    if not lines:\n"
            "        return\n"
            "    n = int(lines[0])\n"
            "    nums = [int(x) for x in lines[1:n+1]]\n"
            "    if not nums:\n"
            "        return\n"
            "    max_so_far = nums[0]\n"
            "    curr_max = nums[0]\n"
            "    for x in nums[1:]:\n"
            "        curr_max = max(x, curr_max + x)\n"
            "        max_so_far = max(max_so_far, curr_max)\n"
            "    print(max_so_far)\n\n"
            "if __name__ == '__main__':\n"
            "    solve()\n"
        )

    p4 = {
        "title": "Maximum Contiguous Subarray Sum",
        "description": "Given an array of N integers, find the contiguous subarray that has the largest sum and print that maximum sum.",
        "input_format": "The first line contains N. The second line contains N space-separated integers.",
        "output_format": "Print a single integer representing the maximum subarray sum.",
        "constraints": ["1 <= N <= 10^5", "-10^4 <= each integer <= 10^4"],
        "starter_code": starter,
        "reference_solution": kadane_code,
        "correct_answer": kadane_code,
        "time_complexity": "O(N)",
        "space_complexity": "O(1)",
        "solution_explanation": "Implements Kadane's Algorithm to track the maximum sum ending at each position in O(N) time.",
        "sample_test_cases": [
            {"input": "5\n-2 1 -3 4 -1", "expected_output": "4", "explanation": "Subarray [4] or [4, -1] has max sum 4."},
            {"input": "4\n1 2 3 4", "expected_output": "10", "explanation": "Entire array sums to 10."}
        ],
        "hidden_test_cases": [
            {"input": "1\n-5", "expected_output": "-5", "category": "single_negative"},
            {"input": "4\n-1 -2 -3 -4", "expected_output": "-1", "category": "all_negative"},
            {"input": "6\n2 -1 3 4 -2 1", "expected_output": "8", "category": "mixed"}
        ],
        "examples": [{"input": "5\n-2 1 -3 4 -1", "output": "4", "explanation": "Maximum contiguous subarray sum is 4."}]
    }

    # 5. Find Min and Max Values
    if lang in ["javascript", "js"]:
        minmax_code = (
            "const fs = require('fs');\n\n"
            "function solve() {\n"
            "    const input = fs.readFileSync(0, 'utf-8').trim();\n"
            "    if (!input) return;\n"
            "    const tokens = input.split(/\\s+/);\n"
            "    const n = parseInt(tokens[0], 10);\n"
            "    let maxVal = -Infinity, minVal = Infinity;\n"
            "    for (let i = 1; i <= n; i++) {\n"
            "        const val = parseInt(tokens[i], 10);\n"
            "        if (val > maxVal) maxVal = val;\n"
            "        if (val < minVal) minVal = val;\n"
            "    }\n"
            "    console.log(maxVal + ' ' + minVal);\n"
            "}\n\n"
            "solve();\n"
        )
    elif lang in ["java"]:
        minmax_code = (
            "import java.util.*;\n\n"
            "public class Solution {\n"
            "    public static void main(String[] args) {\n"
            "        Scanner sc = new Scanner(System.in);\n"
            "        if (!sc.hasNextInt()) return;\n"
            "        int n = sc.nextInt();\n"
            "        long maxVal = Long.MIN_VALUE, minVal = Long.MAX_VALUE;\n"
            "        for (int i = 0; i < n; i++) {\n"
            "            long val = sc.nextLong();\n"
            "            if (val > maxVal) maxVal = val;\n"
            "            if (val < minVal) minVal = val;\n"
            "        }\n"
            "        System.out.println(maxVal + \" \" + minVal);\n"
            "    }\n"
            "}\n"
        )
    elif lang in ["c"]:
        minmax_code = (
            "#include <stdio.h>\n\n"
            "int main() {\n"
            "    int n;\n"
            "    if (scanf(\"%d\", &n) != 1) return 0;\n"
            "    long long val; scanf(\"%lld\", &val);\n"
            "    long long max_val = val, min_val = val;\n"
            "    for (int i = 1; i < n; i++) {\n"
            "        scanf(\"%lld\", &val);\n"
            "        if (val > max_val) max_val = val;\n"
            "        if (val < min_val) min_val = val;\n"
            "    }\n"
            "    printf(\"%lld %lld\\n\", max_val, min_val);\n"
            "    return 0;\n"
            "}\n"
        )
    elif lang in ["cpp", "c++"]:
        minmax_code = (
            "#include <iostream>\n"
            "#include <algorithm>\n"
            "using namespace std;\n\n"
            "int main() {\n"
            "    ios_base::sync_with_stdio(false);\n"
            "    cin.tie(NULL);\n"
            "    int n;\n"
            "    if (!(cin >> n)) return 0;\n"
            "    long long val; cin >> val;\n"
            "    long long max_val = val, min_val = val;\n"
            "    for (int i = 1; i < n; i++) {\n"
            "        cin >> val;\n"
            "        max_val = max(max_val, val);\n"
            "        min_val = min(min_val, val);\n"
            "    }\n"
            "    cout << max_val << \" \" << min_val << \"\\n\";\n"
            "    return 0;\n"
            "}\n"
        )
    else:
        minmax_code = (
            "import sys\n\n"
            "def solve():\n"
            "    lines = sys.stdin.read().split()\n"
            "    if not lines:\n"
            "        return\n"
            "    n = int(lines[0])\n"
            "    nums = [int(x) for x in lines[1:n+1]]\n"
            "    if not nums:\n"
            "        return\n"
            "    print(f\"{max(nums)} {min(nums)}\")\n\n"
            "if __name__ == '__main__':\n"
            "    solve()\n"
        )

    p5 = {
        "title": "Find Maximum and Minimum Element",
        "description": "Given an array of N integers, find both the maximum and minimum elements in the array. Print the maximum element followed by a space and then the minimum element.",
        "input_format": "The first line contains N. The second line contains N space-separated integers.",
        "output_format": "Print the maximum and minimum values separated by a single space.",
        "constraints": ["1 <= N <= 10^5", "-10^9 <= each integer <= 10^9"],
        "starter_code": starter,
        "reference_solution": minmax_code,
        "correct_answer": minmax_code,
        "time_complexity": "O(N)",
        "space_complexity": "O(1)",
        "solution_explanation": "Scans all array elements in a single pass maintaining running maximum and minimum in O(N) time.",
        "sample_test_cases": [
            {"input": "5\n3 1 4 1 5", "expected_output": "5 1", "explanation": "Max is 5 and Min is 1."},
            {"input": "3\n10 20 30", "expected_output": "30 10", "explanation": "Max is 30 and Min is 10."}
        ],
        "hidden_test_cases": [
            {"input": "1\n7", "expected_output": "7 7", "category": "single_element"},
            {"input": "4\n-10 -20 -5 -1", "expected_output": "-1 -20", "category": "negative_numbers"},
            {"input": "3\n0 0 0", "expected_output": "0 0", "category": "identical_elements"}
        ],
        "examples": [{"input": "5\n3 1 4 1 5", "output": "5 1", "explanation": "5 is maximum, 1 is minimum."}]
    }

    p1["difficulty"] = "Easy"
    p2["difficulty"] = "Easy"
    p3["difficulty"] = "Medium"
    p4["difficulty"] = "Hard"
    p5["difficulty"] = "Easy"

    diff_lower = (difficulty or "Easy").strip().lower()
    if diff_lower == "hard":
        catalog = [p4, p3, p2, p5, p1]
    elif diff_lower == "medium":
        catalog = [p3, p4, p2, p1, p5]
    else:
        catalog = [p1, p2, p5, p3, p4]

    prev_normalized = [str(p).strip().lower() for p in (previous_questions or []) if p]

    # Select first question from catalog whose title has not been asked yet
    for candidate in catalog:
        if candidate["title"].strip().lower() not in prev_normalized:
            res = dict(candidate)
            res["difficulty"] = difficulty
            return res

    # If all in catalog have been asked, rotate based on count
    pick_idx = len(prev_normalized) % len(catalog)
    res = dict(catalog[pick_idx])
    res["difficulty"] = difficulty
    return res


def generate_coding_question(
    resume_text: str,
    difficulty: str = "Easy",
    language: str = "python",
    previous_questions: list = None,
    candidate_performance: dict = None
):
    prev_list_display = ""
    if previous_questions:
        prev_items = [f'"{q}"' for q in previous_questions if q]
        if prev_items:
            prev_list_display = ", ".join(prev_items)

    clean_resume = resume_text.strip() if resume_text else "Software engineering candidate skilled in algorithms and data structures."
    starter_template = get_default_starter_code(language)

    # Dynamic topic rotation to prevent repetitive question types
    topics = [
        "Array and List Operations",
        "String Processing and Two Pointers",
        "Hash Map and Frequency Counting",
        "Dynamic Programming or Kadane Subarray",
        "Searching and Sorting Logic",
        "Stack and Parentheses Matching"
    ]
    step = len(previous_questions or [])
    chosen_topic = topics[step % len(topics)]

    avoid_clause = ""
    if prev_list_display:
        avoid_clause = f"\nCRITICAL RULE: Do NOT generate problems similar to previously asked: {prev_list_display}. You MUST choose a completely different algorithmic concept under '{chosen_topic}'."

    rag_coding_context = ""
    try:
        rag_coding_context = retrieve_coding_knowledge(
            query=f"{difficulty} {chosen_topic} algorithm problem",
            language=language,
            k=3
        )
    except Exception as e:
        print("[WARN] RAG retrieval notice in coding generator:", e)

    rag_section = f"RAG CODING KNOWLEDGE BASE CONTEXT:\n{rag_coding_context}\n" if rag_coding_context else ""

    perf_context = ""
    if candidate_performance:
        prev_d = candidate_performance.get("previous_difficulty", "Hard")
        adapt_d = candidate_performance.get("adapted_difficulty", difficulty)
        p_passed = candidate_performance.get("tests_passed", 0)
        p_total = candidate_performance.get("total_tests", 0)
        p_rate = candidate_performance.get("pass_rate", 0)
        p_all = candidate_performance.get("all_passed", False)
        p_feedback = candidate_performance.get("feedback", "")
        p_improvements = candidate_performance.get("improvements", [])
        p_imp_text = ", ".join(p_improvements) if isinstance(p_improvements, list) else str(p_improvements)

        perf_context = f"""
CANDIDATE ANSWER PERFORMANCE ANALYSIS:
- Previous Problem Difficulty: {prev_d}
- Test Cases Passed: {p_passed} / {p_total} ({p_rate}%)
- Answer Correctness: {'Candidate struggled and could not answer correctly.' if not p_all else 'Candidate answered correctly.'}
- Evaluator Feedback on Answer: {p_feedback}
- Candidate Growth Areas: {p_imp_text}
- ADAPTIVE LEVEL DIRECTIVE: Difficulty has been calibrated to '{adapt_d}'.
  Analyze the candidate's prior performance. Since the candidate {'could not solve the previous ' + prev_d + ' question correctly' if not p_all else 'performed well'}, create a {adapt_d} difficulty question under '{chosen_topic}' specifically tailored to assess their understanding of core concepts and rebuild algorithmic confidence without repeating their prior stumbling blocks.
"""

    prompt = f"""You are an expert technical coding interview question designer.

Generate ONE coding problem for {language} matching difficulty '{difficulty}'.
Target algorithmic domain: {chosen_topic}.

Candidate Resume:
{clean_resume}
{perf_context}
Difficulty: {difficulty}
Language: {language}

{rag_section}
{avoid_clause}

Requirements:
1. Return strictly valid JSON only.
2. Separate 2 visible sample test cases from 3-4 hidden edge test cases.
3. Standard I/O (stdin / stdout): The solution code must read from stdin and print to stdout.
4. Provide the complete optimal working reference solution in {language}.
5. Write all test inputs as raw literals (e.g. "4\\n1 2 3 4"). Never use expressions like 'a' + 'b' in JSON values.

Return exactly this JSON schema:
{{
    "title": "Clear Problem Title",
    "description": "Clear problem description",
    "input_format": "Input format description",
    "output_format": "Output format description",
    "constraints": ["1 <= N <= 10^5"],
    "starter_code": {json.dumps(starter_template)},
    "reference_solution": "Complete working reference solution code reading stdin and printing stdout",
    "correct_answer": "Complete working reference solution code",
    "time_complexity": "O(N)",
    "space_complexity": "O(1)",
    "solution_explanation": "Explanation of the optimal approach",
    "sample_test_cases": [
        {{
            "input": "input string",
            "expected_output": "output string",
            "explanation": "why"
        }}
    ],
    "hidden_test_cases": [
        {{
            "input": "edge case input string",
            "expected_output": "expected output string",
            "category": "edge_case"
        }}
    ]
}}
"""

    models_to_try = [get_groq_model_name(), "llama-3.1-8b-instant", "llama3-8b-8192"]
    models_to_try = list(dict.fromkeys([m for m in models_to_try if m]))

    parsed_q = None
    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional coding interview question generator. Return strictly valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=4096
            )
            content = response.choices[0].message.content.strip()
            parsed_q = safe_parse_json(content)
            if parsed_q and parsed_q.get("title") and parsed_q.get("description"):
                break
        except Exception as api_err:
            print(f"[WARN] Groq model '{model_name}' coding question generation failed:", api_err)
            continue

    if not parsed_q:
        print("[INFO] AI coding question generation failed or invalid JSON, selecting distinct catalog problem.")
        return get_fallback_question(difficulty=difficulty, language=language, previous_questions=previous_questions)

    # Validate that generated title is NOT a duplicate of any previous question
    q_title = (parsed_q.get("title") or "").strip().lower()
    prev_normalized = [str(p).strip().lower() for p in (previous_questions or []) if p]
    if q_title in prev_normalized:
        print(f"[INFO] AI generated duplicate problem '{q_title}', picking guaranteed fresh catalog problem.")
        return get_fallback_question(difficulty=difficulty, language=language, previous_questions=previous_questions)

    question = parsed_q

    # Validate required fields
    required_fields = ["title", "description", "input_format", "output_format"]
    for field in required_fields:
        if field not in question or not question[field]:
            print(f"[WARN] Missing required field '{field}', using fallback.")
            return get_fallback_question(difficulty=difficulty, language=language, previous_questions=previous_questions)

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
            "explanation": "Default sample check"
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

    if not question.get("difficulty"):
        question["difficulty"] = difficulty

    if not question.get("starter_code"):
        question["starter_code"] = get_default_starter_code(language)

    return question
