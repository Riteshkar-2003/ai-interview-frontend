"""
admin_router.py
===============
Admin Dashboard & User Concerns Management Router.

Provides:
- Complete oversight of users, technical interview reports, coding submissions,
  and uploaded candidate resumes.
- Bi-directional concern/query tracking: user can raise issues/concerns from the
  application UI, admin can review, update status, and post resolution responses,
  which are synchronized back to the user's profile.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Any, List, Dict
import json
from datetime import datetime
from database import get_connection

router = APIRouter(prefix="", tags=["Admin & Queries"])


# pydantic request models 
class CreateQueryRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    subject: str = Field(..., min_length=2, max_length=255)
    category: str = Field(default="General", max_length=100)
    urgency: str = Field(default="Medium", max_length=50)
    description: str = Field(..., min_length=5)


class UpdateQueryRequest(BaseModel):
    status: str = Field(..., max_length=50)  # pending, in review, resolved
    admin_response: Optional[str] = ""


class SaveResumeRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    filename: str = Field(..., max_length=255)
    raw_text: Optional[str] = ""
    resume_data: Optional[Dict[str, Any]] = None
    skills_detected: Optional[List[str]] = None
    experience_level: Optional[str] = "Junior"


# user-side query endpoints 

@router.post("/queries")
def create_user_query(request: CreateQueryRequest):
    """Allows a user to submit a concern or query from the UI."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        
        cursor.execute("SELECT id FROM users WHERE id = %s", (request.user_id,))
        user_row = cursor.fetchone()
        actual_user_id = user_row["id"] if user_row else 1

        insert_sql = """
        INSERT INTO user_queries (user_id, subject, category, urgency, description, status)
        VALUES (%s, %s, %s, %s, %s, 'Pending')
        """
        cursor.execute(
            insert_sql,
            (
                actual_user_id,
                request.subject.strip(),
                request.category.strip() or "General",
                request.urgency.strip() or "Medium",
                request.description.strip(),
            )
        )
        conn.commit()
        query_id = cursor.lastrowid

        cursor.execute(
            """
            SELECT q.*, u.name as user_name, u.email as user_email
            FROM user_queries q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = %s
            """,
            (query_id,)
        )
        created = cursor.fetchone()
        return {
            "success": True,
            "message": "Your query has been submitted successfully. Admin will review and update shortly.",
            "query": created
        }
    except Exception as e:
        print("[QUERIES ERROR] Failed to create query:", e)
        raise HTTPException(status_code=500, detail=f"Failed to submit query: {str(e)}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.get("/queries/user/{user_id}")
def get_user_queries(user_id: int):
    """Fetches all queries submitted by a specific user with admin replies."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, user_id, subject, category, urgency, description,
                   status, admin_response, admin_updated_at, created_at, updated_at
            FROM user_queries
            WHERE user_id = %s
            ORDER BY id DESC
            """,
            (user_id,)
        )
        queries = cursor.fetchall() or []
        return {
            "success": True,
            "queries": queries,
            "count": len(queries)
        }
    except Exception as e:
        print("[QUERIES ERROR] Failed to get user queries:", e)
        raise HTTPException(status_code=500, detail=f"Failed to fetch queries: {str(e)}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.post("/resumes/save")
def save_user_resume(request: SaveResumeRequest):
    """Persists extracted user resume into MySQL for admin oversight."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id FROM users WHERE id = %s", (request.user_id,))
        user_row = cursor.fetchone()
        actual_user_id = user_row["id"] if user_row else 1

        resume_json_str = json.dumps(request.resume_data or {})
        skills_str = ", ".join(request.skills_detected or [])

        insert_sql = """
        INSERT INTO user_resumes (user_id, filename, raw_text, resume_json, skills_detected, experience_level)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            insert_sql,
            (
                actual_user_id,
                request.filename,
                request.raw_text or "",
                resume_json_str,
                skills_str,
                request.experience_level or "Junior",
            )
        )
        conn.commit()
        return {"success": True, "resume_id": cursor.lastrowid}
    except Exception as e:
        print("[RESUME DB ERROR]:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# admin dashboard endpoints 

@router.get("/admin/stats")
def get_admin_dashboard_stats():
    """Returns top-level metric KPIs for the admin dashboard."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        
        cursor.execute("SELECT COUNT(*) as cnt FROM users")
        total_users = cursor.fetchone()["cnt"]

        
        cursor.execute("SELECT COUNT(*) as cnt, AVG(overall_score) as avg_tech FROM interview_reports")
        tech_row = cursor.fetchone()
        total_interviews = tech_row["cnt"]
        avg_tech_score = round(float(tech_row["avg_tech"] or 0), 1)

        
        cursor.execute("SELECT COUNT(*) as cnt FROM coding_submissions")
        total_coding_subs = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt, AVG(overall_score) as avg_code FROM coding_reports")
        code_row = cursor.fetchone()
        total_coding_reports = code_row["cnt"]
        avg_coding_score = round(float(code_row["avg_code"] or 0), 1)

        
        cursor.execute("SELECT COUNT(*) as cnt FROM user_queries")
        total_queries = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM user_queries WHERE status = 'Pending'")
        pending_queries = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM user_queries WHERE status = 'In Review'")
        in_review_queries = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM user_queries WHERE status = 'Resolved'")
        resolved_queries = cursor.fetchone()["cnt"]

        
        cursor.execute("SELECT COUNT(*) as cnt FROM user_resumes")
        total_resumes = cursor.fetchone()["cnt"]

        
        activities = []
        cursor.execute(
            """
            SELECT 'query' as type, q.id, q.subject as title, q.status, q.created_at, u.name as user_name
            FROM user_queries q
            LEFT JOIN users u ON q.user_id = u.id
            ORDER BY q.created_at DESC LIMIT 4
            """
        )
        for row in cursor.fetchall():
            activities.append({
                "type": "query",
                "title": f"Concern: {row['title']}",
                "user": row["user_name"] or "User",
                "meta": f"Status: {row['status']}",
                "timestamp": str(row["created_at"])
            })

        cursor.execute(
            """
            SELECT 'interview' as type, r.id, r.final_level as title, r.overall_score, r.created_at, u.name as user_name
            FROM interview_reports r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC LIMIT 4
            """
        )
        for row in cursor.fetchall():
            activities.append({
                "type": "interview",
                "title": f"Technical Interview: {row['title']}",
                "user": row["user_name"] or "User",
                "meta": f"Score: {row['overall_score']}/10",
                "timestamp": str(row["created_at"])
            })

        cursor.execute(
            """
            SELECT 'coding' as type, s.id, s.language as title, s.execution_status, s.submitted_at as created_at, u.name as user_name
            FROM coding_submissions s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.submitted_at DESC LIMIT 4
            """
        )
        for row in cursor.fetchall():
            activities.append({
                "type": "coding",
                "title": f"Coding Submission ({row['title']})",
                "user": row["user_name"] or "User",
                "meta": f"Result: {row['execution_status']}",
                "timestamp": str(row["created_at"])
            })

        activities.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)

        return {
            "success": True,
            "stats": {
                "total_users": total_users,
                "total_interviews": total_interviews,
                "total_coding_submissions": total_coding_subs,
                "total_coding_reports": total_coding_reports,
                "total_queries": total_queries,
                "pending_queries": pending_queries,
                "in_review_queries": in_review_queries,
                "resolved_queries": resolved_queries,
                "total_resumes": total_resumes,
                "avg_tech_score": avg_tech_score,
                "avg_coding_score": avg_coding_score,
            },
            "recent_activity": activities[:8]
        }
    except Exception as e:
        print("[ADMIN ERROR] get_admin_dashboard_stats:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.get("/admin/users")
def get_admin_users():
    """Lists all registered users with their interview statistics and query count."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        sql = """
        SELECT
            u.id,
            u.name,
            u.email,
            u.created_at,
            COUNT(DISTINCT ir.id) as technical_interviews_count,
            COUNT(DISTINCT cs.id) as coding_submissions_count,
            COUNT(DISTINCT uq.id) as queries_count,
            COUNT(DISTINCT ur.id) as resumes_count,
            ROUND(AVG(ir.overall_score), 1) as avg_technical_score,
            ROUND(AVG(cr.overall_score), 1) as avg_coding_score
        FROM users u
        LEFT JOIN interview_reports ir ON u.id = ir.user_id
        LEFT JOIN coding_submissions cs ON u.id = cs.user_id
        LEFT JOIN coding_reports cr ON u.id = cr.user_id
        LEFT JOIN user_queries uq ON u.id = uq.user_id
        LEFT JOIN user_resumes ur ON u.id = ur.user_id
        GROUP BY u.id, u.name, u.email, u.created_at
        ORDER BY u.id DESC
        """
        cursor.execute(sql)
        users = cursor.fetchall() or []
        return {"success": True, "users": users, "count": len(users)}
    except Exception as e:
        print("[ADMIN ERROR] get_admin_users:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.get("/admin/users/{user_id}")
def get_admin_user_details(user_id: int):
    """Detailed profile of a specific user including all reports, submissions, resumes, and queries."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, name, email, created_at FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        
        cursor.execute(
            """
            SELECT * FROM interview_reports WHERE user_id = %s ORDER BY id DESC
            """,
            (user_id,)
        )
        tech_reports = cursor.fetchall() or []

        
        cursor.execute(
            """
            SELECT id, question_number, question, answer, difficulty, correct_answer, created_at
            FROM interview_answers WHERE user_id = %s ORDER BY id DESC LIMIT 20
            """,
            (user_id,)
        )
        qa_history = cursor.fetchall() or []

        
        cursor.execute(
            """
            SELECT s.*, q.title as question_title, q.difficulty as question_difficulty
            FROM coding_submissions s
            LEFT JOIN coding_questions q ON s.question_id = q.id
            WHERE s.user_id = %s ORDER BY s.id DESC
            """,
            (user_id,)
        )
        coding_subs = cursor.fetchall() or []

        
        cursor.execute(
            """
            SELECT * FROM coding_reports WHERE user_id = %s ORDER BY id DESC
            """,
            (user_id,)
        )
        coding_reps = cursor.fetchall() or []

        
        cursor.execute(
            """
            SELECT id, filename, skills_detected, experience_level, uploaded_at, resume_json
            FROM user_resumes WHERE user_id = %s ORDER BY id DESC
            """,
            (user_id,)
        )
        resumes = cursor.fetchall() or []

        
        cursor.execute(
            """
            SELECT * FROM user_queries WHERE user_id = %s ORDER BY id DESC
            """,
            (user_id,)
        )
        queries = cursor.fetchall() or []

        return {
            "success": True,
            "user": user,
            "technical_reports": tech_reports,
            "qa_history": qa_history,
            "coding_submissions": coding_subs,
            "coding_reports": coding_reps,
            "resumes": resumes,
            "queries": queries,
        }
    except HTTPException:
        raise
    except Exception as e:
        print("[ADMIN ERROR] get_admin_user_details:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.get("/admin/interviews")
def get_admin_interviews():
    """Lists all technical interview reports across all candidates."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT
            r.id as report_id,
            r.user_id,
            u.name as user_name,
            u.email as user_email,
            r.overall_score,
            r.technical_score,
            r.skills_score,
            r.projects_score,
            r.experience_score,
            r.final_level,
            r.created_at
        FROM interview_reports r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.id DESC
        """
        cursor.execute(sql)
        reports = cursor.fetchall() or []
        return {"success": True, "interviews": reports, "count": len(reports)}
    except Exception as e:
        print("[ADMIN ERROR] get_admin_interviews:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.get("/admin/coding-submissions")
def get_admin_coding_submissions():
    """Lists all coding submissions & reports across all candidates."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT
            s.id as submission_id,
            s.user_id,
            u.name as user_name,
            u.email as user_email,
            s.question_id,
            q.title as question_title,
            q.difficulty as question_difficulty,
            s.language,
            s.code,
            s.explanation,
            s.execution_status,
            s.test_cases_passed,
            s.total_test_cases,
            s.submitted_at,
            cr.overall_score,
            cr.correctness_score,
            cr.code_quality_score,
            cr.problem_solving_score,
            cr.time_complexity,
            cr.space_complexity,
            cr.feedback,
            cr.next_difficulty
        FROM coding_submissions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN coding_questions q ON s.question_id = q.id
        LEFT JOIN coding_reports cr ON s.id = cr.submission_id
        ORDER BY s.id DESC
        """
        cursor.execute(sql)
        submissions = cursor.fetchall() or []
        return {"success": True, "submissions": submissions, "count": len(submissions)}
    except Exception as e:
        print("[ADMIN ERROR] get_admin_coding_submissions:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.get("/admin/resumes")
def get_admin_resumes():
    """Lists all uploaded candidate resumes with extracted details."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT
            r.id,
            r.user_id,
            u.name as user_name,
            u.email as user_email,
            r.filename,
            r.skills_detected,
            r.experience_level,
            r.uploaded_at,
            r.resume_json,
            r.raw_text
        FROM user_resumes r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.id DESC
        """
        cursor.execute(sql)
        resumes = cursor.fetchall() or []
        return {"success": True, "resumes": resumes, "count": len(resumes)}
    except Exception as e:
        print("[ADMIN ERROR] get_admin_resumes:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.get("/admin/queries")
def get_admin_queries(
    status: Optional[str] = Query(None, description="Filter by Pending, In Review, or Resolved"),
    search: Optional[str] = Query(None, description="Search term for user name, email, or subject"),
):
    """Lists all user queries/concerns with optional status filter and text search."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        where_clauses = []
        params = []

        if status and status.lower() != "all":
            where_clauses.append("LOWER(q.status) = LOWER(%s)")
            params.append(status.strip())

        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            where_clauses.append(
                "(LOWER(q.subject) LIKE %s OR LOWER(q.description) LIKE %s OR LOWER(u.name) LIKE %s OR LOWER(u.email) LIKE %s)"
            )
            params.extend([term, term, term, term])

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        sql = f"""
        SELECT
            q.id,
            q.user_id,
            u.name as user_name,
            u.email as user_email,
            q.subject,
            q.category,
            q.urgency,
            q.description,
            q.status,
            q.admin_response,
            q.admin_updated_at,
            q.created_at,
            q.updated_at
        FROM user_queries q
        LEFT JOIN users u ON q.user_id = u.id
        {where_sql}
        ORDER BY
            CASE q.status
                WHEN 'Pending' THEN 1
                WHEN 'In Review' THEN 2
                ELSE 3
            END,
            q.id DESC
        """
        cursor.execute(sql, tuple(params))
        queries = cursor.fetchall() or []
        return {"success": True, "queries": queries, "count": len(queries)}
    except Exception as e:
        print("[ADMIN ERROR] get_admin_queries:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.put("/admin/queries/{query_id}")
def update_admin_query(query_id: int, request: UpdateQueryRequest):
    """
    Updates the concern status and sets the Admin Response/Resolution note.
    Changes are immediately visible to the candidate in their profile and concern section.
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id FROM user_queries WHERE id = %s", (query_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Query not found")

        update_sql = """
        UPDATE user_queries
        SET status = %s,
            admin_response = %s,
            admin_updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """
        cursor.execute(
            update_sql,
            (
                request.status.strip(),
                request.admin_response.strip() if request.admin_response else None,
                query_id,
            )
        )
        conn.commit()

        cursor.execute(
            """
            SELECT q.*, u.name as user_name, u.email as user_email
            FROM user_queries q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = %s
            """,
            (query_id,)
        )
        updated = cursor.fetchone()
        return {
            "success": True,
            "message": f"Query #{query_id} updated to '{request.status}'. User will see the response in their profile.",
            "query": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        print("[ADMIN ERROR] update_admin_query:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@router.delete("/admin/queries/{query_id}")
def delete_admin_query(query_id: int):
    """Deletes a concern from the database."""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("DELETE FROM user_queries WHERE id = %s", (query_id,))
        conn.commit()
        return {"success": True, "message": f"Query #{query_id} deleted."}
    except Exception as e:
        print("[ADMIN ERROR] delete_admin_query:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
