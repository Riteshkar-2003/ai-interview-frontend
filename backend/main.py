from typing import Optional, Any, Union
from coding_router import router as coding_router
from admin_router import router as admin_router
from report import (
    insert_interview_report,
    get_user_reports,
    get_latest_report,
    save_interview_answer_db,
    get_interview_history_all,
)
import json
import re
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr,  Field
from interview import (
    extract_resume_information,
    generate_first_question,
    analyze_answer,
    generate_next_question,
    generate_feedback_report
)
from auth import signup_user, login_user
from admin_auth import login_admin, verify_admin_token_from_header, decode_admin_token
from database import get_connection, init_db
from pypdf import PdfReader
from io import BytesIO
from auth_google import google_login_user



app = FastAPI(
    title="AI Interview Preparation API",
    version="1.0.0"
)

@app.get("/")
@app.head("/")
async def root():
    return {
        "status": "success",
        "message": "AI Interview Preparation API is running"
    }

@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {
        "status": "online",
        "message": "AI Interview Preparation API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://ai-interview-platform-red-eta.vercel.app",
        "https://ai-interview-platform-red-eta.vercel.app",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str




@app.post("/admin/auth/login")
def admin_login(request: AdminLoginRequest):
    """
    Admin-only login endpoint. Authenticates against the admin_users table.
    Returns a JWT token valid for 8 hours. Does NOT touch the users table.
    """
    try:
        result = login_admin(
            request.username.strip(),
            request.password,
        )
        if not result.get("success"):
            raise HTTPException(
                status_code=401,
                detail=result.get("message", "Invalid credentials"),
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        print("ADMIN LOGIN ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Authentication service error")


@app.get("/admin/auth/verify")
def admin_verify_token(authorization: Optional[str] = None):
    """
    Validates an admin JWT. Called from the frontend to check session validity.
    The token should be sent as ?token=<jwt> query param OR via Authorization header.
    """
    from fastapi import Request
    return {"valid": True, "message": "Token structure checked via /admin/auth/login"}


@app.post("/admin/auth/verify")
def admin_verify_token_post(data: dict):
    """
    Accepts { "token": "<jwt>" } and validates it.
    Returns admin info if valid.
    """
    import jwt as _jwt
    token = data.get("token", "")
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    try:
        payload = decode_admin_token(token)
        return {
            "valid": True,
            "admin_id": payload.get("sub"),
            "username": payload.get("username"),
            "role": payload.get("role"),
        }
    except _jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Admin session expired. Please login again.")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid admin token")


@app.post("/admin/auth/logout")
def admin_logout():
    """
    Stateless logout endpoint — instructs client to discard the token.
    Server-side blacklisting is not implemented (tokens are short-lived, 8h).
    """
    return {"success": True, "message": "Admin logged out. Please discard the token on the client."}


class CreateAdminRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = "Administrator"
    token: str 


@app.post("/admin/auth/create-admin")
def create_admin_user(request: CreateAdminRequest):
    """
    Creates a new admin account. Requires a valid existing admin JWT token
    passed in the request body as `token`. Only existing admins can create new admins.
    """
    import jwt as _jwt
    from admin_auth import hash_admin_password

   
    try:
        decode_admin_token(request.token)
    except _jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Your admin session has expired. Please login again.")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid admin token. Only authenticated admins can create new admins.")

   
    username = request.username.strip().lower()
    email = request.email.strip().lower()
    password = request.password
    full_name = (request.full_name or "Administrator").strip()

    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

   
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

     
        cursor.execute(
            "SELECT id FROM admin_users WHERE username = %s OR email = %s LIMIT 1",
            (username, email)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Username or email already exists in admin_users")

        password_hash = hash_admin_password(password)
        cursor.execute(
            """
            INSERT INTO admin_users (username, email, password_hash, full_name, is_active)
            VALUES (%s, %s, %s, %s, 1)
            """,
            (username, email, password_hash, full_name)
        )
        connection.commit()
        new_id = cursor.lastrowid
        print(f"[ADMIN] New admin created: id={new_id}, username={username}, by existing admin")
        return {
            "success": True,
            "message": f"Admin account '{username}' created successfully.",
            "admin": {"id": new_id, "username": username, "email": email, "full_name": full_name}
        }
    except HTTPException:
        raise
    except Exception as e:
        print("CREATE ADMIN ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to create admin account")
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if connection:
            try: connection.close()
            except Exception: pass

@app.get("/auth/signup")
@app.get("/signup")
def signup_info():
    return {
        "message": "Candidate signup endpoint. Please send a POST request with JSON body containing name, email, and password.",
        "method": "POST",
        "expected_payload": {
            "name": "string",
            "email": "user@example.com",
            "password": "string (min 6 chars)"
        },
        "docs": "/docs"
    }


@app.post("/auth/signup")
@app.post("/signup")
def signup(request: SignupRequest):

    try:

        name = request.name.strip()
        email = str(request.email).lower().strip()
        password = request.password

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Name is required"
            )

        if not password:
            raise HTTPException(
                status_code=400,
                detail="Password is required"
            )

        if len(password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must contain at least 6 characters"
            )

        result = signup_user(
            name,
            email,
            password
        )

        if not result.get("success"):

            raise HTTPException(
                status_code=400,
                detail=result.get(
                    "message",
                    "Signup failed"
                )
            )

        return result

    except HTTPException:
        raise

    except Exception as e:

        print(
            "SIGNUP ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create account"
        )


