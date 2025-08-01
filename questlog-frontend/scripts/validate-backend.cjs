#!/usr/bin/env node

/**
 * Pre-build validation script
 * Ensures backend is properly set up before building frontend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_PATH = path.resolve(__dirname, '../../questlog-backend');

console.log('🔍 Validating backend setup...');

// Check if backend directory exists
if (!fs.existsSync(BACKEND_PATH)) {
  console.error('❌ Backend directory not found at:', BACKEND_PATH);
  console.error('Please ensure questlog-backend is in the correct location');
  process.exit(1);
}

// Check if backend package.json exists
const backendPackageJson = path.join(BACKEND_PATH, 'package.json');
if (!fs.existsSync(backendPackageJson)) {
  console.error('❌ Backend package.json not found');
  process.exit(1);
}

// Check if backend node_modules exists
const backendNodeModules = path.join(BACKEND_PATH, 'node_modules');
if (!fs.existsSync(backendNodeModules)) {
  console.log('📦 Installing backend dependencies...');
  try {
    execSync('npm install', { cwd: BACKEND_PATH, stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install backend dependencies');
    process.exit(1);
  }
}

// Validate critical files exist
const criticalFiles = [
  'services/supabase.ts',
  'types/quest.ts', 
  'types/badge.ts'
];

for (const file of criticalFiles) {
  const filePath = path.join(BACKEND_PATH, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Critical backend file missing: ${file}`);
    process.exit(1);
  }
}

console.log('✅ Backend validation passed');
console.log('🏗️ Proceeding with frontend build...');
