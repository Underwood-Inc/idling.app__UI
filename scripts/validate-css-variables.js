#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Custom CSS Variable Validation Script
 * Enforces usage of design system variables from variables.css
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Load CSS variables from variables.css
const variablesPath = path.join(__dirname, '../src/css/variables.css');
const variablesContent = fs.readFileSync(variablesPath, 'utf8');

// Extract available CSS variables
const availableVariables = [];
const variableMatches = variablesContent.match(/--[\w-]+:/g);
if (variableMatches) {
  availableVariables.push(...variableMatches.map(match => match.replace(':', '')));
}

console.log(`🧙‍♂️ Found ${availableVariables.length} CSS variables in design system`);

// Patterns to check for hardcoded values
const patterns = [
  {
    name: 'Hardcoded Colors',
    regex: /(color|background|border-color|fill|stroke):\s*#[0-9a-fA-F]{3,8}/g,
    suggestion: 'Use CSS variables like var(--text-primary), var(--brand-primary), etc.'
  },
  {
    name: 'Hardcoded Spacing',
    regex: /(margin|padding):\s*\d+px/g,
    suggestion: 'Use spacing variables like var(--spacing-sm), var(--spacing-md), etc.'
  },
  {
    name: 'Hardcoded Border Radius',
    regex: /border-radius:\s*\d+px/g,
    suggestion: 'Use border-radius variables like var(--border-radius-sm), var(--border-radius-md), etc.'
  },
  {
    name: 'Hardcoded Transitions',
    regex: /transition:\s*[\d.]+s/g,
    suggestion: 'Use transition variables like var(--transition-fast), var(--transition-base), etc.'
  }
];

// Find all CSS files
const cssFiles = glob.sync('src/**/*.{css,scss,module.css}', {
  ignore: ['node_modules/**', 'dist/**', '.next/**']
});

let totalErrors = 0;
let hasErrors = false;

cssFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  let fileErrors = [];

  patterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern.regex)];
    if (matches.length > 0) {
      matches.forEach(match => {
        const lines = content.substring(0, match.index).split('\n');
        const lineNumber = lines.length;
        const columnNumber = lines[lines.length - 1].length + 1;
        
        fileErrors.push({
          line: lineNumber,
          column: columnNumber,
          rule: pattern.name,
          value: match[0],
          suggestion: pattern.suggestion
        });
      });
    }
  });

  if (fileErrors.length > 0) {
    hasErrors = true;
    console.log(`\n❌ ${filePath}:`);
    fileErrors.forEach(error => {
      console.log(`  ${error.line}:${error.column} - ${error.rule}`);
      console.log(`    Found: ${error.value}`);
      console.log(`    💡 ${error.suggestion}`);
      totalErrors++;
    });
  }
});

if (hasErrors) {
  console.log(`\n🚨 Found ${totalErrors} CSS variable violations!`);
  console.log(`\n📚 Available CSS variables:`);
  console.log(availableVariables.slice(0, 10).map(v => `  ${v}`).join('\n'));
  if (availableVariables.length > 10) {
    console.log(`  ... and ${availableVariables.length - 10} more in ${variablesPath}`);
  }
  console.log(`\n🛠️  Run 'pnpm lint:css:fix' to auto-fix some issues`);
  process.exit(1);
} else {
  console.log(`\n✅ All CSS files follow design system variable conventions!`);
} 