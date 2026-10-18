# ==============================================================================
# Stage 1: Build React 19 / Vite Frontend
# ==============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Production Python 3.12 Backend + Full-Stack Runtime
# ==============================================================================
FROM python:3.12-slim AS runner

WORKDIR /app

# Install system runtime dependencies for OpenCV and networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/app ./app
COPY backend/tests ./tests

# Copy built frontend static assets from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set production environment defaults
ENV PYTHONUNBUFFERED=1 \
    FRONTEND_DIST=/app/frontend/dist \
    EVIDENCE_DIR=/app/evidence \
    PORT=8000

# Initialize evidence directories
RUN mkdir -p /app/evidence/snapshots /app/evidence/recordings

EXPOSE 8000 10000

# Launch Uvicorn dynamically bound to Render's $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
