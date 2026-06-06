# Never Bump the Version Yourself

**Do not edit the `version` field in `package.json`, ever** — not even when a task explicitly asks for a "minor/patch/major bump". Releases are owned by the maintainer and cut with `npm version` (which runs the `preversion` build and creates the version commit + tag). A manual edit desyncs that workflow.

If a task seems to require a version change, **stop and flag it** in your summary instead of changing it, and let the maintainer run the release.

# This Library Must Work in Node **and** the Browser

`@pimasi/utils` is dual-target: every published module must run unchanged in both Node.js and the browser. Treat this as a hard constraint when writing or reviewing `src/**`:

- **No Node-only runtime imports or globals** in shared code: no `require()`, no `node:*`/`fs`/`path`/`crypto` imports, no `Buffer`/`process`/`__dirname` on the default path. Use web-standard, cross-runtime APIs only (`fetch`, `Headers`, `Response`, `URL`, `TextDecoder`, `AbortController`, etc.).
- **Node-only capabilities must be optional and inert in the browser.** Example: the HTTP client's `dispatcher` (an undici option) is an optional config field that is simply ignored by browser `fetch` — it is never required and never on the default code path. Follow this pattern for any future Node-specific feature.
- **Keep the dependency tree empty — including types-only packages.** Prefer declaring a minimal structural type locally over adding a dependency such as `undici-types`. For example, the HTTP client's `dispatcher` is typed with a hand-written `HttpDispatcher` interface that a real undici `Agent` satisfies structurally, rather than importing undici's `Dispatcher`. Never add a Node-only package as a _runtime_ import.
- When adding a feature, confirm it doesn't assume a single runtime before shipping.

# Keep README Updated

Whenever features are added, behavior is changed, APIs are updated, dependencies are changed, or release/version bumps happen, review changes and ensure `README.md` is up to date.

## Steps

1. **Identify the comparison base**:
    - For releases/version bumps: run `git tag --sort=-v:refname | head -5` and use the latest published tag (e.g. `v5.0.0`).
    - For regular updates: use the working diff (`git diff --stat`) and recent commits (`git log --oneline -n 20`) as context.

2. **Inspect changes** — run a relevant diff (`git diff <previous-tag>..HEAD --stat` for releases, otherwise `git diff --stat`) and inspect the relevant diffs:
    - `src/**` — any new or changed exports, renamed functions, removed modules
    - `package.json` — dependency changes, script changes
    - `tests/**` — new test coverage that hints at new features
    - `README.md` and docs files — whether docs already reflect code changes

3. **Read the current README** — read `README.md` fully to understand what is documented.

4. **Check for discrepancies** — compare the diff with the README and identify:
    - **New features** not yet documented
    - **Removed or renamed exports** still referenced in the README
    - **Changed APIs** (renamed functions, changed signatures, new options)
    - **Dependency changes** mentioned in docs (e.g. replaced library)
    - **Potential breaking changes** (runtime behavior changes, removed defaults, stricter validation, renamed exports, changed return/throw behavior)

5. **Update the README** — apply the minimum edits needed:
    - Add documentation for new public API surface
    - Remove or update docs for removed/changed APIs
    - If there are breaking changes, add them to the "Breaking Changes" section with migration examples
    - If changes are only potentially breaking, add a "Potential Breaking Changes" note with impact and recommended checks
    - Keep the existing style, structure, and tone
    - Do **not** rewrite sections that haven't changed

6. **Flag breaking-risk status explicitly**:
    - Always include one explicit status in your response/work summary:
        - `Breaking changes: none found`
        - `Potential breaking changes: review required` (with specific items)
        - `Breaking changes confirmed` (with migration notes)

7. **Verify** — re-read the updated README to confirm accuracy against the source code.

## Guidelines

- Only document **public exports** from `src/index.ts` and its re-exports.
- Match the existing documentation style (code examples with inline comments showing inferred types).
- Keep the Table of Contents in sync with section headings.
- If a new top-level module is added, add it to both the Table of Contents and as a new section.
- If a top-level module is removed, remove it from both places.
- Breaking changes should include before/after code snippets.
- For non-release updates, still run this checklist whenever feature/API/behavior changes are detected.
