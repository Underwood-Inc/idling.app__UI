module.exports = {
  extends: ['next', 'next/core-web-vitals', 'prettier', 'eslint:recommended'],
  plugins: ['prettier', 'jest', 'custom-rules'],
  globals: {
    React: 'readonly'
  },
  env: {
    'jest/globals': true
  },
  overrides: [
    {
      files: ['*.stories.@(ts|tsx|js|jsx|mjs|cjs)']
    }
  ],
  rules: {
    'no-unused-vars': [
      'warn',
      {
        varsIgnorePattern: '^[A-Z][A-Za-z]*$'
      }
    ],
    'custom-rules/enforce-link-target-blank': 'warn',
    'max-len': ['error', { code: 180 }],
    'no-console': [
      'error',
      {
        allow: ['info', 'warn', 'error', 'table']
      }
    ]
  }
};
