#!/usr/bin/env bash
echo "========================================================"
echo "   AI SMART LIBRARY MANAGEMENT SYSTEM"
echo "   B.Tech CSE 7th Semester Minor Project"
echo "========================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    echo "Please download and install Node.js from https://nodejs.org"
    exit 1
fi

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "First-time setup: Installing required packages..."
    npm install
fi

echo "Starting AI Smart Library on http://localhost:3000 ..."

# Attempt to open default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3000" &
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:3000" &
fi

node server.js
