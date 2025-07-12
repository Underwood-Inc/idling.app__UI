#!/usr/bin/env node

/**
 * Generate OpenAPI Specification for Docusaurus Documentation
 * 
 * This script generates the OpenAPI spec from the swagger configuration
 * and places it in the appropriate directories for serving.
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
  
  // Also copy to static directory for GitHub Pages deployment
  const staticApiDir = path.join(__dirname, '..', 'static', 'api');
  if (!fs.existsSync(staticApiDir)) {
    fs.mkdirSync(staticApiDir, { recursive: true });
    // eslint-disable-next-line no-console
    console.log('📁 Created static/api directory');
  }
  
  const staticOutputPath = path.join(staticApiDir, 'openapi.json');
  fs.writeFileSync(staticOutputPath, JSON.stringify(swaggerSpec, null, 2));
  
  // eslint-disable-next-line no-console
  console.log('✅ OpenAPI specification generated successfully!');
  // eslint-disable-next-line no-console
  console.log(`📄 Source file: ${outputPath}`);
  // eslint-disable-next-line no-console
  console.log(`📄 Static file: ${staticOutputPath}`);
  // eslint-disable-next-line no-console
  console.log('🎯 The spec is now available in both locations');
  
} catch (error) {
  console.error('❌ Error generating OpenAPI specification:', error);
  process.exit(1);
} 