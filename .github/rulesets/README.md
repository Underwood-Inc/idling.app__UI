# Repository rulesets

`master-ruleset-patch.json` mirrors required status checks for the default branch ruleset ([rules/686398](https://github.com/Underwood-Inc/idling.app__UI/rules/686398)). CI unit work is **Vitest** (`Quality Assurance` workflow), not Jest.

Apply after edits:

```bash
gh api --method PUT repos/Underwood-Inc/idling.app__UI/rulesets/686398 --input .github/rulesets/master-ruleset-patch.json
```