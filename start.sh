#!/bin/bash

# Node.js startup script for Zuldeira Amplifi
# Simple bash wrapper to run the server

set -e

echo "Starting Zuldeira Amplifi server..."
npx tsx server.ts
