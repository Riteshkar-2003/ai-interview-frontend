import bcrypt
from database import get_connection

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    """
    password_bytes = password.encode("utf-8")
    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )
    return hashed.decode("utf-8")

def verify_password(
    password: str,
    password_hash: str
) -> bool:
    """
    Verify a plain-text password against a bcrypt hash.
    """
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def signup_user(
    name: str,
    email: str,
    password: str
):
    """
    Create a new user.
    """
    connection = None
    cursor = None
    try:

        name = name.strip()
        email = email.strip().lower()

        if not name:
            return {
                "success": False,
                "message": "Name is required"
            }

        if not email:
            return {
                "success": False,
                "message": "Email is required"
            }

        if not password:
            return {
                "success": False,
                "message": "Password is required"
            }

        connection = get_connection()
        cursor = connection.cursor(
            dictionary=True
        )
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )
        existing_user = cursor.fetchone()
        if existing_user:
            return {
                "success": False,
                "message": "Email already registered"
            }
        password_hash = hash_password(
            password
        )
        cursor.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                password_hash
            )
            VALUES
            (
                %s,
                %s,
                %s
            )
            """,
            (
                name,
                email,
                password_hash
            )
        )
        connection.commit()
        user_id = cursor.lastrowid
        return {
            "success": True,
            "message": "Signup successful",
            "user_id": user_id
        }
    except Exception as e:
        if connection:
            try:
                connection.rollback()
            except Exception:
                pass
        print(
            "Signup database error:",
            repr(e)
        )
        return {
            "success": False,
            "message": "Unable to create account"
        }
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

def login_user(
    email: str,
    password: str
):
    """
    Authenticate a user using email and password.
    """
    connection = None
    cursor = None
    try:
        email = email.strip().lower()
        if not email:
            return {
                "success": False,
                "message": "Email is required"
            }
        if not password:
            return {
                "success": False,
                "message": "Password is required"
            }
        connection = get_connection()
        cursor = connection.cursor(
            dictionary=True
        )
        cursor.execute(
            """
            SELECT
                id,
                name,
                email,
                password_hash
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )
        user = cursor.fetchone()
        if not user:
            return {
                "success": False,
                "message": "Invalid email or password"
            }
        if not verify_password(
            password,
            user["password_hash"]
        ):
            return {
                "success": False,
                "message": "Invalid email or password"
            }
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }
    except Exception as e:
        print(
            "Login database error:",
            repr(e)
        )
        return {
            "success": False,
            "message": "Unable to login"
        }
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


