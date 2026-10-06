Before performing any task, read and follow RULES.md.
RULES.md contains mandatory repository safety and tooling restrictions.

# Redwell Studio agent guidance

Redwell Studio is a recovered project. The CURRENT working tree is authoritative:
the files currently on disk are the source of truth. Never restore, synchronize,
update, or replace them from Git history, another branch, or a remote unless the
user explicitly requests that operation. Read and follow RULES.md before working.

## Working process

1. Understand the requested task before modifying code.
2. Inspect only files relevant to that task.
3. Make the smallest necessary changes.
4. Preserve existing functionality unless explicitly asked to change it.
5. Never perform unrelated refactors.
6. Never remove existing features merely because they look unused.
7. After changes, run appropriate safe validation, such as TypeScript checks,
   lint, or a build, when useful. Avoid regenerating output for documentation-only
   work; validate the documentation and cleanup directly instead.
8. Report exactly which files were changed, created, or deleted, and which
   validation was performed.

## Existing product scope

Collage is the active product. Photo Editing and Carousel are temporarily
disabled, and their implementations must remain preserved for possible future
reactivation. Do not expose or reactivate them unless explicitly asked.

Protect shared dependencies and preserve the existing UI, editor behavior,
Collage, Carousel, and image editor functionality unless the task explicitly
requires a change. Inspect shared usage before changing shared components.

Before cleanup, verify each target is generated, debug, or obsolete material.
Do not delete application source, assets, package files, or configuration merely
because they appear unused.
