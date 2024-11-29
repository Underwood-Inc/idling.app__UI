module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  env: {
    node: true,
    jest: true
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off'
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', '!.eslintrc.js']
};
