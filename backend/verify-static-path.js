#!/usr/bin/env node

/**
 * Static File Path Verification Script
 *
 * This script verifies the static file serving path is correct
 * Run: node verify-static-path.js
 */

const path = require('path');
const fs = require('fs');

console.log('\n=== Static File Path Verification ===\n');

// Simulate the runtime environment
const productionDirname = path.join(__dirname, 'dist', 'src');
console.log('1. Runtime __dirname simulation:');
console.log('   When running from dist/src/main.js');
console.log('   __dirname =', productionDirname);
console.log('');

// OLD (BROKEN) path
const oldPath = path.join(productionDirname, '..', 'uploads');
console.log('2. OLD PATH (BROKEN):');
console.log('   join(__dirname, "..", "uploads")');
console.log('   =', oldPath);
console.log('   Relative:', path.relative(__dirname, oldPath));

const oldPathExists = fs.existsSync(oldPath);
console.log('   EXISTS:', oldPathExists ? '✅ YES' : '❌ NO');
console.log('');

// NEW (FIXED) path
const newPath = path.join(productionDirname, '..', '..', 'uploads');
console.log('3. NEW PATH (FIXED):');
console.log('   join(__dirname, "..", "..", "uploads")');
console.log('   =', newPath);
console.log('   Relative:', path.relative(__dirname, newPath));

const newPathExists = fs.existsSync(newPath);
console.log('   EXISTS:', newPathExists ? '✅ YES' : '❌ NO');

if (newPathExists) {
  const files = fs.readdirSync(newPath);
  console.log('   FILES:', files.length, 'file(s)');
  if (files.length > 0 && files.length <= 5) {
    files.forEach(f => console.log('     -', f));
  } else if (files.length > 5) {
    files.slice(0, 3).forEach(f => console.log('     -', f));
    console.log('     ... and', files.length - 3, 'more');
  }
}
console.log('');

// Alternative approach
const cwdPath = path.join(process.cwd(), 'uploads');
console.log('4. ALTERNATIVE (also correct):');
console.log('   join(process.cwd(), "uploads")');
console.log('   =', cwdPath);
console.log('   Relative:', path.relative(__dirname, cwdPath));

const cwdPathExists = fs.existsSync(cwdPath);
console.log('   EXISTS:', cwdPathExists ? '✅ YES' : '❌ NO');
console.log('');

// Summary
console.log('=== SUMMARY ===\n');

if (newPathExists) {
  console.log('✅ CORRECT PATH FOUND');
  console.log('   Static files will be served from:', path.relative(__dirname, newPath));
  console.log('   URL: http://localhost:3000/uploads/[filename]');
  console.log('');
  console.log('✅ FIX IS WORKING');
} else {
  console.log('❌ ERROR: Upload directory not found');
  console.log('   Expected:', newPath);
  console.log('   Please ensure uploads directory exists');
}

console.log('');
