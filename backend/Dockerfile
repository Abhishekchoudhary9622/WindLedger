# Backend Dockerfile for WindLedger FastAPI
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definition
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and data files
COPY app/ ./app/
COPY data/ ./data/

# Expose FastAPI default port
EXPOSE 8000

# Run uvicorn server with dynamic port support for cloud hosts
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
