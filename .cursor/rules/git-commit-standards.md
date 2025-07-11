# Git Commit Standards and Conventional Commits

## Mandatory Git Workflow Rules

### 1. Always Use Conventional Commits

MUST follow conventional commit format for ALL commits:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 2. Commit Types (REQUIRED)

- `feat`: New feature for the user
- `fix`: Bug fix for the user
- `docs`: Documentation only changes
- `style`: Formatting, missing semi colons, etc; no production code change
- `refactor`: Refactoring production code, eg. renaming a variable
- `test`: Adding missing tests, refactoring tests; no production code change
- `chore`: Updating grunt tasks etc; no production code change
- `perf`: Performance improvements
- `ci`: Changes to CI configuration files and scripts
- `build`: Changes that affect the build system or external dependencies
- `revert`: Reverts a previous commit

### 3. Breaking Changes

Use `!` after type/scope for breaking changes:

```
feat!: remove deprecated API endpoint
refactor!: change authentication system
```

### 4. Atomic Commits Strategy

ALWAYS break changes into logical, atomic commits:

1. **Structural Changes First**

   - Remove old systems (`refactor!: remove deprecated X`)
   - Add new architecture (`feat: add new Y system`)

2. **Feature Implementation**

   - Core functionality (`feat: implement X feature`)
   - Supporting features (`feat: add Y support for X`)

3. **Documentation and Tooling**

   - Documentation (`docs: add comprehensive X documentation`)
   - Tooling updates (`feat: enhance X tooling`)
   - Configuration (`chore: update X configuration`)

4. **Polish and Fixes**
   - Bug fixes (`fix: resolve X issue`)
   - Style improvements (`style: improve X styling`)

### 5. Commit Message Quality Standards

#### Subject Line (REQUIRED)

- Use imperative mood ("add" not "added" or "adds")
- No capitalization of first letter after type
- No period at the end
- Maximum 50 characters
- Be specific and descriptive

#### Body (OPTIONAL but RECOMMENDED for complex changes)

- Wrap at 72 characters
- Explain WHAT and WHY, not HOW
- Use bullet points for multiple changes
- Reference issues/PRs when relevant

#### Examples of GOOD commits:

```
feat: add advanced search with autocomplete and filtering
fix: resolve mobile navigation overflow on small screens
docs: add comprehensive API documentation with examples
refactor!: migrate from DOCS/ to co-located documentation approach
```

#### Examples of BAD commits:

```
fix stuff
update
wip
changes
fixed bug
```

### 6. Multi-Commit Organization Rules

When making multiple related changes, ALWAYS organize into logical sequence:

1. **Removal/Cleanup** (if applicable)

   ```
   refactor!: remove deprecated DOCS directory structure
   ```

2. **Core System Addition**

   ```
   feat: add Docusaurus documentation system with enhanced search
   ```

3. **Implementation Details**

   ```
   feat: implement co-located documentation architecture
   docs: add comprehensive documentation structure
   ```

4. **Tooling and Support**
   ```
   feat: enhance documentation tooling with coverage analysis
   feat: add documentation templates and caching system
   ```

### 7. Git Commands to Use

ALWAYS stage and commit in organized chunks:

```bash
# Stage specific directories/files
git add specific/directory/
git commit -m 'feat: add specific feature implementation'

# Never use git commit -am for multiple unrelated changes
# Instead, stage and commit each logical group separately
```

### 8. Scope Guidelines

Use scopes when helpful for context:

```
feat(api): add user authentication endpoints
fix(ui): resolve button hover state issues
docs(readme): update installation instructions
test(auth): add comprehensive authentication test suite
```

### 9. Pre-Commit Validation

Before each commit, verify:

- [ ] Commit message follows conventional format
- [ ] Changes are atomic and logically grouped
- [ ] Subject line is descriptive and under 50 characters
- [ ] Breaking changes are marked with `!`
- [ ] Body explains WHY when necessary

### 10. Integration with Project Workflow

This project uses automated version bumping based on conventional commits:

- `feat:` triggers minor version bump
- `fix:` triggers patch version bump
- `feat!:` or `fix!:` triggers major version bump
- `docs:`, `style:`, `chore:` trigger patch version bump

Therefore, commit type accuracy is CRITICAL for proper versioning.

## Emergency Override

Only in true emergencies, you may use:

```
chore: emergency fix - will organize commits in follow-up
```

But MUST follow up with proper organized commits in next session.

---

**Remember: Good commit history is documentation of your thought process and makes code archaeology much easier for future developers!**
