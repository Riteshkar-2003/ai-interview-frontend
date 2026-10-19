from langchain_core.messages import SystemMessage, HumanMessage
from config import llm
import json
from rag_technical.retriever import get_rag_context, retrieve_answer_analysis_knowledge


EMPTY_RESUME = {
    "name": "",
    "skills": [],
    "programming_languages": [],
    "technologies": [],
    "projects": [],
    "internships": [],
    "work_experience": [],
    "education": []
}

SYSTEM_PROMPT = """
You are a professional technical interviewer.

Conduct a resume-based technical interview.

Rules:
- Ask exactly ONE question at a time.
- Questions must come only from information in the resume.
- Never invent skills, projects, companies, technologies or experience.
- Analyze the candidate's previous answer.
- Adjust difficulty based on performance.
- Avoid repeatedly asking about the same topic.
- Cover different resume sections when possible.
- Do not give the answer.
- Behave like a real technical interviewer.

Difficulty:
Easy = basic concepts and definitions.
Medium = practical, implementation and project questions.
Hard = advanced concepts, optimization, troubleshooting and design.

Strong answer -> increase difficulty.
Average answer -> keep difficulty.
Weak answer -> decrease difficulty.

Return only the requested output.
"""



def clean_llm_json(content):
    """
    Clean JSON returned by the LLM.
    Handles responses wrapped inside 
    """

    if not content:
        return ""

    content = content.strip()

    if content.startswith("```"):
        content = content.replace("```json", "", 1)
        content = content.replace("```", "", 1)
        content = content.strip()

    return content


def safe_json_loads(content, default=None):
    """
    Safely convert LLM JSON response into Python object.
    """

    if default is None:
        default = {}

    try:
        content = clean_llm_json(content)
        return json.loads(content)
    except (json.JSONDecodeError, TypeError, ValueError):
        return default


def compact_json(data):
    """
    Convert Python object to compact JSON.

    separators removes unnecessary spaces and reduces
    prompt token usage.
    """

    return json.dumps(
        data,
        ensure_ascii=False,
        separators=(",", ":")
    )


def get_resume_sections(resume_data):
    """
    Return only the sections that actually exist.
    """

    sections = []

    if resume_data.get("skills"):
        sections.append("Skills")

    if resume_data.get("programming_languages"):
        sections.append("Programming Languages")

    if resume_data.get("technologies"):
        sections.append("Technologies")

    if resume_data.get("projects"):
        sections.append("Projects")

    if resume_data.get("internships"):
        sections.append("Internships")

    if resume_data.get("work_experience"):
        sections.append("Work Experience")

    return sections


def build_compact_resume(resume_data):
    """
    Create a smaller resume representation.

    This avoids sending unnecessary resume text to the LLM
    during every interview question.
    """

    compact_resume = {
        "skills": resume_data.get("skills", []),
        "programming_languages": resume_data.get(
            "programming_languages", []
        ),
        "technologies": resume_data.get("technologies", []),
        "projects": [],
        "internships": [],
        "work_experience": []
    }

  
    for project in resume_data.get("projects", []):
        compact_resume["projects"].append({
            "name": project.get("name", ""),
            "technologies": project.get("technologies", []),
            "description": project.get("description", "")[:500]
        })

   
    for internship in resume_data.get("internships", []):
        compact_resume["internships"].append({
            "company": internship.get("company", ""),
            "role": internship.get("role", ""),
            "technologies": internship.get("technologies", []),
            "description": internship.get("description", "")[:400]
        })

   
    for work in resume_data.get("work_experience", []):
        compact_resume["work_experience"].append({
            "company": work.get("company", ""),
            "role": work.get("role", ""),
            "technologies": work.get("technologies", []),
            "description": work.get("description", "")[:400]
        })

    return compact_resume


def get_recent_history(chat_history, limit=4):
    """
    Only send the most recent interview messages.

    Sending the entire history becomes increasingly expensive
    as the interview gets longer.
    """

    if not chat_history:
        return []

    return chat_history[-limit:]


def get_next_section(all_sections, asked_sections):
    """
    Select an uncovered resume section in Python.

    This removes unnecessary decision-making from the LLM.
    """

    if not all_sections:
        return None

    asked = set(asked_sections or [])

    for section in all_sections:
        if section not in asked:
            return section

   
    return all_sections[len(asked) % len(all_sections)]



