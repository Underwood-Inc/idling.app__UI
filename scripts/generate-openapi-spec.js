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
  // eslint-disable-next-line no-console
  console.log('🔧 Generating OpenAPI specification...');
  
  // Import the swagger configuration
  const swaggerSpec = require('../swagger.config.js');
  
  // Ensure the src/app/api directory exists (co-located with source)
  const apiSourceDir = path.join(__dirname, '..', 'src', 'app', 'api');
  if (!fs.existsSync(apiSourceDir)) {
    fs.mkdirSync(apiSourceDir, { recursive: true });
    // eslint-disable-next-line no-console
    console.log('📁 Created src/app/api directory');
  }
  
  // Write the OpenAPI spec to the co-located directory
  const outputPath = path.join(apiSourceDir, 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  
  // eslint-disable-next-line no-console
  console.log('✅ OpenAPI specification generated successfully!');
  // eslint-disable-next-line no-console
  console.log(`📄 File: ${outputPath}`);
  // eslint-disable-next-line no-console
  console.log('🎯 The spec is now co-located with API source code');
  
} catch (error) {
  console.error('❌ Error generating OpenAPI specification:', error);
  process.exit(1);
} 