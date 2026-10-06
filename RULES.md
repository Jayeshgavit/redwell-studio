## Tooling, validation, and efficiency rules

Prefer simple code inspection and targeted validation over expensive or broad
tool usage.

### Browser and automation restrictions

Do NOT use browser automation unless the user explicitly requests it.

This includes:

- Playwright
- Puppeteer
- Selenium
- Browser-based E2E testing
- Automated screenshots
- Visual regression testing
- Starting browsers to inspect the UI
- Installing browser binaries
- Adding new E2E/browser-testing dependencies

Do not install new development tools, packages, libraries, frameworks, or
dependencies unless they are genuinely required for the requested task.
Ask the user first when a new dependency would materially change the project.

For normal UI/code changes, inspect the relevant source files and make the
smallest necessary change.

### Validation strategy

Do NOT automatically run a full production build after every change.

Choose validation proportional to the change.

For very small changes such as:
- text/copy changes
- CSS adjustments
- spacing
- colors
- simple markup changes
- small isolated component edits

Prefer source inspection and targeted checks. A full build is normally
unnecessary.

For TypeScript or logic changes, use the smallest relevant validation first,
such as:
- TypeScript/type checking
- linting the relevant code
- targeted existing tests

Run a full production build only when:
- the change is substantial,
- multiple important files/systems were changed,
- build configuration changed,
- dependencies changed,
- the user explicitly asks for it,
- or there is a realistic build/regression risk that smaller checks cannot
  reasonably validate.

Do not repeatedly run the same validation command when nothing relevant has
changed since the previous successful run.

### Development server

Do NOT automatically start or restart the development server if it is not
needed.

Do NOT create multiple development-server processes.

If the user already has the application running, assume they will visually
inspect UI changes unless they explicitly ask the agent to do additional
verification.

### Efficiency and scope

Minimize unnecessary tool calls, command executions, file reads, and repeated
repository-wide searches.

Start by inspecting only files directly relevant to the requested task.
Expand investigation only when dependencies or behavior require it.

Do not repeatedly read large files when the necessary section is already known.

Do not perform repository-wide refactors, formatting, lint fixes, dependency
updates, or cleanup unless explicitly requested.

Do not modify unrelated files simply to make them cleaner.

Do not regenerate package-lock.json unless dependency changes actually require
it.

Do not regenerate generated/build output merely for verification.

### Existing architecture

Prefer the project's existing:
- components
- utilities
- types
- state management
- styling patterns
- dependencies

before introducing new abstractions or libraries.

Do not replace working implementations with a different library or architecture
merely because another approach appears cleaner.

### Before finishing a task

Before reporting completion:

1. Review the actual changes made.
2. Check for obvious TypeScript/import/syntax mistakes.
3. Run only the minimum appropriate validation for the change.
4. Report what was changed.
5. Report what validation was performed.
6. Mention any validation intentionally not performed.
7. Do NOT commit or push unless the user explicitly requested it.