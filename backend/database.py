import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()


_db_initialized: bool = False

TABLE_CREATION_QUERIES = [
    # 1. Users table
    """
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 2. Technical Interview overall reports
    """
    CREATE TABLE IF NOT EXISTS interview_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        overall_score FLOAT DEFAULT 0,
        technical_score FLOAT DEFAULT 0,
        skills_score FLOAT DEFAULT 0,
        projects_score FLOAT DEFAULT 0,
        experience_score FLOAT DEFAULT 0,
        final_level VARCHAR(100) DEFAULT 'Junior',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 3. Technical Interview individual Q&A and evaluations
    """
    CREATE TABLE IF NOT EXISTS interview_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_number INT DEFAULT 1,
        question TEXT,
        answer TEXT,
        difficulty VARCHAR(50) DEFAULT 'Easy',
        evaluation LONGTEXT,
        correct_answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 4. Coding questions bank
    """
    CREATE TABLE IF NOT EXISTS coding_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty VARCHAR(50) DEFAULT 'Easy',
        input_format TEXT,
        output_format TEXT,
        constraints_text TEXT,
        examples LONGTEXT,
        test_cases LONGTEXT,
        reference_solution LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 5. Coding submissions
    """
    CREATE TABLE IF NOT EXISTS coding_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT DEFAULT 1,
        language VARCHAR(50) DEFAULT 'python',
        code LONGTEXT,
        explanation TEXT,
        execution_status VARCHAR(100) DEFAULT 'Executed',
        test_cases_passed INT DEFAULT 0,
        total_test_cases INT DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_question_id (question_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 6. Coding evaluation reports
    """
    CREATE TABLE IF NOT EXISTS coding_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT DEFAULT 1,
        submission_id INT DEFAULT 1,
        overall_score FLOAT DEFAULT 0,
        correctness_score FLOAT DEFAULT 0,
        code_quality_score FLOAT DEFAULT 0,
        problem_solving_score FLOAT DEFAULT 0,
        explanation_score FLOAT DEFAULT 0,
        time_complexity VARCHAR(100) DEFAULT 'O(N)',
        space_complexity VARCHAR(100) DEFAULT 'O(1)',
        feedback TEXT,
        strengths TEXT,
        improvements TEXT,
        next_difficulty VARCHAR(50) DEFAULT 'Easy',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_submission_id (submission_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 7. User concerns and queries
    """
    CREATE TABLE IF NOT EXISTS user_queries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        urgency VARCHAR(50) NOT NULL DEFAULT 'Medium',
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        admin_response TEXT DEFAULT NULL,
        admin_updated_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 8. User uploaded resumes
    """
    CREATE TABLE IF NOT EXISTS user_resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        raw_text LONGTEXT,
        resume_json LONGTEXT,
        skills_detected TEXT,
        experience_level VARCHAR(100) DEFAULT 'Junior',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 9. Admin users table (completely separate from regular users)
    """
    CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) DEFAULT 'Administrator',
        is_active TINYINT(1) DEFAULT 1,
        last_login TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
]


def _get_db_config():
    """Returns database configuration parameters from environment."""
    return {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "port": int(os.getenv("MYSQL_PORT", 3306)),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", ""),
        "database": os.getenv("MYSQL_DATABASE", "ai_interview"),
    }


def init_db():
    """
    Creates the database (if not exists), connects to it, and ensures all
    necessary schema tables exist. If tables already exist, they are preserved.
    Also ensures a default fallback user (ID=1) is seeded for guest sessions.
    """
    global _db_initialized
    cfg = _get_db_config()
    server_conn = None
    db_conn = None

    try:
        server_conn = mysql.connector.connect(
            host=cfg["host"],
            port=cfg["port"],
            user=cfg["user"],
            password=cfg["password"]
        )
        server_cursor = server_conn.cursor()
        create_db_query = (
            f"CREATE DATABASE IF NOT EXISTS `{cfg['database']}` "
            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        )
        server_cursor.execute(create_db_query)
        server_conn.commit()
        server_cursor.close()
        server_conn.close()
        server_conn = None

       
        db_conn = mysql.connector.connect(
            host=cfg["host"],
            port=cfg["port"],
            user=cfg["user"],
            password=cfg["password"],
            database=cfg["database"]
        )
        cursor = db_conn.cursor()

        for query in TABLE_CREATION_QUERIES:
            cursor.execute(query)

     
        seed_user_query = """
        INSERT IGNORE INTO users (id, name, email, password_hash)
        VALUES (1, 'Candidate', 'candidate@interview.ai', '');
        """
        cursor.execute(seed_user_query)

       
        import bcrypt as _bcrypt
        _admin_pass = _bcrypt.hashpw(b"Admin@WorksBot2024", _bcrypt.gensalt()).decode("utf-8")
        seed_admin_query = """
        INSERT IGNORE INTO admin_users (id, username, email, password_hash, full_name)
        VALUES (1, 'admin', 'admin@worksbot.ai', %s, 'Platform Administrator');
        """
        cursor.execute(seed_admin_query, (_admin_pass,))
        db_conn.commit()

        cursor.close()
        db_conn.close()
        db_conn = None

        _db_initialized = True
        print(f"[DB] Database `{cfg['database']}` and all schema tables verified/ready.")

    except Error as e:
        print(f"[DB WARNING] Database initialization failed: {e}")
    finally:
        if server_conn and server_conn.is_connected():
            server_conn.close()
        if db_conn and db_conn.is_connected():
            db_conn.close()


def get_connection():
    """
    Returns an active connection to the configured MySQL database.
    Automatically runs init_db() once if not already initialized.
    """
    global _db_initialized
    if not _db_initialized:
        init_db()

    cfg = _get_db_config()
    try:
        connection = mysql.connector.connect(
            host=cfg["host"],
            port=cfg["port"],
            user=cfg["user"],
            password=cfg["password"],
            database=cfg["database"],
        )
        return connection
    except Error as e:
        print("[DB ERROR] Failed to connect to database:", e)
        raise
