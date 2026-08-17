# Multi-stage lightweight Python Dockerfile for MedBento AI
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=38999 \
    HOST=0.0.0.0

WORKDIR /app

# Install system dependencies & fonts for ReportLab if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definition
COPY requirements.txt .

# Install Python requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application code
COPY . .

# Expose custom high-range non-standard port
EXPOSE 38999

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:38999/api/status || exit 1

# Start MedBento server
CMD ["python", "server.py"]
