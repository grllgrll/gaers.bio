#!/bin/bash
# This file allows double-clicking from macOS Finder

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to that directory
cd "$DIR"

# Run the main startup script
./start.sh

# Keep terminal open on exit
echo ""
echo "Press any key to close this window..."
read -n 1
