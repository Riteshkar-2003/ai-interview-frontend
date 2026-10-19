from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional, Dict, List
import json
import re
import threading
import time

from code_executor import execute_single_test_case, run_test_suite, execute_code_custom_input

from coding_question_generator import generate_coding_question
from coding_evaluation import evaluate_coding_solution
from report import (
    save_coding_question_db,
    save_coding_submission_db,
    save_coding_report_db,
    safe_user_id
)


app = APIRouter(
    prefix="/coding",
    tags=["Coding Interview"]
)


router = app


user_coding_sessions: Dict[str, List[Dict[str, Any]]] = {}
user_coding_reports: Dict[str, Dict[str, Any]] = {}
user_session_metadata: Dict[str, Dict[str, Any]] = {}

_start_locks: Dict[str, threading.Lock] = {}
_locks_guard = threading.Lock()


def get_user_lock(user_key: str) -> threading.Lock:
    with _locks_guard:
        if user_key not in _start_locks:
            _start_locks[user_key] = threading.Lock()
        return _start_locks[user_key]




class StartCodingRequest(BaseModel):
    user_id: Any
    resume_text: str
    language: str = "python"
    difficulty: str = "Easy"


class RunCodeRequest(BaseModel):
    code: str
    language: str = "python"
    user_id: Optional[Any] = None
    question: Optional[Any] = None
    custom_input: Optional[str] = None


class SubmitCodingRequest(BaseModel):
    user_id: Any
    question: Any
    code: str
    language: str = "python"
    execution_result: Any = None
    difficulty: Optional[str] = "Easy"
    interview_id: Optional[int] = None
    explanation: Optional[str] = ""
    resume_text: Optional[str] = None



def sanitize_question_for_client(question: Any) -> Any:
    """Removes hidden test cases and reference solution before sending the question to the candidate browser."""
    if not isinstance(question, dict):
        return question
    client_q = dict(question)
    hidden = client_q.pop("hidden_test_cases", [])
    client_q.pop("reference_solution", None)
    client_q.pop("correct_answer", None)
    client_q["hidden_tests_count"] = len(hidden) if isinstance(hidden, list) else 0
    return client_q





def determine_next_difficulty(current_difficulty: str, evaluation: dict) -> str:
    difficulties = ["Easy", "Medium", "Hard"]
    norm_diff = (current_difficulty or "Easy").capitalize()
    try:
        idx = difficulties.index(norm_diff)
    except ValueError:
        idx = 0

    score = 5.0
    if isinstance(evaluation, dict):
        raw_score = evaluation.get("overall_score", 5)
        try:
            score = float(raw_score)
        except (ValueError, TypeError):
            score = 5.0

    if score >= 7.0 and idx < len(difficulties) - 1:
        return difficulties[idx + 1]
    elif score <= 4.0 and idx > 0:
        return difficulties[idx - 1]
    return difficulties[idx]


def get_user_coding_answers(user_id: Any) -> list:
    return user_coding_sessions.get(str(user_id), [])


def save_coding_report(user_id: Any, report: dict):
    user_coding_reports[str(user_id)] = report