def extract_resume_information(resume_text):

    prompt = f"""
Extract the candidate's resume information into JSON.

Resume:
{resume_text}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "name": "",
    "skills": [],
    "programming_languages": [],
    "technologies": [],
    "projects": [
        {{
            "name": "",
            "description": "",
            "technologies": []
        }}
    ],
    "internships": [
        {{
            "company": "",
            "role": "",
            "description": "",
            "technologies": []
        }}
    ],
    "work_experience": [
        {{
            "company": "",
            "role": "",
            "description": "",
            "technologies": []
        }}
    ],
    "education": []
}}

Do not invent information.
If information is missing, return an empty list.
"""

    response = llm.invoke([
        SystemMessage(
            content="You are an expert resume parser. Return only JSON."
        ),
        HumanMessage(content=prompt)
    ])

    result = safe_json_loads(
        response.content,
        default=EMPTY_RESUME.copy()
    )

   
    for key, default_value in EMPTY_RESUME.items():

        if key not in result:
            result[key] = (
                default_value.copy()
                if isinstance(default_value, list)
                else default_value
            )

    return result




def generate_first_question(
    resume_data,
    difficulty
):

    compact_resume = build_compact_resume(resume_data)
    sections = get_resume_sections(resume_data)

  
    skills = list(resume_data.get("skills", [])) + list(resume_data.get("programming_languages", [])) + list(resume_data.get("technologies", []))
    rag_context = get_rag_context(skills=skills, difficulty=difficulty, top_k=4)

    prompt = f"""
Start the technical interview.

Candidate resume:
{compact_json(compact_resume)}

Available sections:
{", ".join(sections)}

Starting difficulty:
{difficulty}

{f"RAG TECHNICAL KNOWLEDGE BASE CONTEXT:\n{rag_context}\n" if rag_context else ""}

Instructions:
- Use the candidate's skills and the concepts from the RAG knowledge base above to craft a high-quality interview question.
- Select one important item from the resume.
- Ask exactly ONE technical interview question.
- Do not give the answer.

Return ONLY the question.
"""

    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt)
    ])

    return response.content.strip()




def analyze_answer(
    question,
    candidate_answer,
    current_difficulty
):

 
    rag_context = retrieve_answer_analysis_knowledge(question, candidate_answer, top_k=3)

    prompt = f"""
Evaluate the candidate's technical answer against the following RAG Technical Knowledge Base ground truth.

Question:
{question}

Candidate answer:
{candidate_answer}

Current difficulty:
{current_difficulty}

{f"RAG KNOWLEDGE BASE GROUND TRUTH REFERENCE:\n{rag_context}\n" if rag_context else ""}

Analysis Guidelines:
1. Correctness: Verify if the candidate's statements align with technical ground truth in the knowledge base.
2. Technical understanding: Depth of explanation and accurate terminology.
3. Completeness: Did they answer the core question or miss key aspects?
4. Strengths: What did the candidate explain well?
5. Weaknesses: What was incomplete, incorrect, or omitted?
6. Correct Answer: Provide a comprehensive, accurate, and authoritative reference answer based on the knowledge base.

Give a score from 0 to 10.
Determine the next difficulty.

Rules:
Strong answer -> increase difficulty.
Average answer -> keep difficulty.
Weak answer -> decrease difficulty.

Return ONLY valid JSON matching this schema:
{{
    "score": 0,
    "evaluation": "Detailed constructive analysis comparing candidate answer to knowledge base concepts",
    "correct_answer": "Complete authoritative ground-truth answer that should have been given",
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1"],
    "next_difficulty": "Easy"
}}
"""

    response = llm.invoke([
        SystemMessage(
            content=(
                "You are an expert technical interviewer evaluator. "
                "Analyze candidate answers against technical knowledge base ground truth. "
                "Return only valid JSON."
            )
        ),
        HumanMessage(content=prompt)
    ])

    result = safe_json_loads(response.content)

    try:
        score = float(result.get("score", 0))
    except (TypeError, ValueError):
        score = 0

    score = max(0, min(10, score))

    result["score"] = score
    result.setdefault("evaluation", "")
    result.setdefault("correct_answer", "The ideal answer should address core architectural principles and technical specifics.")
    result.setdefault("strengths", [])
    result.setdefault("weaknesses", [])
    result.setdefault(
        "next_difficulty",
        current_difficulty
    )

    return result




