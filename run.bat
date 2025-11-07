@echo off
echo ====================================
echo    Mobile MCP Server - Docker Runner
echo ====================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo Docker is running... ✓
echo.

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: docker-compose not found, trying 'docker compose'...
    docker compose --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Neither 'docker-compose' nor 'docker compose' is available!
        echo Please install Docker Compose and try again.
        echo.
        pause
        exit /b 1
    )
    set DOCKER_COMPOSE_CMD=docker compose
) else (
    set DOCKER_COMPOSE_CMD=docker-compose
)

echo Docker Compose is available... ✓
echo.

echo Building and starting Mobile MCP Server...
echo Command: %DOCKER_COMPOSE_CMD% up --build
echo.

REM Build and start the container
%DOCKER_COMPOSE_CMD% up --build

REM Check if the command was successful
if %errorlevel% equ 0 (
    echo.
    echo ✅ Mobile MCP Server stopped successfully!
) else (
    echo.
    echo ❌ Error occurred while running Mobile MCP Server
    echo Check the logs above for details.
)

echo.
echo Press any key to exit...
pause >nul
