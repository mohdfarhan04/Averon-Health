#!/bin/bash

echo ""
echo "======================================"
echo "🔄 Backend Restart & Verification"
echo "======================================"
echo ""

echo "1️⃣  Stopping any running backend processes..."
# Find and kill node processes running server.js
pgrep -f "node.*server.js" | xargs kill 2>/dev/null || echo "   No running backend found"

echo ""
echo "2️⃣  Starting backend server..."
cd "$(dirname "$0")"
npm run dev &
BACKEND_PID=$!

echo "   Backend started (PID: $BACKEND_PID)"
echo ""
echo "3️⃣  Waiting for server to start..."
sleep 3

echo ""
echo "4️⃣  Checking health endpoint..."
curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health

echo ""
echo ""
echo "======================================"
echo "✅ Backend is ready!"
echo "======================================"
echo ""
echo "📝 Next steps:"
echo "   1. Open frontend/averon-main.html in your browser"
echo "   2. Fill out and submit the contact form"
echo "   3. Check your Google Sheet for the new entry"
echo ""
echo "💡 Press Ctrl+C to stop the server"
echo ""
