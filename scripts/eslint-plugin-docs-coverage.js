/**
 * ESLint Plugin: Documentation Coverage Enforcer
 * Provides linter-style errors for missing documentation in TypeScript/JavaScript files
 */

/* eslint-env node */
/* global Set */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Configuration for documentation coverage
 */
const DEFAULT_CONFIG = {
  documentationPaths: [
    'DOCS/_docs/**/*.md',
    'DOCS/_services/**/*.md',
    'DOCS/_components/**/*.md',
    'DOCS/_api/**/*.md'
  ],
  requireDocumentation: {
    services: true,
    components: true,
    hooks: true,
    utils: true,
    apiRoutes: true
  },
  minimumJSDocCoverage: 80,
  exemptPatterns: [
    '**/*.test.*',
    '**/*.spec.*',
    '**/test/**',
    '**/__tests__/**'
  ]
};

/**
 * Find all existing documentation files
 */
function findExistingDocs(config) {
  const docFiles = new Set();
  
  config.documentationPaths.forEach(pattern => {
    try {
      const files = glob.sync(pattern);
      files.forEach(file => {
        const docName = path.basename(file, '.md').toLowerCase();
        docFiles.add(docName);
      });
    } catch (error) {
      // Ignore glob errors
    }
  });
  
  return docFiles;
}

/**
 * Determine file type based on path
 */
function getFileType(filePath) {
  if (filePath.includes('/services/')) return 'service';
  if (filePath.includes('/components/')) return 'component';
  if (filePath.includes('/hooks/')) return 'hook';
  if (filePath.includes('/utils/')) return 'utility';
  if (filePath.includes('/api/') && filePath.endsWith('route.ts')) return 'apiRoute';
  return 'unknown';
}

/**
 * Check if file should be exempt from documentation requirements
 */
function isExempt(filePath, config) {
  return config.exemptPatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  });
}

/**
 * Check if a function/class has JSDoc
 */
function hasJSDoc(node) {
  return node.leadingComments && 
         node.leadingComments.some(comment => 
           comment.type === 'Block' && comment.value.startsWith('*')
         );
}

/**
 * Get exported identifiers from a file
 */
function getExportedIdentifiers(context) {
  const exports = [];
  const sourceCode = context.getSourceCode();
  
  // This is a simplified approach - in a real implementation,
  // you'd want to traverse the AST more thoroughly
  const ast = sourceCode.ast;
  
  function traverse(node) {
    if (!node) return;
    
    if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
      if (node.declaration) {
        if (node.declaration.id) {
          exports.push(node.declaration.id.name);
        } else if (node.declaration.declarations) {
          node.declaration.declarations.forEach(decl => {
            if (decl.id && decl.id.name) {
              exports.push(decl.id.name);
            }
          });
        }
      }
    }
    
    // Traverse child nodes
    for (const key in node) {
      if (key !== 'parent' && node[key]) {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse);
        } else if (typeof node[key] === 'object') {
          traverse(node[key]);
        }
      }
    }
  }
  
  traverse(ast);
  return exports;
}

/**
 * Main ESLint rule for documentation coverage
 */
const requireDocumentationRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce documentation coverage for code files',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          documentationPaths: {
            type: 'array',
            items: { type: 'string' }
          },
          requireDocumentation: {
            type: 'object',
            properties: {
              services: { type: 'boolean' },
              components: { type: 'boolean' },
              hooks: { type: 'boolean' },
              utils: { type: 'boolean' },
              apiRoutes: { type: 'boolean' }
            }
          },
          minimumJSDocCoverage: { type: 'number' },
          exemptPatterns: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    // Merge user config with defaults
    const config = { ...DEFAULT_CONFIG, ...(context.options[0] || {}) };
    const filename = context.getFilename();
    
    // Skip if file is exempt
    if (isExempt(filename, config)) {
      return {};
    }
    
    const fileType = getFileType(filename);
    const baseName = path.basename(filename, path.extname(filename)).toLowerCase();
    
    // Check if this file type requires documentation
    const requiresDoc = config.requireDocumentation[fileType + 's'] || config.requireDocumentation[fileType];
    
    if (!requiresDoc) {
      return {};
    }
    
    // Find existing documentation files (cached)
    if (!context._docFiles) {
      context._docFiles = findExistingDocs(config);
    }
    
    const hasDocFile = context._docFiles.has(baseName);
    
    return {
      Program(node) {
        // Check for missing documentation file
        if (!hasDocFile) {
          const suggestedPath = `DOCS/_docs/${fileType}s/${baseName}.md`;
          
          context.report({
            node,
            message: `Missing documentation file for ${fileType} '${baseName}'. Create: ${suggestedPath}`,
            data: {
              fileType,
              baseName,
              suggestedPath
            }
          });
        }
      },
      
      // Check JSDoc coverage for exported functions
      'ExportNamedDeclaration > FunctionDeclaration'(node) {
        if (!hasJSDoc(node)) {
          context.report({
            node,
            message: `Exported function '${node.id.name}' is missing JSDoc documentation`,
            data: {
              functionName: node.id.name
            }
          });
        }
      },
      
      // Check JSDoc coverage for exported classes
      'ExportNamedDeclaration > ClassDeclaration'(node) {
        if (!hasJSDoc(node)) {
          context.report({
            node,
            message: `Exported class '${node.id.name}' is missing JSDoc documentation`,
            data: {
              className: node.id.name
            }
          });
        }
      },
      
      // Check JSDoc coverage for exported arrow functions
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type="ArrowFunctionExpression"]'(node) {
        if (!hasJSDoc(node.parent.parent)) {
          context.report({
            node,
            message: `Exported function '${node.id.name}' is missing JSDoc documentation`,
            data: {
              functionName: node.id.name
            }
          });
        }
      },
      
      // Check default exports
      'ExportDefaultDeclaration > FunctionDeclaration'(node) {
        if (!hasJSDoc(node)) {
          const name = node.id ? node.id.name : 'default export';
          context.report({
            node,
            message: `Default exported function '${name}' is missing JSDoc documentation`,
            data: {
              functionName: name
            }
          });
        }
      },
      
      'ExportDefaultDeclaration > ClassDeclaration'(node) {
        if (!hasJSDoc(node)) {
          const name = node.id ? node.id.name : 'default export';
          context.report({
            node,
            message: `Default exported class '${name}' is missing JSDoc documentation`,
            data: {
              className: name
            }
          });
        }
      }
    };
  }
};

/**
 * Rule for checking JSDoc quality
 */
const requireQualityJSDocRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce quality JSDoc comments',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: []
  },

  create(context) {
    function checkJSDocQuality(node) {
      const jsdoc = node.leadingComments?.find(comment => 
        comment.type === 'Block' && comment.value.startsWith('*')
      );
      
      if (!jsdoc) return;
      
      const jsdocContent = jsdoc.value;
      
      // Check for minimum content requirements
      if (jsdocContent.trim().length < 10) {
        context.report({
          node,
          message: 'JSDoc comment is too brief. Please provide a meaningful description.'
        });
      }
      
      // Check for parameter documentation if function has parameters
      if (node.type === 'FunctionDeclaration' && node.params.length > 0) {
        const hasParamDocs = /@param/.test(jsdocContent);
        if (!hasParamDocs) {
          context.report({
            node,
            message: 'Function with parameters is missing @param documentation in JSDoc.'
          });
        }
      }
      
      // Check for return documentation if function returns something
      if (node.type === 'FunctionDeclaration' && !/@returns?/.test(jsdocContent)) {
        // Simple heuristic: if function has return statements, it should have @returns
        const sourceCode = context.getSourceCode();
        const functionText = sourceCode.getText(node);
        if (/return\s+(?!;)/.test(functionText)) {
          context.report({
            node,
            message: 'Function with return value is missing @returns documentation in JSDoc.'
          });
        }
      }
    }
    
    return {
      'FunctionDeclaration': checkJSDocQuality,
      'ClassDeclaration': checkJSDocQuality,
      'MethodDefinition': checkJSDocQuality
    };
  }
};

module.exports = {
  rules: {
    'require-documentation': requireDocumentationRule,
    'require-quality-jsdoc': requireQualityJSDocRule
  },
  configs: {
    recommended: {
      plugins: ['docs-coverage'],
      rules: {
        'docs-coverage/require-documentation': ['error', {
          requireDocumentation: {
            services: true,
            components: true,
            hooks: true,
            utils: true,
            apiRoutes: true
          },
          minimumJSDocCoverage: 80
        }],
        'docs-coverage/require-quality-jsdoc': 'warn'
      }
    },
    strict: {
      plugins: ['docs-coverage'],
      rules: {
        'docs-coverage/require-documentation': ['error', {
          requireDocumentation: {
            services: true,
            components: true,
            hooks: true,
            utils: true,
            apiRoutes: true
          },
          minimumJSDocCoverage: 95
        }],
        'docs-coverage/require-quality-jsdoc': 'error'
      }
    }
  }
}; 