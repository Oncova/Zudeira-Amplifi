#!/usr/bin/env node

/**
 * Node.js entry point for Zuldeira Amplifi
 * Runs the Express server with TypeScript support
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Spawn tsx process to run the server
const serverProcess = spawn('npx', ['tsx', 'server.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env }
});

// Handle process termination
process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

// Forward exit code
serverProcess.on('exit', (code) => {
  process.exit(code);
});
