#!/bin/bash
set -e

# Change to the project root directory
cd "$(dirname "$0")/.."

echo "Building Docker image..."
docker build -t kanban-studio .

echo "Starting Docker container..."
docker run -d --name kanban-studio -p 8000:8000 --env-file .env kanban-studio

echo "Application started!"
echo "- API available at http://localhost:8000/api/hello"
echo "- UI available at http://localhost:8000/"
