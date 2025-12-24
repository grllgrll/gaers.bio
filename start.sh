#!/bin/bash

# GAERS Website - Local Development Server Startup Script
# Usage: ./start.sh [port]
# Default port: 8000

PORT=${1:-8000}
BROWSER_OPEN=${BROWSER_OPEN:-true}

echo "========================================="
echo "  GAERS Website - Local Server"
echo "========================================="
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed or not in PATH"
    echo "   Please install Python 3 to run the local server"
    exit 1
fi

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Port $PORT is already in use"
    echo "   Please close the other application or use a different port:"
    echo "   ./start.sh 8001"
    exit 1
fi

echo "📂 Working directory: $(pwd)"
echo "🌐 Starting HTTP server on port $PORT..."
echo ""
echo "🔗 Open in browser:"
echo "   http://localhost:$PORT"
echo ""
echo "📄 Available pages:"
echo "   http://localhost:$PORT/index.html"
echo "   http://localhost:$PORT/spatial-transcriptomics.html"
echo "   http://localhost:$PORT/bulk-rnaseq.html"
echo "   http://localhost:$PORT/gene-search.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================="
echo ""

# Open browser (macOS only, optional)
if [[ "$OSTYPE" == "darwin"* ]] && [[ "$BROWSER_OPEN" == "true" ]]; then
    sleep 1
    open "http://localhost:$PORT" 2>/dev/null || true
fi

# Start server
python3 -m http.server $PORT
