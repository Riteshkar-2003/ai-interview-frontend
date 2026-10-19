"""
create_admin.py
---------------
One-time utility script to create a new admin user directly in the database.
Run with: python create_admin.py
"""

import sys
sys.path.insert(0, "e:/final_project_1/backend")

from admin_auth import hash_admin_password
from database import get_connection


USERNAME  = "superadmin"
EMAIL     = "superadmin@worksbot.ai"
PASSWORD  = "WorksBot@Admin#2024"
FULL_NAME = "Super Administrator"


def create_admin():
    pw_hash = hash_admin_password(PASSWORD)
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT id FROM admin_users WHERE username = %s OR email = %s",
        (USERNAME, EMAIL)
    )
    existing = cursor.fetchone()

    if existing:
        admin_id = existing["id"]
        print(f"[INFO] Admin already exists (id={admin_id}). Updating password and activating...")
        cursor.execute(
            "UPDATE admin_users SET password_hash = %s, full_name = %s, is_active = 1 WHERE id = %s",
            (pw_hash, FULL_NAME, admin_id)
        )
        conn.commit()
        print("[OK] Password updated successfully.")
    else:
        cursor.execute(
            """
            INSERT INTO admin_users (username, email, password_hash, full_name, is_active)
            VALUES (%s, %s, %s, %s, 1)
            """,
            (USERNAME, EMAIL, pw_hash, FULL_NAME)
        )
        conn.commit()
        admin_id = cursor.lastrowid
        print(f"[OK] New admin created! id={admin_id}")

    cursor.close()
    conn.close()

    print()
    print("=" * 45)
    print("   ADMIN CREDENTIALS")
    print("=" * 45)
    print(f"  Username : {USERNAME}")
    print(f"  Email    : {EMAIL}")
    print(f"  Password : {PASSWORD}")
    print(f"  Login URL: http://localhost:3000/admin/login")
    print("=" * 45)


if __name__ == "__main__":
    create_admin()
