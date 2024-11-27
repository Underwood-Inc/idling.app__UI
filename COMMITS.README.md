# Commit Message Guidelines

This project uses commitlint to enforce consistent commit messages. This guide will help you understand how to write good commit messages.

## Basic Structure

A commit message should look like this:

```git
type(scope): subject

body

footer
```

## Quick Reference

- First line is limited to 100 characters
- Body lines are limited to 500 characters
- Leave a blank line between subject, body, and footer
- Don't end the subject line with a period
- Use lowercase for type, scope, and subject

## Types Explained

We use these types to categorize our changes:

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New features or significant changes | `feat: add user login system` |
| `fix` | Bug fixes | `fix: resolve infinite loading issue` |
| `perf` | Performance improvements | `perf: optimize image loading` |
| `docs` | Documentation changes | `docs: update API instructions` |
| `style` | Code style changes (formatting, etc.) | `style: fix indentation in App.tsx` |
| `refactor` | Code changes that neither fix bugs nor add features | `refactor: simplify auth logic` |
| `test` | Adding or modifying tests | `test: add unit tests for login` |
| `build` | Changes to build system or dependencies | `build: update webpack config` |
| `ci` | Changes to CI configuration | `ci: add GitHub Actions workflow` |
| `chore` | Regular maintenance tasks | `chore: clean up unused imports` |
| `deps` | Dependency updates | `deps: update React to v18.2` |
| `revert` | Reverting previous changes | `revert: remove broken feature` |

## Examples

### Simple Bug Fix

```git
  fix: correct button alignment on mobile view
```

### Feature with Description

```git
  feat(auth): implement Google OAuth login

  Added Google OAuth authentication with the following features:
  - Secure token handling
  - Automatic session refresh
  - Error boundary for failed auth attempts

  Breaking Change: Users will need to re-login after this update
```

### Multiple Related Changes

```git
  refactor(api): update user service architecture

  - Moved user logic to separate service
  - Implemented proper TypeScript interfaces
  - Added error handling middleware
  - Updated related unit tests
```

## Common Mistakes to Avoid

❌ **Don't Do This:**

```git
  updated stuff
  fixed bug
  WIP
```

✅ **Do This Instead:**

```git
  feat(dashboard): add user activity graph
  fix(auth): resolve token expiration bug
  chore(wip): implement initial user settings page
```

## Tips for Good Commits

1. **Be Specific**: Your commit message should clearly explain what changes were made
2. **Be Concise**: The subject line should be brief but descriptive
3. **Use Present Tense**: Write "add feature" not "added feature"
4. **Group Related Changes**: Keep related changes in a single commit
5. **Separate Unrelated Changes**: Make separate commits for unrelated changes

## Need Help?

If you're unsure about your commit message:
1. Run `git commit` without `-m` to open your editor
2. Take time to write a good message
3. Save and close the editor
4. Git and commitlint will validate your message

Remember: Good commit messages help your team understand your changes and make it easier to track down issues later! 

## Git History Management

### Why Clean History Matters

A clean, linear Git history is crucial for:
- Understanding how code evolved over time
- Debugging issues by tracking changes
- Making code reviews more efficient
- Simplifying rollbacks when needed
- Maintaining clear documentation of project development

### Interactive Rebase

Interactive rebase is your main tool for cleaning up Git history. Use it to modify commits that haven't been pushed to the shared repository.

Basic command:
    
    git rebase -i HEAD~n  # n is the number of commits to review

Or to modify commits up to a specific commit:

    git rebase -i <commit-hash>

### Common Rebase Commands

During interactive rebase, you can mark commits with these commands:

| Command | Description |
|---------|-------------|
| `pick` | Keep the commit as is |
| `reword` | Change the commit message |
| `edit` | Stop to amend the commit |
| `squash` | Combine with previous commit |
| `fixup` | Like squash, but discard the message |
| `drop` | Remove the commit |

### Example Rebase Workflow

1. **View Your Commits**
        
    git log --oneline
    abc1234 feat: add user settings
    def5678 wip: settings page
    ghi9012 fix typo
    jkl3456 wip: initial setup

2. **Start Interactive Rebase**
        
    git rebase -i HEAD~4

3. **Modify the Rebase Plan**

Before:

    pick jkl3456 wip: initial setup
    pick ghi9012 fix typo
    pick def5678 wip: settings page
    pick abc1234 feat: add user settings

After (example cleanup):

    pick jkl3456 wip: initial setup
    fixup ghi9012 fix typo
    squash def5678 wip: settings page
    reword abc1234 feat: add user settings

### Best Practices for Rebasing

1. **Never Rebase Published Commits**
   - Only rebase commits that haven't been pushed
   - If others are working with your branch, communicate before rebasing

2. **Keep Related Changes Together**
   - Squash fix-up commits into their parent feature commit
   - Combine 'work in progress' commits into meaningful units

3. **Create Clean Feature Branches**
   - Start feature branches from up-to-date main branch
   - Regularly rebase feature branches on main to prevent divergence

4. **When to Clean Up History**
   - Before submitting a pull request
   - When completing a feature branch
   - Before merging into main branch

### Resolving Rebase Conflicts

If you encounter conflicts during rebase:

1. Fix conflicts in each file
2. Stage the fixed files:
        
    git add <fixed-files>

3. Continue the rebase:
        
    git rebase --continue

4. Or abort if needed:
        
    git rebase --abort

### Tips for Clean History

1. **Commit Often, Perfect Later**
   - Make frequent commits while working
   - Clean up history before sharing code

2. **Write Clear Messages**
   - Follow commit message guidelines
   - Make history tell a story

3. **Organize Logically**
   - Group related changes
   - Order commits in a way that shows feature progression

4. **Maintain Linear History**
   - Avoid merge commits when possible
   - Use `git pull --rebase` instead of regular pull

5. **Review Before Sharing**
   - Check `git log` to ensure history is clean
   - Verify each commit builds and tests pass

Remember: A clean Git history is a form of documentation. Future developers (including yourself) will thank you for maintaining a clear, logical commit history. 