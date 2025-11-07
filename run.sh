#!/bin/bash

echo "===================================="
echo "   Mobile MCP Server - Docker Runner"
echo "===================================="
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running or not installed!"
    echo "Please start Docker and try again."
    echo
    exit 1
fi

echo "✅ Docker is running..."
echo

# Check if docker-compose is available
if command -v docker-compose > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif command -v docker > /dev/null 2>&1 && docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ ERROR: Neither 'docker-compose' nor 'docker compose' is available!"
    echo "Please install Docker Compose and try again."
    echo
    exit 1
fi

echo "✅ Docker Compose is available..."
echo

echo "🚀 Building and starting Mobile MCP Server..."
echo "Command: $DOCKER_COMPOSE_CMD up --build"
echo

# Build and start the container
$DOCKER_COMPOSE_CMD up --build

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo
    echo "✅ Mobile MCP Server stopped successfully!"
else
    echo
    echo "❌ Error occurred while running Mobile MCP Server"
    echo "Check the logs above for details."
fi

echo
echo "Press Enter to exit..."
read
