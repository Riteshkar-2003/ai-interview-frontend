# Multi-Language Code Execution Sandbox Dockerfile
# Supports Python 3.11, OpenJDK 17 (Java), Node.js (JavaScript), GCC/G++ (C/C++)

FROM python:3.11-slim

# Prevent interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install OpenJDK 17, Node.js, and C/C++ compilers (gcc/g++)
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jdk-headless \
    nodejs \
    gcc \
    g++ \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set up JAVA_HOME and ensure javac/java are in PATH
ENV JAVA_HOME="/usr/lib/jvm/default-java"
ENV PATH="${JAVA_HOME}/bin:${PATH}"

WORKDIR /app

# Install Python dependencies first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (default FastAPI / Uvicorn port)
EXPOSE 8000

# Start Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