def generate_next_question(
    resume_data,
    chat_history,
    current_difficulty,
    evaluation,
    asked_sections
):

    compact_resume = build_compact_resume(resume_data)

    recent_history = get_recent_history(
        chat_history,
        limit=4
    )

    all_sections = get_resume_sections(resume_data)

    next_section = get_next_section(
        all_sections,
        asked_sections
    )

    skills = list(resume_data.get("skills", [])) + list(resume_data.get("programming_languages", []))
    rag_context = get_rag_context(skills=skills, difficulty=current_difficulty, query_text=str(next_section or ""), top_k=3)

    prompt = f"""
Continue the technical interview.

Candidate resume:
{compact_json(compact_resume)}

Next resume section to consider:
{next_section}

Current difficulty:
{current_difficulty}

Previous answer evaluation:
{compact_json({
    "score": evaluation.get("score", 0),
    "evaluation": evaluation.get("evaluation", ""),
    "strengths": evaluation.get("strengths", []),
    "weaknesses": evaluation.get("weaknesses", [])
})}

Recent interview history (Stored Q&A list):
{compact_json(recent_history)}

Sections already covered:
{compact_json(asked_sections)}

{f"RAG TECHNICAL KNOWLEDGE BASE CONTEXT:\n{rag_context}\n" if rag_context else ""}

Instructions:
- Prefer the requested resume section and leverage concepts from the RAG knowledge base.
- Use information actually present in the resume.
- Do not invent information.
- Do not repeat a previously asked question.
- Adapt difficulty according to the previous answer evaluation.
- Ask exactly ONE question.
- Do not provide the answer.
- Do not provide explanation.

Return ONLY the next interview question.
"""

    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt)
    ])

    return response.content.strip()



def generate_feedback_report(
    resume_data,
    interview_history
):

   
    if not interview_history:

        return {
            "overall_score": 0,
            "technical_score": 0,
            "skills_score": 0,
            "projects_score": 0,
            "experience_score": 0,

            "strengths": [],

            "weaknesses": [
                "No interview answers were provided."
            ],

            "areas_for_improvement": [
                "Answer interview questions to receive a complete evaluation."
            ],

            "performance_summary": (
                "The interview was stopped before the "
                "candidate provided any answers."
            ),

            "final_level": "Not Evaluated",

            "recommendation": (
                "Answer interview questions to receive "
                "a complete performance evaluation."
            ),

            "question_wise_feedback": []
        }

   

    compact_resume = build_compact_resume(resume_data)

    prompt = f"""
You are a professional technical interview evaluator.

Evaluate the candidate based ONLY on the provided information.

RESUME:
{compact_json(compact_resume)}

INTERVIEW HISTORY:
{compact_json(interview_history)}

The candidate answered the interview questions.

Generate a professional performance report.

Calculate scores based on actual answers.

Do not return zero scores unless the answers clearly deserve zero.

Scoring:
0-2 = Very Poor
3-4 = Poor
5-6 = Average
7-8 = Good
9 = Very Strong
10 = Excellent

Evaluate:

1. Overall Score
2. Technical Knowledge
3. Skills Performance
4. Projects Performance
5. Internship / Work Experience
6. Strengths
7. Weaknesses
8. Areas for Improvement
9. Performance Summary
10. Final Candidate Level
11. Recommendation
12. Question-wise evaluation

Candidate levels:
Beginner
Intermediate
Good
Strong
Excellent

For each answered question include:
- question
- topic
- score
- evaluation

Return ONLY valid JSON.

Use exactly this structure:

{{
    "overall_score": 0,
    "technical_score": 0,
    "skills_score": 0,
    "projects_score": 0,
    "experience_score": 0,
    "strengths": [],
    "weaknesses": [],
    "areas_for_improvement": [],
    "performance_summary": "",
    "final_level": "",
    "recommendation": "",
    "question_wise_feedback": [
        {{
            "question": "",
            "topic": "",
            "score": 0,
            "evaluation": ""
        }}
    ]
}}
"""

    response = llm.invoke([
        SystemMessage(
            content=(
                "You are an expert technical interview evaluator. "
                "Return only valid JSON."
            )
        ),
        HumanMessage(content=prompt)
    ])

    report = safe_json_loads(response.content)

    if not report:

        return {
            "overall_score": 0,
            "technical_score": 0,
            "skills_score": 0,
            "projects_score": 0,
            "experience_score": 0,
            "strengths": [],
            "weaknesses": [
                "The final evaluation could not be parsed."
            ],
            "areas_for_improvement": [
                "Please run the interview again."
            ],
            "performance_summary": (
                "The evaluator returned an invalid response."
            ),
            "final_level": "Not Evaluated",
            "recommendation": "",
            "question_wise_feedback": []
        }

    return report

