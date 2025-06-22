module.exports = {
  extends: ['next', 'next/core-web-vitals', 'prettier', 'eslint:recommended'],
  plugins: ['prettier', 'jest', 'custom-rules', '@typescript-eslint'],
  globals: {
    React: 'readonly'
  },
  env: {
    'jest/globals': true
  },
  overrides: [
    {
      files: ['*.stories.@(ts|tsx|js|jsx|mjs|cjs)']
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            varsIgnorePattern: '^[A-Z][A-Za-z]*$|^_',
            argsIgnorePattern: '^_',
            ignoreRestSiblings: true
          }
        ]
      }
    }
  ],
  rules: {
    'no-unused-vars': [
      'warn',
      {
        varsIgnorePattern: '^[A-Z][A-Za-z]*$|^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true
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
