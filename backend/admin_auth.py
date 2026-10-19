"""
admin_auth.py
=============
Admin authentication module — completely isolated from regular user auth.

Provides:
- Admin login with username/password verification against admin_users table
- JWT access token generation (HS256, 8-hour expiry)
- Token validation helper for protecting admin endpoints
"""

import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from database import get_connection

# JWT configuration 
# Uses a separate secret from user JWTs (if any). Falls back to a strong default.
ADMIN_JWT_SECRET = os.getenv(
    "ADMIN_JWT_SECRET",
    "AdminWorksBot$Super$Secret$2024#XyZ!@#"
)
ADMIN_JWT_ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRE_HOURS = 8


# password helpers 

def hash_admin_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_admin_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# JWT helpers 

def create_admin_token(admin_id: int, username: str) -> str:
    """
    Generate a signed JWT for an authenticated admin session.
    Token carries: admin_id, username, role='admin', issued-at, expiry.
    """
    now = datetime.now(tz=timezone.utc)
    payload = {
        "sub": str(admin_id),
        "username": username,
        "role": "admin",
        "iat": now,
        "exp": now + timedelta(hours=ADMIN_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, ADMIN_JWT_SECRET, algorithm=ADMIN_JWT_ALGORITHM)


def decode_admin_token(token: str) -> dict:
    """
    Decode and validate an admin JWT.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    Returns the decoded payload dict on success.
    """
    return jwt.decode(token, ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGORITHM])


# login logic 

def login_admin(username: str, password: str) -> dict:
    """
    Authenticate an admin using username (or email) and password.

    Returns a dict with:
      success, message, token (JWT), admin (id, username, email, full_name)
    """
    connection = None
    cursor = None
    try:
        username = username.strip().lower()
        if not username:
            return {"success": False, "message": "Username is required"}
        if not password:
            return {"success": False, "message": "Password is required"}

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

       
        cursor.execute(
            """
            SELECT id, username, email, password_hash, full_name, is_active
            FROM admin_users
            WHERE LOWER(username) = %s OR LOWER(email) = %s
            LIMIT 1
            """,
            (username, username),
        )
        admin = cursor.fetchone()

        if not admin:
            return {"success": False, "message": "Invalid username or password"}

        if not admin.get("is_active"):
            return {"success": False, "message": "Admin account is disabled. Contact system owner."}

        if not verify_admin_password(password, admin["password_hash"]):
            return {"success": False, "message": "Invalid username or password"}

       
        cursor.execute(
            "UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = %s",
            (admin["id"],),
        )
        connection.commit()

        token = create_admin_token(admin["id"], admin["username"])

        return {
            "success": True,
            "message": "Admin login successful",
            "token": token,
            "admin": {
                "id": admin["id"],
                "username": admin["username"],
                "email": admin["email"],
                "full_name": admin["full_name"],
            },
        }

    except Exception as e:
        print("[ADMIN AUTH ERROR] login_admin:", repr(e))
        return {"success": False, "message": "Authentication service error"}
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if connection:
            try:
                connection.close()
            except Exception:
                pass


def verify_admin_token_from_header(authorization: str) -> dict:
    """
    Extract and validate the Bearer token from the Authorization header string.
    Returns decoded payload or raises ValueError/jwt errors.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise ValueError("Missing or malformed Authorization header")
    token = authorization.split(" ", 1)[1].strip()
    return decode_admin_token(token)
