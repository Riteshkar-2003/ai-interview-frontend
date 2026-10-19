import os
from dotenv import load_dotenv
from google.auth.transport import requests
from google.oauth2 import id_token
from database import get_connection


load_dotenv()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


def google_login_user(credential: str):
    if not GOOGLE_CLIENT_ID:
        raise Exception(
            "GOOGLE_CLIENT_ID is missing in backend .env"
        )

    client_id = GOOGLE_CLIENT_ID.strip()

    if not credential:
        raise Exception(
            "Google credential is missing"
        )

    credential = credential.strip()

    token_parts = credential.split(".")

    if len(token_parts) != 3:
        raise Exception(
            "Google returned an OAuth access token instead of "
            "an ID token. Frontend must send response.credential."
        )

    try:

        idinfo = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            client_id
        )

    except ValueError as e:
        raise Exception(
            "Invalid Google ID token"
        )

    token_audience = idinfo.get("aud")
    if token_audience != client_id:

        raise Exception(
            "Google token audience does not match "
            "GOOGLE_CLIENT_ID"
        )

    email = idinfo.get("email")
    name = idinfo.get("name")

    if not email:
        raise Exception(
            "Google account email not available"
        )

    email = email.strip().lower()
    if not name:
        name = email.split("@")[0]
    name = name.strip()
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, name, email
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        user = cursor.fetchone()
        if user:

            return {
                "success": True,
                "message": "Google login successful",
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"]
                }
            }

        cursor.execute(
            """
            INSERT INTO users
                (name, email, password_hash)
            VALUES
                (%s, %s, %s)
            """,
            (
                name,
                email,
                ""
            )
        )
        connection.commit()
        user_id = cursor.lastrowid
        return {
            "success": True,
            "message": "Google account created successfully",
            "user": {
                "id": user_id,
                "name": name,
                "email": email
            }
        }
    except Exception as e:
        connection.rollback()
        raise Exception(
            f"Google login database error: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        connection.close()

