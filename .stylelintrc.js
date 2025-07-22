module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-css-modules'
  ],
  rules: {
    // Allow BEM naming convention for CSS classes
    'selector-class-pattern': [
      '^[a-z][a-z0-9-]*(__[a-z][a-z0-9-]*)?(--[a-z][a-z0-9-]*)?$',
      {
        message: 'Expected class selector to be BEM-style (block__element--modifier)'
      }
    ],

    // Allow traditional media query syntax (max-width, min-width)
    'media-feature-range-notation': null,


    
    // Enforce CSS variables for common properties that should use design tokens
    'declaration-property-value-disallowed-list': {
      '/^(margin|padding)/': ['/^\\d+px$/', '/^\\d+rem$/'],
      'font-size': ['/^\\d+px$/', '/^\\d+rem$/'],
      'border-radius': ['/^\\d+px$/'],
      'transition': ['/^\\d+\\.?\\d*s/'],
      'z-index': ['/^\\d+$/']
    },

    // Custom rules for our design system
    'custom-property-pattern': [
      '^(brand|text|glass|dark|spacing|border|transition|z-index)-.+',
      {
        message: 'CSS variable names should follow our design system pattern (brand-, text-, glass-, etc.)'
      }
    ],

    // Prevent hardcoded hex colors
    'color-hex-length': 'long',
    'color-no-hex': [
      true,
      {
        message: 'Use CSS variables instead of hex colors'
      }
    ],

    // Allow CSS variables and functions
    'function-disallowed-list': null,
    'value-keyword-case': ['lower', { 
      ignoreKeywords: ['currentColor'],
      ignoreFunctions: ['var']
    }],

    // Disable conflicting rules
    'declaration-empty-line-before': null,
    'no-descending-specificity': null
  },
  
  // Ignore certain files
  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.next/**',
    'coverage/**',
    '**/*.js',
    '**/*.ts',
    '**/*.tsx'
  ]
}; 