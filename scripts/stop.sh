#!/bin/bash
set -e

echo "Stopping Docker container..."
docker stop kanban-studio || true

echo "Removing Docker container..."
docker rm kanban-studio || true

echo "Application stopped!"
