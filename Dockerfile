# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/front
# Copy frontend source
COPY front/package*.json ./
RUN npm ci
COPY front/ ./
# Build the production Vite bundle
RUN npm run build


# Stage 2: Build the FastAPI Backend and combine
FROM python:3.14-slim
# Install uv for fast python dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory to root so relative paths work
WORKDIR /app

# Copy backend dependencies and install (without the project source first for docker caching)
COPY back/pyproject.toml back/uv.lock back/
WORKDIR /app/back
RUN uv sync --frozen --no-cache --no-install-project

# Copy the rest of the backend source
WORKDIR /app
COPY back/ /app/back/
WORKDIR /app/back
RUN uv sync --frozen --no-cache

# Copy the built frontend files from Stage 1 into the location the backend expects
COPY --from=frontend-builder /app/front/dist /app/front/dist

# Expose the API and UI port
EXPOSE 8000

# Run the unified application using uvicorn
WORKDIR /app/back
CMD ["uv", "run", "uvicorn", "src.back.main:app", "--host", "0.0.0.0", "--port", "8000"]
