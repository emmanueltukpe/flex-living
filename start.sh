#!/bin/bash

# FlexLiving Reviews Dashboard - Startup Script

echo "🚀 Starting FlexLiving Reviews Dashboard..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null
then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "    sudo systemctl start mongod"
    echo "    or"
    echo "    mongod --dbpath /path/to/db"
    exit 1
fi

echo "✅ MongoDB is running"

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start backend
echo "🔧 Starting backend server on port 5001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend on port 3000..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✨ FlexLiving Reviews Dashboard is running!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:5001/api/health"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user to stop
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait