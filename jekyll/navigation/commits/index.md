---
layout: default
title: 'Commit Guidelines'
description: 'Conventional commit message format and development standards'
permalink: /project/commits/
---

# 📝 Commit Guidelines

Standardized commit message format following Conventional Commits specification for consistent project history and automated tooling.

## 🎯 Conventional Commits Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Basic Examples

```bash
feat: add user authentication system
fix: resolve memory leak in image processing
docs: update API documentation for user endpoints
style: format code according to prettier rules
refactor: extract utility functions to separate module
test: add unit tests for user service
chore: update dependencies to latest versions
```

## 📋 Commit Types

| Type       | Description                                         | Example                                    |
| ---------- | --------------------------------------------------- | ------------------------------------------ |
| `feat`     | New feature or functionality                        | `feat: add dark mode toggle`               |
| `fix`      | Bug fix                                             | `fix: resolve login redirect issue`        |
| `docs`     | Documentation changes                               | `docs: update installation guide`          |
| `style`    | Code formatting, missing semicolons, etc.           | `style: format components with prettier`   |
| `refactor` | Code changes that neither fix bugs nor add features | `refactor: simplify user validation logic` |
| `test`     | Adding or modifying tests                           | `test: add integration tests for API`      |
| `chore`    | Maintenance tasks, dependency updates               | `chore: update React to v18`               |
| `perf`     | Performance improvements                            | `perf: optimize image loading`             |
| `ci`       | CI/CD pipeline changes                              | `ci: add automated testing workflow`       |
| `build`    | Build system or external dependency changes         | `build: configure webpack for production`  |
| `revert`   | Revert a previous commit                            | `revert: "feat: add user preferences"`     |

## 🔧 Scopes

Scopes provide additional context about the area of change:

### Frontend Scopes

- `ui` - User interface components
- `auth` - Authentication and authorization
- `api` - API integration and services
- `routing` - Navigation and routing
- `state` - State management
- `hooks` - Custom React hooks
- `utils` - Utility functions

### Backend Scopes

- `database` - Database schema and migrations
- `models` - Data models and entities
- `controllers` - API controllers
- `middleware` - Express middleware
- `services` - Business logic services
- `validation` - Input validation
- `security` - Security implementations

### Infrastructure Scopes

- `docker` - Docker configuration
- `deployment` - Deployment scripts and configs
- `monitoring` - Logging and monitoring
- `testing` - Test configuration and setup
- `docs` - Documentation

### Examples with Scopes

```bash
feat(auth): implement JWT token refresh mechanism
fix(ui): resolve mobile responsive layout issues
docs(api): add OpenAPI specification for user endpoints
refactor(database): optimize user query performance
test(auth): add unit tests for login flow
chore(deps): update all development dependencies
```

## 🚨 Breaking Changes

For breaking changes, add `!` after the type/scope and include details in the footer:

```bash
feat(api)!: change user endpoint response format

BREAKING CHANGE: User API now returns `userId` instead of `id` field.
Migration guide available in docs/migrations/user-api-v2.md
```

## 📝 Detailed Commit Messages

### Body Guidelines

- Use the imperative mood: "add feature" not "added feature"
- Explain what and why, not how
- Wrap lines at 72 characters
- Reference issues and pull requests when relevant

### Footer Guidelines

- Reference GitHub issues: `Closes #123`, `Fixes #456`
- Include breaking change notices
- Add co-author information when applicable

### Complete Example

```bash
feat(auth): implement OAuth2 integration with Google

Add Google OAuth2 authentication to provide users with
a seamless login experience. This reduces friction for
new user registration and improves security by leveraging
Google's authentication infrastructure.

- Add Google OAuth2 strategy configuration
- Implement callback handling and user creation
- Add environment variables for client credentials
- Update login UI with Google sign-in button

Closes #234
Refs #189
```

## 🔧 Git Hooks and Automation

### Pre-commit Hook

We use `commitlint` to enforce conventional commit format:

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
        'revert'
      ]
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 72]
  }
};
```

### Automated Changelog

Conventional commits enable automatic changelog generation:

- `feat` commits appear in "Features" section
- `fix` commits appear in "Bug Fixes" section
- Breaking changes get special highlighting
- Scopes group related changes together

## 📊 Examples by Category

### Feature Development

```bash
feat(ui): add user profile editing interface
feat(api): implement real-time notifications
feat(auth): add two-factor authentication support
feat(database): add user preferences table
```

### Bug Fixes

```bash
fix(ui): resolve button alignment on mobile devices
fix(api): handle edge case in user validation
fix(auth): prevent duplicate session creation
fix(database): resolve connection pool exhaustion
```

### Documentation

```bash
docs(readme): update installation instructions
docs(api): add examples for authentication endpoints
docs(contributing): clarify pull request process
docs(deployment): document production setup steps
```

### Maintenance

```bash
chore(deps): update Next.js to version 14
chore(config): update ESLint rules for TypeScript
chore(ci): optimize GitHub Actions workflow
chore(cleanup): remove deprecated utility functions
```

## ✅ Best Practices

### Do's ✅

- Use imperative mood in commit messages
- Keep the first line under 72 characters
- Reference issues and pull requests
- Group related changes in single commits
- Write descriptive commit messages
- Use conventional commit format consistently

### Don'ts ❌

- Don't use past tense ("added" → "add")
- Don't commit unrelated changes together
- Don't use vague messages like "fix stuff"
- Don't forget to include breaking change notices
- Don't exceed line length limits
- Don't commit without testing changes

## 🔗 Related Tools

- **[Commitlint](https://commitlint.js.org/)** - Lint commit messages
- **[Conventional Changelog](https://github.com/conventional-changelog/conventional-changelog)** - Generate changelogs
- **[Semantic Release](https://semantic-release.gitbook.io/)** - Automated versioning
- **[Husky](https://typicode.github.io/husky/)** - Git hooks management

## 🚀 Getting Started

1. **Install commitlint**: `npm install -g @commitlint/cli @commitlint/config-conventional`
2. **Set up git hooks**: `npm install husky --save-dev`
3. **Configure commitlint**: Create `commitlint.config.js`
4. **Start using conventional commits**: Follow the format above
5. **Review commit history**: Use `git log --oneline` to see your commits

---

_Commit guidelines are enforced automatically via git hooks. Last updated: {{ site.time | date: "%B %d, %Y" }}_
