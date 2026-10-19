import os
import json
import re

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def evaluate_coding_solution(
    question,
    code,
    execution_result,
    language
):

    prompt = f"""
You are an expert technical interviewer at a top tech company.

Evaluate this candidate's coding solution based on algorithmic rigor, problem solving, and test results.
The testing platform separates visible sample tests from hidden test cases (which test edge cases, constraints, and stress boundaries).

PROBLEM CONTEXT:
{question}

PROGRAMMING LANGUAGE:
{language}

CANDIDATE'S CODE:
```
{code}
```

TEST SUITE RESULTS (Sample vs. Hidden Cases):
{execution_result}

Evaluation Guidelines:
1. Correctness: Base this heavily on how many visible sample tests and hidden test cases passed. If hidden edge cases failed, deduct points and explain why.
2. Code Quality: Code style, variable names, idiomatic {language}, readability.
3. Problem Solving: Chosen data structures and algorithmic approach.
4. Complexity: Accurately identify big-O time and space complexity.
5. Feedback: Give actionable, constructive critique highlighting what passed and where edge cases or boundary conditions tripped up the candidate.

Return ONLY valid JSON matching this schema:

{{
    "correctness_score": 0,
    "code_quality_score": 0,
    "problem_solving_score": 0,
    "overall_score": 0,
    "time_complexity": "O(?)",
    "space_complexity": "O(?)",
    "strengths": [
        "strength"
    ],
    "improvements": [
        "improvement"
    ],
    "feedback": "Detailed interviewer feedback explaining how candidate handled both visible sample cases and hidden edge cases."
}}

Scoring:
0 = very poor / did not run
10 = production-grade / all sample and hidden tests passed
"""

    response = client.chat.completions.create(
        model=os.getenv("MODEL_NAME"),
        messages=[
            {
                "role": "system",
                "content": "You are an expert coding interviewer. Always return valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.2
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            clean_json = match.group(0)
        else:
            clean_json = re.sub(r"^```json\s*", "", content)
            clean_json = re.sub(r"^```\s*", "", clean_json)
            clean_json = re.sub(r"\s*```$", "", clean_json).strip()
        clean_json = re.sub(r",\s*([\}\]])", r"\1", clean_json)
        return json.loads(clean_json)