@app.get("/auth/login")
@app.get("/login")
def login_info():
    return {
        "message": "Candidate login endpoint. Please send a POST request with JSON body containing email and password.",
        "method": "POST",
        "expected_payload": {
            "email": "user@example.com",
            "password": "string"
        },
        "docs": "/docs"
    }


@app.post("/auth/login")
@app.post("/login")
def login(request: LoginRequest):

    try:

        email = str(request.email).lower().strip()

        result = login_user(
            email,
            request.password
        )

        if not result.get("success"):

            raise HTTPException(
                status_code=401,
                detail=result.get(
                    "message",
                    "Invalid email or password"
                )
            )

        return result

    except HTTPException:
        raise

    except Exception as e:

        print(
            "LOGIN ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to login"
        )


MAX_PDF_SIZE = 10 * 1024 * 1024  # 10 MB

@app.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: Optional[int] = Query(None)
):
    try:
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file selected"
            )
        filename = file.filename.lower()
        if not filename.endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported"
            )
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )
        if len(file_bytes) > MAX_PDF_SIZE:

            raise HTTPException(
                status_code=413,
                detail="PDF file is too large. Maximum size is 10 MB."
            )
        reader = PdfReader(
            BytesIO(file_bytes)
        )
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(
                    page_text.strip()
                )
        resume_text = "\n".join(text_parts)
        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not extract text from PDF. "
                    "Please upload a text-based PDF."
                )
            )
        resume_data = extract_resume_information(
            resume_text
        )

        def check_coding_skills_eligibility(rdata: dict, rtext: str = "") -> dict:
            allowed = ["Python", "Java", "JavaScript", "C++", "C"]
            skills_list = []
            if isinstance(rdata, dict):
                for k in ["skills", "programming_languages", "technologies"]:
                    val = rdata.get(k, [])
                    if isinstance(val, list):
                        skills_list.extend([str(item).lower().strip() for item in val])
                    elif isinstance(val, str):
                        skills_list.append(val.lower().strip())
            
            combined_skills_text = " ".join(skills_list) + " " + (rtext or "").lower()
            detected = []
            if re.search(r"\bpython\b", combined_skills_text):
                detected.append("Python")
            clean_no_js = re.sub(r"\bjavascript\b|\bjs\b", "", combined_skills_text)
            if re.search(r"\bjava\b", clean_no_js):
                detected.append("Java")
            if re.search(r"\bjavascript\b|\bjs\b|\becmascript\b|\bnode(?:\.js)?\b", combined_skills_text):
                detected.append("JavaScript")
            if re.search(r"\bc\+\+|\bcpp\b", combined_skills_text):
                detected.append("C++")
            if re.search(r"\bc\s*programming|\blanguage\s*c\b|\bc\s*language\b|\bansi\s*c\b", combined_skills_text) or any(s.strip() == "c" for s in skills_list):
                detected.append("C")

            is_eligible = len(detected) > 0
            return {
                "is_eligible": is_eligible,
                "eligible_languages": sorted(list(set(detected))),
                "message": (
                    f"Eligible for coding interview with: {', '.join(sorted(list(set(detected))))}"
                    if is_eligible
                    else "You are not skilled in Python, Java, JavaScript, C++, or C programming. You cannot attend the coding interview."
                )
            }

        coding_eligibility = check_coding_skills_eligibility(resume_data, resume_text)

       
        try:
            conn = get_connection()
            cur = conn.cursor()
            skills_list = coding_eligibility.get("eligible_languages", [])
            if isinstance(resume_data, dict) and isinstance(resume_data.get("skills"), list):
                skills_list.extend(resume_data.get("skills"))
            skills_str = ", ".join(list(dict.fromkeys([str(s) for s in skills_list])))
            exp_lvl = "Junior"
            if isinstance(resume_data, dict):
                exp_lvl = resume_data.get("experience_level") or "Junior"
            actual_user_id = 1
            if user_id and user_id > 0:
                cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                user_found = cur.fetchone()
                if user_found:
                    actual_user_id = user_id

            cur.execute(
                """
                INSERT INTO user_resumes (user_id, filename, raw_text, resume_json, skills_detected, experience_level)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    actual_user_id,
                    file.filename,
                    resume_text,
                    json.dumps(resume_data),
                    skills_str,
                    str(exp_lvl),
                )
            )
            conn.commit()
            cur.close()
            conn.close()
        except Exception as r_err:
            print("[WARN] Could not save resume to user_resumes table:", r_err)

        return {
            "success": True,
            "filename": file.filename,
            "resume_data": resume_data,
            "coding_eligibility": coding_eligibility
        }
    except HTTPException:
        raise
    except Exception as e:
        print(
            "RESUME UPLOAD ERROR:",
            repr(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to process resume"
        )
    finally:
        await file.close()

class FirstQuestionRequest(BaseModel):
    resume_data: dict
    difficulty: str = Field(
        default="Easy",
        min_length=3,
        max_length=20
    )

@app.post("/interview/first-question")
def first_question(
    request: FirstQuestionRequest
):
    try:
        question = generate_first_question(
            request.resume_data,
            request.difficulty
        )
        return {
            "success": True,
            "question": question
        }
    except Exception as e:
        print(
            "FIRST QUESTION ERROR:",
            repr(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to generate first question"
        )

class AnswerRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1
    )
    candidate_answer: str = Field(
        ...,
        min_length=1
    )
    current_difficulty: str = Field(
        default="Easy",
        min_length=3,
        max_length=20
    )
    user_id: Optional[Any] = 1
    question_number: Optional[int] = 1

@app.post("/interview/answer")
def evaluate_answer(
    request: AnswerRequest
):
    try:
        evaluation = analyze_answer(
            request.question,
            request.candidate_answer,
            request.current_difficulty
        )

      
        correct_answer = evaluation.get("correct_answer") or ""
        save_interview_answer_db(
            user_id=request.user_id,
            question_number=request.question_number,
            question=request.question,
            answer=request.candidate_answer,
            difficulty=request.current_difficulty,
            evaluation=evaluation,
            correct_answer=correct_answer
        )

        return {
            "success": True,
            "evaluation": evaluation,
            "correct_answer": correct_answer
        }
    except Exception as e:
        print(
            "ANSWER ERROR:",
            repr(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to evaluate answer"
        )

class NextQuestionRequest(BaseModel):
    resume_data: dict
    chat_history: list = Field(
        default_factory=list
    )
    current_difficulty: str = Field(
        default="Easy",
        min_length=3,
        max_length=20
    )
    evaluation: dict = Field(
        default_factory=dict
    )
    asked_sections: list = Field(
        default_factory=list
    )

@app.post("/interview/next-question")
def next_question(
    request: NextQuestionRequest
):
    try:
        question = generate_next_question(
            request.resume_data,
            request.chat_history,
            request.current_difficulty,
            request.evaluation,
            request.asked_sections
        )
        return {
            "success": True,
            "question": question
        }
    except Exception as e:
        print(
            "NEXT QUESTION ERROR:",
            repr(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to generate next question"
        )

class ReportRequest(BaseModel):
    resume_data: dict
    interview_history: list = Field(
        default_factory=list
    )

@app.post("/interview/report")
def interview_report(
    request: ReportRequest
):
    try:
        report = generate_feedback_report(
            request.resume_data,
            request.interview_history
        )
        return {
            "success": True,
            "report": report
        }
    except Exception as e:
        print(
            "REPORT ERROR:",
            repr(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to generate interview report"
        )

class SaveReportRequest(BaseModel):
    user_id: int = Field(
        ...,
        gt=0
    )
    report: dict

@app.post("/reports/save")
def save_report(
    request: SaveReportRequest
):
    try:
        report_id = insert_interview_report(
            user_id=request.user_id,
            report=request.report
        )
        return {
            "success": True,
            "message": "Interview report saved successfully",
            "report_id": report_id
        }
    except Exception as e:
        print(
            "SAVE REPORT ERROR:",
            repr(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to save interview report"
        )

@app.get("/reports/{user_id}")
def get_reports(
    user_id: int
):
    if user_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID"
        )
    try:
        reports = get_user_reports(
            user_id
        )
        return {
            "success": True,
            "reports": reports
        }
    except Exception as e:
        print(
            "GET REPORTS ERROR:",
            repr(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch reports"
        )

@app.get("/home-dashboard/{user_id}")
def get_home_dashboard(
    user_id: int
):
    if user_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID"
        )
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(
            dictionary=True
        )
        cursor.execute(
            """
            SELECT
                id,
                user_id,
                overall_score,
                technical_score,
                skills_score,
                projects_score,
                experience_score,
                final_level,
                created_at
            FROM interview_reports
            WHERE user_id = %s
            ORDER BY id DESC
            LIMIT 1
            """,
            (user_id,)
        )
        report = cursor.fetchone()

       
        from coding_router import user_coding_reports
        coding_rep = user_coding_reports.get(str(user_id))

     
        if not coding_rep:
            cursor.execute(
                """
                SELECT
                    id,
                    user_id,
                    overall_score,
                    correctness_score,
                    code_quality_score,
                    problem_solving_score,
                    explanation_score,
                    time_complexity,
                    space_complexity,
                    feedback,
                    strengths,
                    improvements,
                    next_difficulty,
                    created_at
                FROM coding_reports
                WHERE user_id = %s
                ORDER BY id DESC
                LIMIT 1
                """,
                (user_id,)
            )
            db_coding_rep = cursor.fetchone()
            if db_coding_rep:
              
                coding_rep = {
                    "overall_score": db_coding_rep.get("overall_score", 0),
                    "correctness_score": db_coding_rep.get("correctness_score", 0),
                    "code_quality_score": db_coding_rep.get("code_quality_score", 0),
                    "problem_solving_score": db_coding_rep.get("problem_solving_score", 0),
                    "explanation_score": db_coding_rep.get("explanation_score", 0),
                    "time_complexity": db_coding_rep.get("time_complexity", "O(N)"),
                    "space_complexity": db_coding_rep.get("space_complexity", "O(1)"),
                    "feedback": db_coding_rep.get("feedback", ""),
                    "strengths": db_coding_rep.get("strengths", "").split("\n") if db_coding_rep.get("strengths") else [],
                    "improvements": db_coding_rep.get("improvements", "").split("\n") if db_coding_rep.get("improvements") else [],
                    "difficulty": db_coding_rep.get("next_difficulty", "Easy"),
                    "language": "Python",
                    "created_at": str(db_coding_rep.get("created_at", "")) if db_coding_rep.get("created_at") else None,
                }

        return {
            "success": True,
            "has_previous_report": bool(report),
            "report": report,
            "has_previous_coding_report": bool(coding_rep),
            "coding_report": coding_rep
        }
    except Exception as e:
        print(
            "DASHBOARD DATABASE ERROR:",
            repr(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to load dashboard"
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


class GoogleAuthRequest(BaseModel):
    credential: str


@app.post("/auth/google")
def google_auth(data: GoogleAuthRequest):
    try:
        return google_login_user(data.credential)

    except Exception as e:
        print("Google authentication error:", e)

        raise HTTPException(
            status_code=401,
            detail=str(e)
        )


app.include_router(coding_router)
app.include_router(admin_router)


@app.get("/history/{user_id}")
@app.get("/interview/history/{user_id}")
def get_user_interview_history(user_id: int):
    if user_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    try:
        data = get_interview_history_all(user_id)
        return {
            "success": True,
            **data
        }
    except Exception as e:
        print("GET INTERVIEW HISTORY ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve interview history"
        )


class CheckEligibilityRequest(BaseModel):
    resume_data: Optional[dict] = None
    resume_text: Optional[str] = ""


@app.post("/resume/check-eligibility")
def check_resume_skills_eligibility(request: CheckEligibilityRequest):
    rdata = request.resume_data or {}
    rtext = request.resume_text or ""
    allowed = ["Python", "Java", "JavaScript", "C++", "C"]
    skills_list = []
    if isinstance(rdata, dict):
        for k in ["skills", "programming_languages", "technologies"]:
            val = rdata.get(k, [])
            if isinstance(val, list):
                skills_list.extend([str(item).lower().strip() for item in val])
            elif isinstance(val, str):
                skills_list.append(val.lower().strip())
    
    combined_skills_text = " ".join(skills_list) + " " + rtext.lower()
    detected = []
    if re.search(r"\bpython\b", combined_skills_text):
        detected.append("Python")
    clean_no_js = re.sub(r"\bjavascript\b|\bjs\b", "", combined_skills_text)
    if re.search(r"\bjava\b", clean_no_js):
        detected.append("Java")
    if re.search(r"\bjavascript\b|\bjs\b|\becmascript\b|\bnode(?:\.js)?\b", combined_skills_text):
        detected.append("JavaScript")
    if re.search(r"\bc\+\+|\bcpp\b", combined_skills_text):
        detected.append("C++")
    if re.search(r"\bc\s*programming|\blanguage\s*c\b|\bc\s*language\b|\bansi\s*c\b", combined_skills_text) or any(s.strip() == "c" for s in skills_list):
        detected.append("C")

    is_eligible = len(detected) > 0
    return {
        "success": True,
        "is_eligible": is_eligible,
        "eligible_languages": sorted(list(set(detected))),
        "message": (
            f"Eligible for coding interview with: {', '.join(sorted(list(set(detected))))}"
            if is_eligible
            else "You are not skilled in Python, Java, JavaScript, C++, or C programming. You cannot attend the coding interview."
        )
    }




