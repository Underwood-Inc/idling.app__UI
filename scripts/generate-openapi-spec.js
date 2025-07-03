#!/usr/bin/env node

/**
 * Generate OpenAPI Specification for Jekyll Documentation
 * 
 * This script generates the OpenAPI spec from the swagger configuration
 * and places it in the Jekyll docs directory for static serving.
 */

const fs = require('fs');
const path = require('path');

try {
  console.log('🔧 Generating OpenAPI specification...');
  
  // Import the swagger configuration
  const swaggerSpec = require('../swagger.config.js');
  
  // Ensure the DOCS/api directory exists
  const apiDocsDir = path.join(__dirname, '..', 'DOCS', 'api');
  if (!fs.existsSync(apiDocsDir)) {
    fs.mkdirSync(apiDocsDir, { recursive: true });
    console.log('📁 Created DOCS/api directory');
  }
  
  // Write the OpenAPI spec to the Jekyll docs
  const outputPath = path.join(apiDocsDir, 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  
  console.log('✅ OpenAPI specification generated successfully!');
  console.log(`📄 File: ${outputPath}`);
  console.log('🎯 The spec is now available for Jekyll to serve statically');
  
} catch (error) {
  console.error('❌ Error generating OpenAPI specification:', error);
  process.exit(1);
} 