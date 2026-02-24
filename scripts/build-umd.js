/**
 * Build script to create UMD bundle from CommonJS output
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const cjsDir = path.join(distDir, 'cjs');
const umdFile = path.join(distDir, 'index.umd.js');

// Read all CJS files and bundle them
const indexPath = path.join(cjsDir, 'index.js');

if (!fs.existsSync(indexPath)) {
  console.error('CJS build not found. Run build:esm first.');
  process.exit(1);
}

// Simple UMD wrapper
const umdWrapper = `(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SoftPaperUI = {}));
})(this, (function (exports) {
  'use strict';

  ${fs.readFileSync(indexPath, 'utf8').replace(/^"use strict";\s*/, '')}

}));
`;

// Write UMD bundle
fs.writeFileSync(umdFile, umdWrapper);
console.log('UMD bundle created:', umdFile);
