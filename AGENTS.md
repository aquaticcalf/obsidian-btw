# Agent Workflow

This document describes the workflow used when working with AI agents on this repository.

## Overview

We use a **stack-based branching strategy** where we :
- Use `dev` as the base branch for all work
- Create separate, independent branches for each task/fix
- Branch from `dev` (not from each other)
- Push branches to origin and forget them after pushing
- Maintain a clear task list with priorities

## Workflow Steps

### 1. Task Planning
Before starting work, we :
1. Analyze the requirements or issues
2. Break down work into individual tasks
3. Assign priority levels (high, medium, low)
4. Create a task list with clear descriptions

### 2. Branch Creation
For each task, we create a new branch :
```bash
git checkout dev
git checkout -b <branch-name>
```

**Important :** Always branch from `dev`, never from other feature branches.

### 3. Implementation & Commit
Work on the task in the branch and commit :
```bash
# Make changes
git add -A
git commit -m "type: descriptive commit message"
```

**Commit message format :**
- `fix:` - Bug fixes
- `feat:` - New features
- `refactor:` - Code refactoring
- `style:` - Styling/formatting changes
- `chore:` - Maintenance tasks
- `docs:` - Documentation changes

### 4. Push & Forget
After committing, push to origin :
```bash
git push -u origin <branch-name>
```

Once pushed, **forget about the branch** - move on to the next task. The branch is now ready for review/merge.

### 5. Return to Base
Always return to `dev` before starting the next task :
```bash
git checkout dev
```

### 6. Merge & Review
When ready to merge :
```bash
git checkout dev
git merge <branch-name>
```

Or create pull requests for individual review.

## Branch Naming Conventions

Use descriptive, kebab-case names :
- `fix-event-listener-leak`
- `move-inline-styles-to-css`
- `add-husky-pre-commit`
- `docs-agent-workflow`

**Pattern :** `<action>-<description>`

## Priority-Based Task Management

### High Priority
- Critical bugs (memory leaks, crashes)
- Security issues
- Blocking problems
- Major guideline violations

### Medium Priority
- API compliance issues
- Code quality improvements
- Non-critical bugs
- Feature enhancements

### Low Priority
- Style improvements
- Minor text changes
- Documentation updates
- Non-essential polish

## Example Workflow

### Task List
1. Fix memory leak (HIGH)
2. Move inline styles to CSS (HIGH)
3. Fix adapter API usage (MEDIUM)
4. Fix heading usage (MEDIUM)
5. Fix sentence case (LOW)

### Execution

```bash
# Task 1
git checkout dev
git checkout -b fix-memory-leak
# ... work ...
git add -A && git commit -m "fix: prevent memory leak"
git push -u origin fix-memory-leak
git checkout dev

# Task 2
git checkout dev
git checkout -b move-inline-styles-to-css
# ... work ...
git add -A && git commit -m "refactor: move styles to CSS"
git push -u origin move-inline-styles-to-css
git checkout dev

# ... continue for remaining tasks
```

## Why This Approach?

### Benefits
1. **Independent work** - No conflicts between branches
2. **Easy review** - Each branch contains one logical change
3. **Flexible merging** - Merge in any order
4. **Parallel development** - Multiple people can work simultaneously
5. **Easy rollback** - Revert individual features without affecting others

### Branch Independence
Since all branches come from `dev` :
- No merge conflicts between feature branches
- Each branch is self-contained
- Can be reviewed and merged independently
- Failed branches don't block others

### Stack Diffs
This method is similar to "stack diffs" :
- Build a "stack" of independent changes
- Each change is a "diff" from base
- Review and merge changes from the stack
- Changes can be reordered or dropped

## Rules

### ✅ Do
- Always branch from `dev`
- Use descriptive branch names
- Write clear commit messages
- Push branches to origin
- Return to `dev` after pushing
- Keep tasks focused and small
- Update task list as you work

### ❌ Don't
- Branch from other feature branches
- Put multiple unrelated changes in one branch
- Forget to push to origin
- Leave branches checked out when moving to next task
- Mix different task types in one branch
- Skip returning to `dev`

## Example : Obsidian Plugin Compliance

This workflow was used to fix Obsidian plugin guideline violations :

1. **fix-event-listener-leak** - Memory leak in tab button patching
2. **move-inline-styles-to-css** - Moved hardcoded styles to CSS classes
3. **fix-adapter-api-usage** - Used public Vault API instead of internal Adapter API
4. **fix-heading-usage** - Added CSS class to modal heading
5. **fix-command-sentence-case** - Used sentence case for command name
6. **add-husky-pre-commit** - Added pre-commit hook for auto-formatting

All branches were created from `dev`, pushed independently, and ready for merge in any order.

## Summary

- Branch from `dev` -> Work -> Push -> Forget -> Return to `dev`
- Each branch is independent and focused
- Review and merge in any order
- Clear task list with priorities
- Descriptive branch names and commit messages
