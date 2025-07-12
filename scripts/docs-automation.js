#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Documentation Automation Tools
 * 
 * Comprehensive automation for documentation maintenance, quality assurance,
 * and consistency across the co-located documentation system.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  srcDir: 'src',
  excludePaths: ['node_modules', '.git', '.next', 'dist', 'build'],
  requiredFrontmatter: ['title', 'description'],
  maxDescriptionLength: 140,
  stubFileThreshold: 50, // Lines below this count as stub files
  outdatedThreshold: 30 // Days since last update
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Utility functions
function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Core functions
function findMarkdownFiles(directory = '.') {
  const files = [];
  
  function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !CONFIG.excludePaths.includes(entry.name)) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(directory);
  return files;
}

function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;
  
  const frontmatter = {};
  const lines = frontmatterMatch[1].split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      let value = match[2].trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      frontmatter[match[1]] = value;
    }
  }
  
  return frontmatter;
}

function getFileStats(filePath) {
  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  const frontmatter = parseFrontmatter(content);
  
  return {
    path: filePath,
    size: stats.size,
    lines,
    lastModified: stats.mtime,
    frontmatter,
    content
  };
}

function isStubFile(fileStats) {
  return fileStats.lines < CONFIG.stubFileThreshold ||
         fileStats.content.includes('This is a stub file') ||
         fileStats.content.includes('_This is a stub file_');
}

