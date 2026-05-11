#!/bin/bash
# ClauseGuard — Development Startup Script
# Usage: ./start-dev.sh

echo "🛡️  ClauseGuard — Starting Development Environment"
echo "=================================================="

# Check if virtual environments exist
if [ ! -d "ClauseGuard-backend/venv" ]; then
    echo "❌ Backend venv not found. Run: cd ClauseGuard-backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

if [ ! -d "ClauseGuard-rag/venv" ]; then
    echo "❌ RAG venv not found. Run: cd ClauseGuard-rag && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if node_modules exist
if [ ! -d "ClauseGuard-frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd ClauseGuard-frontend && npm install && cd ..
fi

echo ""
echo "🚀 Starting all services..."
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   RAG:       http://localhost:8001"
echo "   RAG Docs:  http://localhost:8001/docs"
echo ""

npx concurrently \
    --names "FRONTEND,BACKEND,RAG" \
    --prefix-colors "cyan,yellow,green" \
    "cd ClauseGuard-frontend && npm run dev" \
    "cd ClauseGuard-backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000" \
    "cd ClauseGuard-rag && source venv/bin/activate && python run.py"
