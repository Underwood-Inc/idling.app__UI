#!/usr/bin/env node

/**
 * Generate OpenAPI Specification for Docusaurus Documentation
 * 
 * This script generates the OpenAPI spec from multiple sources:
 * 1. JSDoc comments in route files (backward compatibility)
 * 2. Separate openapi.yaml/openapi.json files co-located with routes
 * 3. Base configuration from swagger.config.js
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const glob = require('glob');

function findCoLocatedOpenAPIFiles() {
  // Find all openapi.yaml and openapi.json files in api routes
  const yamlFiles = glob.sync('src/app/api/**/openapi.yaml');
  const jsonFiles = glob.sync('src/app/api/**/openapi.json');
  
  return [...yamlFiles, ...jsonFiles];
}

function loadOpenAPIFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      return yaml.load(content);
    } else if (filePath.endsWith('.json')) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not parse ${filePath}:`, error.message);
    return null;
  }
}

function mergeOpenAPISpecs(baseSpec, coLocatedSpecs) {
  const merged = { ...baseSpec };
  
  // Ensure paths object exists
  if (!merged.paths) {
    merged.paths = {};
  }
  
  // Merge paths from co-located files
  coLocatedSpecs.forEach(spec => {
    if (spec && spec.paths) {
      Object.assign(merged.paths, spec.paths);
    }
    
    // Merge components if they exist
    if (spec && spec.components) {
      if (!merged.components) {
        merged.components = {};
      }
      
      // Merge schemas
      if (spec.components.schemas) {
        if (!merged.components.schemas) {
          merged.components.schemas = {};
        }
        Object.assign(merged.components.schemas, spec.components.schemas);
      }
      
      // Merge other component types as needed
      ['responses', 'parameters', 'examples', 'requestBodies', 'headers', 'securitySchemes', 'links', 'callbacks'].forEach(componentType => {
        if (spec.components[componentType]) {
          if (!merged.components[componentType]) {
            merged.components[componentType] = {};
          }
          Object.assign(merged.components[componentType], spec.components[componentType]);
        }
      });
    }
  });
  
  return merged;
}

// Auto-generate operationIds for all endpoints
function generateOperationId(method, path) {
  const cleanPath = path
    .replace(/^\/api\//, '') // Remove /api/ prefix
    .replace(/\{([^}]+)\}/g, 'By$1') // Convert {id} to ById
    .replace(/[/-]/g, '') // Remove slashes and hyphens
    .replace(/([a-z])([A-Z])/g, '$1$2') // Keep camelCase
    .replace(/^(.)/, (match) => match.toLowerCase()); // Lowercase first letter
  
  const methodPrefix = method.toLowerCase();
  return methodPrefix + cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1);
}

try {
  console.log('🔧 Generating OpenAPI specification...');
  
  // Import the base swagger configuration (JSDoc + base config)
  const baseSpec = require('../swagger.config.js');
  
  // Find and load co-located OpenAPI files
  console.log('📁 Scanning for co-located OpenAPI files...');
  const coLocatedFiles = findCoLocatedOpenAPIFiles();
  
  console.log(`📄 Found ${coLocatedFiles.length} co-located OpenAPI files:`);
  coLocatedFiles.forEach(file => console.log(`   - ${file}`));
  
  // Load all co-located specs
  const coLocatedSpecs = coLocatedFiles.map(loadOpenAPIFile).filter(Boolean);
  
  // Merge base spec with co-located specs
  const mergedSpec = mergeOpenAPISpecs(baseSpec, coLocatedSpecs);
  
  // Add operationIds to all operations
  if (mergedSpec.paths) {
    Object.entries(mergedSpec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (operation && typeof operation === 'object' && !operation.operationId) {
          operation.operationId = generateOperationId(method, path);
        }
      });
    });
  }
  
  // Ensure the src/app/api directory exists (co-located with source)
  const apiSourceDir = path.join(__dirname, '..', 'src', 'app', 'api');
  if (!fs.existsSync(apiSourceDir)) {
    fs.mkdirSync(apiSourceDir, { recursive: true });
    console.log('📁 Created src/app/api directory');
  }
  
  // Write the merged OpenAPI spec to the co-located directory
  const outputPath = path.join(apiSourceDir, 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(mergedSpec, null, 2));
  
  // Also copy to static directory for GitHub Pages deployment
  const staticApiDir = path.join(__dirname, '..', 'static', 'api');
  if (!fs.existsSync(staticApiDir)) {
    fs.mkdirSync(staticApiDir, { recursive: true });
    console.log('📁 Created static/api directory');
  }
  
  const staticOutputPath = path.join(staticApiDir, 'openapi.json');
  fs.writeFileSync(staticOutputPath, JSON.stringify(mergedSpec, null, 2));
  
  console.log('✅ OpenAPI specification generated successfully!');
  console.log(`📄 Source file: ${outputPath}`);
  console.log(`📄 Static file: ${staticOutputPath}`);
  console.log(`🎯 Merged ${coLocatedSpecs.length} co-located specs with base configuration`);
  
} catch (error) {
  console.error('❌ Error generating OpenAPI specification:', error);
  process.exit(1);
} 