# Build the frontend Next.js app
FROM node:20-slim AS frontend-build
WORKDIR /frontend

# Copy package files and install dependencies
COPY ./frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY ./frontend .
RUN npm run build

# Backend and final image
FROM python:3.12-slim

# Install uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy the application into the container.
COPY ./backend /app
WORKDIR /app

# Copy built frontend static files
COPY --from=frontend-build /frontend/out /app/static

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Sync the project into a new environment, using the frozen lockfile
RUN uv sync --frozen

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Expose backend port
EXPOSE 8000

# Run the FastAPI server by default
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