def generate_final_coding_report(answers: list) -> dict:
    if not answers:
        from datetime import datetime
        return {
            "overall_score": 0,
            "correctness_score": 0,
            "code_quality_score": 0,
            "problem_solving_score": 0,
            "explanation_score": 0,
            "difficulty": "Easy",
            "language": "Python",
            "time_complexity": "N/A",
            "space_complexity": "N/A",
            "strengths": ["Completed coding session"],
            "improvements": ["Practice more coding problems"],
            "feedback": "No answers were recorded.",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    evaluations = [a.get("evaluation") for a in answers if isinstance(a.get("evaluation"), dict)]
    if not evaluations:
        return {
            "overall_score": 0,
            "correctness_score": 0,
            "code_quality_score": 0,
            "problem_solving_score": 0,
            "explanation_score": 0,
            "time_complexity": "N/A",
            "space_complexity": "N/A",
            "strengths": ["Completed coding session"],
            "improvements": ["Practice more coding problems"],
            "feedback": "No evaluations were found."
        }

    count = len(evaluations)
    avg_overall = round(sum(float(e.get("overall_score", 0)) for e in evaluations) / count, 1)
    avg_correctness = round(sum(float(e.get("correctness_score", 0)) for e in evaluations) / count, 1)
    avg_quality = round(sum(float(e.get("code_quality_score", 0)) for e in evaluations) / count, 1)
    avg_problem_solving = round(sum(float(e.get("problem_solving_score", 0)) for e in evaluations) / count, 1)

    all_strengths = []
    all_improvements = []
    question_summaries = []
    time_complexities = []
    space_complexities = []

    for idx, ans in enumerate(answers):
        e = ans.get("evaluation", {})
        diff = ans.get("difficulty", "Standard")
        q = ans.get("question", {})
        q_title = q.get("title", f"Question {idx + 1}") if isinstance(q, dict) else f"Question {idx + 1}"

        s = e.get("strengths", [])
        if isinstance(s, list):
            all_strengths.extend(s)
        elif isinstance(s, str):
            all_strengths.append(s)

        imp = e.get("improvements", [])
        if isinstance(imp, list):
            all_improvements.extend(imp)
        elif isinstance(imp, str):
            all_improvements.append(imp)

        score = e.get("overall_score", "N/A")
        fb = e.get("feedback", "Code executed successfully.")
        tc = e.get("time_complexity", "O(N)")
        sc = e.get("space_complexity", "O(1)")

        time_complexities.append(f"Q{idx + 1} ({diff}): {tc}")
        space_complexities.append(f"Q{idx + 1} ({diff}): {sc}")

        question_summaries.append(
            f"Question {idx + 1} ({diff} Difficulty) - {q_title}:\n"
            f"- Performance Score: {score}/10\n"
            f"- Complexity: Time {tc}, Space {sc}\n"
            f"- Analysis: {fb}"
        )

    unique_strengths = list(dict.fromkeys(all_strengths))
    unique_improvements = list(dict.fromkeys(all_improvements))

    diff_progression = " -> ".join([a.get("difficulty", "Easy") for a in answers])
    summary_header = (
        f"Candidate completed {count} question(s) with difficulty progression: {diff_progression}.\n"
        f"Overall Assessment Score: {avg_overall} / 10\n\n"
    )

    combined_feedback = summary_header + "\n\n".join(question_summaries)

    last_difficulty = (
        answers[-1].get("difficulty")
        if answers and answers[-1].get("difficulty")
        else "Easy"
    )
    last_language = (
        answers[-1].get("language")
        if answers and answers[-1].get("language")
        else "Python"
    )

    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return {
        "overall_score": avg_overall,
        "correctness_score": avg_correctness,
        "code_quality_score": avg_quality,
        "problem_solving_score": avg_problem_solving,
        "explanation_score": avg_quality,
        "difficulty": str(last_difficulty).capitalize(),
        "language": str(last_language).capitalize(),
        "time_complexity": " | ".join(time_complexities) if time_complexities else "O(N)",
        "space_complexity": " | ".join(space_complexities) if space_complexities else "O(1)",
        "strengths": unique_strengths or ["Demonstrated solid coding principles", "Clear algorithm formulation"],
        "improvements": unique_improvements or ["Continue refining edge case coverage and optimization"],
        "feedback": combined_feedback,
        "created_at": current_time
    }






@app.post("/start")
def start_coding_interview(request: StartCodingRequest):
    try:
        user_key = str(request.user_id)
        user_lock = get_user_lock(user_key)

        with user_lock:
            existing = user_session_metadata.get(user_key)
            existing_submissions = user_coding_sessions.get(user_key, [])
            now = time.time()

           
            if (
                existing
                and not existing_submissions
                and (now - existing.get("created_at", 0) < 30)
                and existing.get("current_question")
                and existing.get("language") == request.language
                and existing.get("current_difficulty") == request.difficulty
            ):
                qid = existing.get("question_id")
                sanitized_q = sanitize_question_for_client(existing["current_question"])
                if qid:
                    sanitized_q["id"] = qid
                return {
                    "success": True,
                    "user_id": request.user_id,
                    "question": sanitized_q,
                    "difficulty": existing.get("current_difficulty", request.difficulty),
                    "question_number": 1,
                    "question_id": qid,
                }

            user_coding_sessions[user_key] = []

            question = generate_coding_question(
                resume_text=request.resume_text,
                difficulty=request.difficulty,
                language=request.language
            )

            q_title = question.get("title") if isinstance(question, dict) else "Question 1"

            all_cases = (question.get("sample_test_cases", []) or []) + (question.get("hidden_test_cases", []) or [])
            ref_sol = question.get("reference_solution") or question.get("correct_answer") or ""
            qid = save_coding_question_db(
                title=question.get("title", "Coding Problem"),
                description=question.get("description", ""),
                difficulty=request.difficulty,
                input_format=question.get("input_format", ""),
                output_format=question.get("output_format", ""),
                constraints_text=question.get("constraints", []),
                examples=question.get("examples", question.get("sample_test_cases", [])),
                test_cases=all_cases,
                reference_solution=ref_sol
            )

            user_session_metadata[user_key] = {
                "resume_text": request.resume_text,
                "language": request.language,
                "current_difficulty": request.difficulty,
                "previous_questions": [q_title],
                "current_question": question,
                "question_id": qid,
                "created_at": time.time(),
            }

            sanitized_q = sanitize_question_for_client(question)
            if qid:
                sanitized_q["id"] = qid

            return {
                "success": True,
                "user_id": request.user_id,
                "question": sanitized_q,
                "difficulty": request.difficulty,
                "question_number": 1,
                "question_id": qid,
            }

    except Exception as e:
        print("START ERROR:", str(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )






@app.post("/submit")
def submit_coding_answer(request: SubmitCodingRequest):
    try:
        user_key = str(request.user_id)
        session_meta = user_session_metadata.get(user_key, {})

      
        full_question = session_meta.get("current_question")
        if not isinstance(full_question, dict) and isinstance(request.question, dict):
            full_question = request.question

        if isinstance(full_question, dict):
            question_str = json.dumps(full_question, indent=2)
            q_title = full_question.get("title", "Question")
            sample_tests = full_question.get("sample_test_cases") or full_question.get("examples") or []
            hidden_tests = full_question.get("hidden_test_cases") or []
        else:
            question_str = str(full_question or request.question)
            q_title = "Question"
            sample_tests = []
            hidden_tests = []

        sample_suite = run_test_suite(
            code=request.code,
            test_cases=sample_tests,
            language=request.language,
            is_hidden=False
        ) if sample_tests else {"total": 0, "passed": 0, "failed": 0, "all_passed": True, "results": []}

       
        hidden_suite = run_test_suite(
            code=request.code,
            test_cases=hidden_tests,
            language=request.language,
            is_hidden=True
        ) if hidden_tests else {"total": 0, "passed": 0, "failed": 0, "all_passed": True, "results": []}

        total_tests = sample_suite["total"] + hidden_suite["total"]
        total_passed = sample_suite["passed"] + hidden_suite["passed"]
        all_passed = (total_passed == total_tests) if total_tests > 0 else True
        pass_rate = round((total_passed / total_tests) * 100, 1) if total_tests > 0 else 100.0

        test_summary = {
            "sample_passed": sample_suite["passed"],
            "sample_total": sample_suite["total"],
            "hidden_passed": hidden_suite["passed"],
            "hidden_total": hidden_suite["total"],
            "total_passed": total_passed,
            "total_tests": total_tests,
            "all_passed": all_passed,
            "pass_rate": pass_rate,
            "sample_results": sample_suite["results"],
            "hidden_results": hidden_suite["results"]
        }

       
        sample_details_list = [
            f"  - Sample Test {r['test_index']} ({r['status']}): Expected '{r['expected_output']}', Output '{r['actual_output']}'"
            + (f" [Error: {r['error']}]" if r.get('error') else "")
            for r in sample_suite["results"]
        ]
        sample_details_str = "\n".join(sample_details_list) if sample_details_list else "  (None)"

        hidden_details_list = [
            f"  - Hidden Test {r['test_index']} [Category: {r.get('category', 'edge_case')}]: {r['status']}"
            + (f" [Execution error]" if r.get('error') else "")
            for r in hidden_suite["results"]
        ]
        hidden_details_str = "\n".join(hidden_details_list) if hidden_details_list else "  (None)"

        exec_report = (
            f"TEST SUITE EXECUTION SUMMARY:\n"
            f"- Visible Sample Tests Passed: {sample_suite['passed']} / {sample_suite['total']}\n"
            f"- Hidden Test Cases Passed: {hidden_suite['passed']} / {hidden_suite['total']}\n"
            f"- Total Passed: {total_passed} / {total_tests} ({pass_rate}%)\n\n"
            f"VISIBLE SAMPLE TESTS:\n{sample_details_str}\n\n"
            f"HIDDEN TEST CASES (Edge Cases & Boundaries):\n{hidden_details_str}\n"
        )

        evaluation = evaluate_coding_solution(
            question=question_str,
            code=request.code,
            execution_result=exec_report,
            language=request.language
        )

        next_diff = determine_next_difficulty(
            current_difficulty=request.difficulty or "Easy",
            evaluation=evaluation
        )

        if user_key not in user_coding_sessions:
            user_coding_sessions[user_key] = []

        user_coding_sessions[user_key].append({
            "question": sanitize_question_for_client(full_question),
            "code": request.code,
            "language": request.language,
            "execution_result": exec_report,
            "test_summary": test_summary,
            "difficulty": request.difficulty or "Easy",
            "evaluation": evaluation
        })

        answers_count = len(user_coding_sessions[user_key])

       
        qid = session_meta.get("question_id")
        if not qid:
            all_cases = sample_tests + hidden_tests
            ref_sol = full_question.get("reference_solution") or full_question.get("correct_answer") or "" if isinstance(full_question, dict) else ""
            qid = save_coding_question_db(
                title=q_title,
                description=full_question.get("description", "") if isinstance(full_question, dict) else "",
                difficulty=request.difficulty or "Easy",
                input_format=full_question.get("input_format", "") if isinstance(full_question, dict) else "",
                output_format=full_question.get("output_format", "") if isinstance(full_question, dict) else "",
                constraints_text=full_question.get("constraints", []) if isinstance(full_question, dict) else [],
                examples=full_question.get("examples", sample_tests) if isinstance(full_question, dict) else sample_tests,
                test_cases=all_cases,
                reference_solution=ref_sol
            )

        sub_status = "Passed" if all_passed else ("Wrong Answer" if total_tests > 0 else "Executed")
        sub_id = save_coding_submission_db(
            user_id=request.user_id,
            question_id=qid,
            language=request.language,
            code=request.code,
            explanation=request.explanation or "",
            execution_status=sub_status,
            test_cases_passed=total_passed,
            total_test_cases=total_tests
        )

       
        rep_id = save_coding_report_db(
            user_id=request.user_id,
            question_id=qid,
            submission_id=sub_id,
            report=evaluation,
            next_difficulty=next_diff
        )

        resume_text = request.resume_text or session_meta.get("resume_text", "")
        prev_questions = session_meta.get("previous_questions", [])
        if q_title not in prev_questions:
            prev_questions.append(q_title)

        next_q_num = answers_count + 1

        next_question = generate_coding_question(
            resume_text=resume_text,
            difficulty=next_diff,
            language=request.language,
            previous_questions=prev_questions
        )

       
        next_cases = (next_question.get("sample_test_cases", []) or []) + (next_question.get("hidden_test_cases", []) or [])
        next_ref_sol = next_question.get("reference_solution") or next_question.get("correct_answer") or "" if isinstance(next_question, dict) else ""
        next_qid = save_coding_question_db(
            title=next_question.get("title", f"Question {next_q_num}"),
            description=next_question.get("description", ""),
            difficulty=next_diff,
            input_format=next_question.get("input_format", ""),
            output_format=next_question.get("output_format", ""),
            constraints_text=next_question.get("constraints", []),
            examples=next_question.get("examples", next_question.get("sample_test_cases", [])),
            test_cases=next_cases,
            reference_solution=next_ref_sol
        )

        if isinstance(next_question, dict) and next_question.get("title"):
            prev_questions.append(next_question.get("title"))

        session_meta["previous_questions"] = prev_questions
        session_meta["current_difficulty"] = next_diff
        session_meta["current_question"] = next_question
        session_meta["question_id"] = next_qid
        user_session_metadata[user_key] = session_meta

        sanitized_next_q = sanitize_question_for_client(next_question)
        if next_qid:
            sanitized_next_q["id"] = next_qid

        ref_answer = full_question.get("reference_solution") or full_question.get("correct_answer") or "" if isinstance(full_question, dict) else ""
        explanation_answer = full_question.get("solution_explanation") or "" if isinstance(full_question, dict) else ""

        return {
            "success": True,
            "next_difficulty": next_diff,
            "next_question": sanitized_next_q,
            "question_number": next_q_num,
            "completed_count": answers_count,
            "test_summary": test_summary,
            "evaluation": evaluation,
            "correct_answer": ref_answer,
            "reference_solution": ref_answer,
            "solution_explanation": explanation_answer,
            "submission_id": sub_id,
            "report_id": rep_id,
            "message": f"Question {answers_count} evaluated: {total_passed}/{total_tests} tests passed ({pass_rate}%). Adapted to {next_diff}."
        }

    except HTTPException:
        raise
    except Exception as e:
        print("SUBMIT ERROR:", str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )





@app.post("/stop/{user_id}")
def stop_coding_interview(
    user_id: Any
):
    try:
        answers = get_user_coding_answers(user_id)

        if not answers:
            saved = user_coding_reports.get(str(user_id))
            if saved:
                return {
                    "success": True,
                    "user_id": user_id,
                    "report": saved
                }

            raise HTTPException(
                status_code=400,
                detail="Please attend and submit at least one coding question before stopping the interview."
            )

        meta = user_session_metadata.get(str(user_id), {})
        diff = meta.get("current_difficulty") or (answers[-1].get("difficulty") if answers else "Easy")
        lang = meta.get("language") or (answers[-1].get("language") if answers else "Python")

        report = generate_final_coding_report(answers)
        if diff:
            report["difficulty"] = str(diff).capitalize()
        if lang:
            report["language"] = str(lang).capitalize()
        if not report.get("created_at"):
            from datetime import datetime
            report["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        save_coding_report(user_id=user_id, report=report)

    
        save_coding_report_db(
            user_id=user_id,
            question_id=meta.get("question_id", 1),
            submission_id=1,
            report=report,
            next_difficulty=diff
        )

        return {
            "success": True,
            "user_id": user_id,
            "report": report
        }

    except HTTPException:
        raise
    except Exception as e:
        print("STOP ERROR:", str(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )






@app.post("/run")
def run_code(request: RunCodeRequest):
    try:
        if request.custom_input is not None and request.custom_input.strip():
            custom_res = execute_code_custom_input(
                code=request.code,
                language=request.language,
                stdin_data=request.custom_input,
            )
            return {
                "success": custom_res["success"],
                "type": "custom",
                "output": custom_res["stdout"] or custom_res["stderr"] or "",
                "stdout": custom_res["stdout"],
                "stderr": custom_res["stderr"],
                "execution_time": custom_res["execution_time"]
            }


        user_key = str(request.user_id) if request.user_id is not None else None
        sample_tests = []

        if isinstance(request.question, dict):
            sample_tests = request.question.get("sample_test_cases") or request.question.get("examples") or []
        elif user_key and user_key in user_session_metadata:
            curr_q = user_session_metadata[user_key].get("current_question", {})
            if isinstance(curr_q, dict):
                sample_tests = curr_q.get("sample_test_cases") or curr_q.get("examples") or []

       
        if sample_tests:
            suite_res = run_test_suite(
                code=request.code,
                test_cases=sample_tests,
                language=request.language,
                is_hidden=False
            )
            first_err = next((r["error"] for r in suite_res["results"] if r.get("error")), None)
            total_time = round(sum(r.get("execution_time", 0) for r in suite_res["results"]), 3)

            formatted_outputs = []
            for r in suite_res["results"]:
                formatted_outputs.append(
                    f"--- Sample Case {r['test_index']} ({r['status']}) ---\n"
                    f"Input:\n{r['input']}\n"
                    f"Expected:\n{r['expected_output']}\n"
                    f"Output:\n{r['actual_output']}"
                    + (f"\nError: {r['error']}" if r.get('error') else "")
                )
            combined_stdout = "\n\n".join(formatted_outputs)

            return {
                "success": True,
                "type": "sample_tests",
                "summary": {
                    "total": suite_res["total"],
                    "passed": suite_res["passed"],
                    "failed": suite_res["failed"],
                    "all_passed": suite_res["all_passed"]
                },
                "sample_results": suite_res["results"],
                "output": combined_stdout,
                "stdout": combined_stdout,
                "stderr": first_err or "",
                "execution_time": total_time
            }

      
        fallback_res = execute_code_custom_input(
            code=request.code,
            language=request.language,
            stdin_data="",
        )

        return {
            "success": fallback_res["success"],
            "type": "raw",
            "output": fallback_res["stdout"] or fallback_res["stderr"] or "",
            "stdout": fallback_res["stdout"],
            "stderr": fallback_res["stderr"],
            "execution_time": fallback_res["execution_time"]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }