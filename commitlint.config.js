module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 500],
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New features
        'fix',      // Bug fixes
        'perf',     // Performance improvements
        'revert',   // Reverts a previous commit
        'docs',     // Documentation updates
        'style',    // Code style changes (formatting, missing semicolons, etc)
        'refactor', // Code refactoring
        'test',     // Adding missing tests or correcting existing tests
        'build',    // Changes that affect the build system
        'ci',       // Changes to CI configuration files and scripts
        'chore',    // Other changes that don't modify src or test files
        'deps'      // Dependencies updates
      ]
    ],
    'type-case': [2, 'always', 'lower'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower'],
    'subject-case': [2, 'always', 'lower'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always']
  }
};
