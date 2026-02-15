#!/bin/bash

# ProdView Development Environment Startup Script
# This script checks prerequisites and starts both backend and frontend servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  ProdView Development Server Startup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to check if PostgreSQL is accessible
check_postgres() {
    timeout 2 bash -c "cat < /dev/null > /dev/tcp/localhost/5432" 2>/dev/null
}

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js v18+"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found. Please install npm"
    exit 1
fi

# Check PostgreSQL
echo -ne "  Checking PostgreSQL connection..."
if check_postgres; then
    echo -e " ${GREEN}✓${NC} PostgreSQL is running on port 5432"
else
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}ERROR: PostgreSQL is not accessible on localhost:5432${NC}"
    echo ""
    echo "Please start PostgreSQL:"
    echo "  Linux:   sudo systemctl start postgresql"
    echo "  macOS:   brew services start postgresql"
    echo "  Windows: Start-Service -Name postgresql-x64-14"
    echo "  Docker:  docker-compose up -d postgres"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Checking environment configuration...${NC}"

# Check backend .env
if [ -f "$BACKEND_DIR/.env" ]; then
    echo -e "${GREEN}✓${NC} Backend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Backend .env not found. Creating from .env.example..."
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        echo -e "${GREEN}✓${NC} Created backend/.env"
    else
        echo -e "${RED}✗${NC} Backend .env.example not found"
        exit 1
    fi
fi

# Check frontend .env
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${GREEN}✓${NC} Frontend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Frontend .env not found. Creating from .env.example..."
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        echo -e "${GREEN}✓${NC} Created .env"
    else
        echo -e "${RED}✗${NC} Frontend .env.example not found"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}Step 3: Checking port availability...${NC}"

# Check if backend port (3000) is available
if port_in_use 3000; then
    echo -e "${YELLOW}⚠${NC} Port 3000 is already in use"
    read -p "  Kill existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Killed process on port 3000"
    else
        echo -e "${RED}✗${NC} Cannot start backend on port 3000"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Port 3000 available (backend)"
fi

# Check if frontend port (5173) is available
if port_in_use 5173; then
    echo -e "${YELLOW}⚠${NC} Port 5173 is already in use"
    read -p "  Kill existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Killed process on port 5173"
    else
        echo -e "${RED}✗${NC} Cannot start frontend on port 5173"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Port 5173 available (frontend)"
fi

echo ""
echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"

# Backend dependencies
echo -ne "  Installing backend dependencies..."
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install --silent > /dev/null 2>&1
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${BLUE}(skipped - already installed)${NC}"
fi

# Generate Prisma client
echo -ne "  Generating Prisma client..."
npx prisma generate > /dev/null 2>&1
echo -e " ${GREEN}✓${NC}"

# Frontend dependencies
echo -ne "  Installing frontend dependencies..."
cd "$PROJECT_ROOT"
if [ ! -d "node_modules" ]; then
    npm install --silent > /dev/null 2>&1
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${BLUE}(skipped - already installed)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Checking database...${NC}"

cd "$BACKEND_DIR"

# Check if database needs migration
echo -ne "  Checking database migrations..."
if npx prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
    echo -e " ${GREEN}✓${NC} Database schema is up to date"
else
    echo -e " ${YELLOW}⚠${NC} Database needs migration"
    echo "  Running migrations..."
    npx prisma migrate deploy
    echo -e "${GREEN}✓${NC} Migrations applied"
fi

echo ""
echo -e "${YELLOW}Step 6: Checking upload directory...${NC}"

# Create uploads directory if it doesn't exist
if [ ! -d "$BACKEND_DIR/uploads" ]; then
    mkdir -p "$BACKEND_DIR/uploads"
    touch "$BACKEND_DIR/uploads/.gitkeep"
    echo -e "${GREEN}✓${NC} Created uploads directory"
else
    UPLOAD_COUNT=$(ls -1 "$BACKEND_DIR/uploads" | wc -l)
    echo -e "${GREEN}✓${NC} Uploads directory exists ($UPLOAD_COUNT files)"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  All prerequisites checked!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Starting servers...${NC}"
echo ""
echo -e "${YELLOW}Backend will start on:${NC}  http://localhost:3000"
echo -e "${YELLOW}Frontend will start on:${NC} http://localhost:5173"
echo ""
echo -e "${YELLOW}Note: Keep this terminal open. Press Ctrl+C to stop all servers.${NC}"
echo ""

# Create log directory
mkdir -p "$PROJECT_ROOT/logs"

# Start backend in background
echo -e "${BLUE}[Backend]${NC} Starting NestJS server..."
cd "$BACKEND_DIR"
npm run start:dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo -ne "${BLUE}[Backend]${NC} Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/products > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        echo -e "${GREEN}[Backend]${NC} Server ready at http://localhost:3000"
        break
    fi
    sleep 1
    echo -ne "."
done

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}[Backend]${NC} Failed to start. Check logs/backend.log for details"
    cat "$PROJECT_ROOT/logs/backend.log"
    exit 1
fi

# Test static file serving
echo -ne "${BLUE}[Backend]${NC} Testing static file serving..."
UPLOAD_FILE=$(ls "$BACKEND_DIR/uploads" | grep -E '\.(png|jpg|jpeg|gif|webp)$' | head -1)
if [ -n "$UPLOAD_FILE" ]; then
    if curl -s -I "http://localhost:3000/uploads/$UPLOAD_FILE" | grep -q "200 OK"; then
        echo -e " ${GREEN}✓${NC}"
    else
        echo -e " ${YELLOW}⚠${NC} (no test file available)"
    fi
else
    echo -e " ${BLUE}(no files to test)${NC}"
fi

echo ""

# Start frontend
echo -e "${BLUE}[Frontend]${NC} Starting Vite dev server..."
cd "$PROJECT_ROOT"
npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo -ne "${BLUE}[Frontend]${NC} Waiting for server to start..."
for i in {1..20}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        echo -e "${GREEN}[Frontend]${NC} Server ready at http://localhost:5173"
        break
    fi
    sleep 1
    echo -ne "."
done

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}[Frontend]${NC} Failed to start. Check logs/frontend.log for details"
    cat "$PROJECT_ROOT/logs/frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✓ All servers running successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}URLs:${NC}"
echo -e "  Frontend:    ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:3000/api${NC}"
echo -e "  Admin Panel: ${GREEN}http://localhost:5173/admin/login${NC}"
echo ""
echo -e "${BLUE}Default Admin Credentials:${NC}"
echo -e "  Email:    xxxxxxxxxxxxx"
echo -e "  Password: xxxxxxxxxxxxx"
echo ""
echo -e "${YELLOW}Logs are being written to:${NC}"
echo -e "  Backend:  logs/backend.log"
echo -e "  Frontend: logs/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Servers stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
