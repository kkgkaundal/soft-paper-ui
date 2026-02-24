#!/bin/bash

# Soft Paper UI Demo Launcher

echo "🧻 Soft Paper UI - Demo Launcher"
echo "=================================="
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "⚠️  Build artifacts not found. Building project..."
    npm run build
    echo "✅ Build complete!"
    echo ""
fi

# Function to open URL in default browser
open_browser() {
    local url=$1
    
    if command -v xdg-open > /dev/null; then
        xdg-open "$url"
    elif command -v open > /dev/null; then
        open "$url"
    elif command -v start > /dev/null; then
        start "$url"
    else
        echo "Please open $url in your browser"
    fi
}

# Check if a server is already running
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Server already running on port 8080"
    echo ""
else
    echo "🚀 Starting local server on port 8080..."
    echo ""
    
    # Try different server options
    if command -v python3 > /dev/null; then
        python3 -m http.server 8080 > /dev/null 2>&1 &
        SERVER_PID=$!
        echo "✅ Server started (Python)"
    elif command -v python > /dev/null; then
        python -m http.server 8080 > /dev/null 2>&1 &
        SERVER_PID=$!
        echo "✅ Server started (Python)"
    elif command -v npx > /dev/null; then
        npx http-server -p 8080 -s > /dev/null 2>&1 &
        SERVER_PID=$!
        echo "✅ Server started (npx http-server)"
    elif command -v php > /dev/null; then
        php -S localhost:8080 > /dev/null 2>&1 &
        SERVER_PID=$!
        echo "✅ Server started (PHP)"
    else
        echo "❌ No suitable server found. Please install Python, Node.js, or PHP."
        exit 1
    fi
    
    # Wait for server to start
    sleep 2
    echo ""
fi

# Show options
echo "Choose a demo to view:"
echo ""
echo "1) 📄 Full Page Demo (Recommended)"
echo "   - Complete showcase with all features"
echo "   - 21 interactive elements"
echo "   - Live controls panel"
echo ""
echo "2) 🏠 Landing Page"
echo "   - Feature highlights"
echo "   - Code examples"
echo "   - Documentation"
echo ""
echo "3) 🌐 Open both in tabs"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Opening Full Page Demo..."
        open_browser "http://localhost:8080/demo/full-page.html"
        ;;
    2)
        echo ""
        echo "🚀 Opening Landing Page..."
        open_browser "http://localhost:8080/demo/index.html"
        ;;
    3)
        echo ""
        echo "🚀 Opening both demos..."
        open_browser "http://localhost:8080/demo/full-page.html"
        sleep 1
        open_browser "http://localhost:8080/demo/index.html"
        ;;
    *)
        echo ""
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Demo launched!"
echo ""
echo "📊 Server running at: http://localhost:8080"
echo "📁 Full Page: http://localhost:8080/demo/full-page.html"
echo "🏠 Landing: http://localhost:8080/demo/index.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Keep script running if we started the server
if [ ! -z "$SERVER_PID" ]; then
    trap "kill $SERVER_PID 2>/dev/null; echo ''; echo '🛑 Server stopped'; exit" INT TERM
    wait $SERVER_PID
fi
