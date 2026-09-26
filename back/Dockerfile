FROM python:3.14-slim

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/


RUN mkdir -p /app/db
RUN touch /app/db/pamokos.json
# Set working directory for the backend to be nested, 
# so the `Path(__file__).parent.parent.parent.parent / "db"` 
# resolves to /app/db
WORKDIR /app/back

# Copy the project source before building the package so uv can find src/back/__init__.py
COPY . .

# Install dependencies via uv
RUN uv sync --frozen --no-cache

# Run uvicorn server via uv run
CMD ["uv", "run", "uvicorn", "src.back.main:app", "--host", "0.0.0.0", "--port", "8000"]
