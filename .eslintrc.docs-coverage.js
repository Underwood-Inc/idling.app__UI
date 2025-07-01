/**
 * ESLint Configuration for Documentation Coverage
 * Extends the main ESLint config with documentation enforcement rules
 */

module.exports = {
  // Extend the main ESLint configuration
  extends: [
    './.eslintrc.js',  // Your existing ESLint config
  ],
  
  // Add the custom documentation coverage plugin
  plugins: [
    'docs-coverage'
  ],
  
  // Configure the documentation coverage rules
  rules: {
    // Enforce documentation files for services, components, etc.
    'docs-coverage/require-documentation': ['error', {
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
      exemptPatterns: [
        '**/*.test.*',
        '**/*.spec.*',
        '**/test/**',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/.next/**'
      ]
    }],
    
    // Enforce quality JSDoc comments
    'docs-coverage/require-quality-jsdoc': 'warn',
    
    // Standard JSDoc rules (if you have eslint-plugin-jsdoc installed)
    ...((() => {
      try {
        require('eslint-plugin-jsdoc');
        return {
          'jsdoc/require-description': 'warn',
          'jsdoc/require-param': 'warn',
          'jsdoc/require-param-description': 'warn',
          'jsdoc/require-returns': 'warn',
          'jsdoc/require-returns-description': 'warn',
          'jsdoc/check-param-names': 'error',
          'jsdoc/check-tag-names': 'error',
          'jsdoc/check-types': 'error',
          'jsdoc/valid-types': 'error'
        };
      } catch {
        return {};
      }
    })())
  },
  
  // Override rules for specific file patterns
  overrides: [
    {
      // Stricter rules for service files
      files: ['src/lib/services/**/*.ts'],
      rules: {
        'docs-coverage/require-documentation': ['error', {
          requireDocumentation: {
            services: true
          },
          minimumJSDocCoverage: 95
        }],
        'docs-coverage/require-quality-jsdoc': 'error'
      }
    },
    {
      // Stricter rules for component files
      files: ['src/components/**/*.tsx'],
      rules: {
        'docs-coverage/require-documentation': ['error', {
          requireDocumentation: {
            components: true
          },
          minimumJSDocCoverage: 90
        }]
      }
    },
    {
      // Stricter rules for API routes
      files: ['src/app/api/**/route.ts'],
      rules: {
        'docs-coverage/require-documentation': ['error', {
          requireDocumentation: {
            apiRoutes: true
          },
          minimumJSDocCoverage: 95
        }],
        'docs-coverage/require-quality-jsdoc': 'error'
      }
    },
    {
      // Relaxed rules for utility files
      files: ['src/lib/utils/**/*.ts'],
      rules: {
        'docs-coverage/require-documentation': ['warn', {
          requireDocumentation: {
            utils: true
          },
          minimumJSDocCoverage: 70
        }]
      }
    },
    {
      // Disable for test files
      files: [
        '**/*.test.*',
        '**/*.spec.*',
        '**/test/**',
        '**/__tests__/**'
      ],
      rules: {
        'docs-coverage/require-documentation': 'off',
        'docs-coverage/require-quality-jsdoc': 'off'
      }
    }
  ],
  
  // Settings for the documentation coverage plugin
  settings: {
    'docs-coverage': {
      // Base directory for documentation
      docsRoot: 'DOCS',
      
      // Jekyll configuration
      jekyllConfig: {
        collectionsDir: '_docs',
        categories: ['services', 'components', 'api', 'utils', 'hooks']
      },
      
      // Auto-generation settings
      autoGenerate: {
        enabled: true,
        stubTemplate: 'scripts/doc-stub-template.md'
      }
    }
  }
}; 