function isOutdated(fileStats) {
  const daysSinceUpdate = (Date.now() - fileStats.lastModified.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate > CONFIG.outdatedThreshold;
}

// Main automation functions
function auditDocumentation() {
  info('🔍 Starting documentation audit...');
  
  const files = findMarkdownFiles();
  const issues = [];
  const stats = {
    total: files.length,
    withFrontmatter: 0,
    stubFiles: 0,
    outdated: 0,
    missingRequired: 0
  };
  
  for (const file of files) {
    const fileStats = getFileStats(file);
    
    // Check frontmatter
    if (fileStats.frontmatter) {
      stats.withFrontmatter++;
      
      // Check required fields
      const missingFields = CONFIG.requiredFrontmatter.filter(
        field => !fileStats.frontmatter[field]
      );
      
      if (missingFields.length > 0) {
        stats.missingRequired++;
        issues.push({
          file,
          type: 'missing_frontmatter',
          details: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Check description length
      if (fileStats.frontmatter.description &&
          fileStats.frontmatter.description.length > CONFIG.maxDescriptionLength) {
        issues.push({
          file,
          type: 'description_too_long',
          details: `Description is ${fileStats.frontmatter.description.length} characters (max: ${CONFIG.maxDescriptionLength})`
        });
      }
    } else {
      issues.push({
        file,
        type: 'no_frontmatter',
        details: 'File has no frontmatter'
      });
    }
    
    // Check for stub files
    if (isStubFile(fileStats)) {
      stats.stubFiles++;
      issues.push({
        file,
        type: 'stub_file',
        details: 'File appears to be a stub (low content or contains stub markers)'
      });
    }
    
    // Check for outdated files
    if (isOutdated(fileStats)) {
      stats.outdated++;
      issues.push({
        file,
        type: 'outdated',
        details: `Last modified ${Math.round((Date.now() - fileStats.lastModified.getTime()) / (1000 * 60 * 60 * 24))} days ago`
      });
    }
  }
  
  // Report results
  info('📊 Audit Results:');
  console.log(`Total files: ${stats.total}`);
  console.log(`With frontmatter: ${stats.withFrontmatter}`);
  console.log(`Stub files: ${stats.stubFiles}`);
  console.log(`Outdated files: ${stats.outdated}`);
  console.log(`Missing required fields: ${stats.missingRequired}`);
  
  if (issues.length > 0) {
    warning(`\n⚠️  Found ${issues.length} issues:`);
    
    const groupedIssues = issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {});
    
    for (const [type, typeIssues] of Object.entries(groupedIssues)) {
      console.log(`\n${type.toUpperCase()}:`);
      for (const issue of typeIssues) {
        console.log(`  - ${issue.file}: ${issue.details}`);
      }
    }
  } else {
    success('✨ No issues found!');
  }
  
  return { stats, issues };
}

function fixCommonIssues() {
  info('🔧 Fixing common documentation issues...');
  
  const files = findMarkdownFiles();
  let fixedCount = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    let changed = false;
    
    // Fix missing frontmatter
    if (!content.startsWith('---')) {
      const filename = path.basename(file, '.md');
      const title = filename.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      newContent = `---
title: '${title}'
description: 'Documentation for ${title}'
---

${content}`;
      changed = true;
    }
    
    // Fix stub file markers
    if (content.includes('This is a stub file')) {
      newContent = newContent.replace(
        /This is a stub file\. \[Contribute to expand this documentation\]\(.*?\)\./g,
        '_This documentation is under development. [Contribute to expand this documentation](/community/contributing/)._'
      );
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(file, newContent);
      fixedCount++;
      success(`Fixed: ${file}`);
    }
  }
  
  info(`🎉 Fixed ${fixedCount} files`);
}

function standardizeFileNames() {
  info('📝 Standardizing file names...');
  
  const files = findMarkdownFiles();
  let renamedCount = 0;
  
  for (const file of files) {
    const dirname = path.dirname(file);
    const basename = path.basename(file);
    
    // Convert README.md to index.md
    if (basename === 'README.md') {
      const newPath = path.join(dirname, 'index.md');
      if (!fs.existsSync(newPath)) {
        fs.renameSync(file, newPath);
        renamedCount++;
        success(`Renamed: ${file} → ${newPath}`);
      } else {
        warning(`Skipped: ${file} (index.md already exists)`);
      }
    }
  }
  
  info(`🎉 Renamed ${renamedCount} files`);
}

function validateLinks() {
  info('🔗 Validating internal links...');
  
  const files = findMarkdownFiles();
  const brokenLinks = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const dirname = path.dirname(file);
    
    // Find markdown links
    const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
    
    for (const match of linkMatches) {
      const linkText = match[1];
      const linkUrl = match[2];
      
      // Skip external links
      if (linkUrl.startsWith('http')) continue;
      
      // Skip anchor links
      if (linkUrl.startsWith('#')) continue;
      
      // Check internal links
      let targetPath = linkUrl;
      if (targetPath.startsWith('./')) {
        targetPath = path.join(dirname, targetPath.slice(2));
      } else if (targetPath.startsWith('../')) {
        targetPath = path.resolve(dirname, targetPath);
      } else if (targetPath.startsWith('/')) {
        targetPath = path.join('.', targetPath);
      }
      
      if (!fs.existsSync(targetPath)) {
        brokenLinks.push({
          file,
          linkText,
          linkUrl,
          targetPath
        });
      }
    }
  }
  
  if (brokenLinks.length > 0) {
    warning(`\n⚠️  Found ${brokenLinks.length} broken internal links:`);
    for (const link of brokenLinks) {
      console.log(`  - ${link.file}: "${link.linkText}" → ${link.linkUrl} (${link.targetPath})`);
    }
  } else {
    success('✅ All internal links are valid!');
  }
  
  return brokenLinks;
}

function generateCoverageReport() {
  info('📊 Generating documentation coverage report...');
  
  const files = findMarkdownFiles();
  const coverage = {
    total: files.length,
    complete: 0,
    incomplete: 0,
    stub: 0,
    outdated: 0,
    byDirectory: {}
  };
  
  for (const file of files) {
    const fileStats = getFileStats(file);
    const dirname = path.dirname(file);
    
    if (!coverage.byDirectory[dirname]) {
      coverage.byDirectory[dirname] = {
        total: 0,
        complete: 0,
        incomplete: 0,
        stub: 0,
        outdated: 0
      };
    }
    
    coverage.byDirectory[dirname].total++;
    
    if (isStubFile(fileStats)) {
      coverage.stub++;
      coverage.byDirectory[dirname].stub++;
    } else if (isOutdated(fileStats)) {
      coverage.outdated++;
      coverage.byDirectory[dirname].outdated++;
    } else if (fileStats.frontmatter && 
               CONFIG.requiredFrontmatter.every(field => fileStats.frontmatter[field])) {
      coverage.complete++;
      coverage.byDirectory[dirname].complete++;
    } else {
      coverage.incomplete++;
      coverage.byDirectory[dirname].incomplete++;
    }
  }
  
  const coveragePercentage = Math.round((coverage.complete / coverage.total) * 100);
  
  info(`📈 Documentation Coverage: ${coveragePercentage}%`);
  console.log(`Complete: ${coverage.complete}/${coverage.total}`);
  console.log(`Incomplete: ${coverage.incomplete}`);
  console.log(`Stub files: ${coverage.stub}`);
  console.log(`Outdated: ${coverage.outdated}`);
  
  // Directory breakdown
  console.log('\n📁 By Directory:');
  for (const [dir, stats] of Object.entries(coverage.byDirectory)) {
    const dirCoverage = Math.round((stats.complete / stats.total) * 100);
    console.log(`  ${dir}: ${dirCoverage}% (${stats.complete}/${stats.total})`);
  }
  
  return coverage;
}

// CLI interface
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'audit':
      auditDocumentation();
      break;
    case 'fix':
      fixCommonIssues();
      break;
    case 'standardize':
      standardizeFileNames();
      break;
    case 'validate':
      validateLinks();
      break;
    case 'coverage':
      generateCoverageReport();
      break;
    case 'doctor':
      info('🏥 Running full documentation health check...');
      auditDocumentation();
      validateLinks();
      generateCoverageReport();
      break;
    default:
      log('📚 Documentation Automation Tools', 'cyan');
      console.log('\nUsage: node scripts/docs-automation.js <command>');
      console.log('\nCommands:');
      console.log('  audit      - Audit documentation for issues');
      console.log('  fix        - Fix common documentation issues');
      console.log('  standardize - Standardize file names (README.md → index.md)');
      console.log('  validate   - Validate internal links');
      console.log('  coverage   - Generate documentation coverage report');
      console.log('  doctor     - Run full health check');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findMarkdownFiles,
  parseFrontmatter,
  getFileStats,
  auditDocumentation,
  fixCommonIssues,
  standardizeFileNames,
  validateLinks,
  generateCoverageReport
}; 