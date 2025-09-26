# Cognitiv Trust Secure Code Assistant

A VS Code extension that scans your code using Semgrep to detect insecure patterns and surfaces them as Diagnostics with optional Quick Fixes.

## Features
- On-demand and on-save security scanning (Semgrep)
- Findings shown in VS Code Problems panel
- Quick Fix command to help remediate certain issues
- Strict TypeScript setup with source maps

## Project Structure
- `src/`
  - `extension.ts`: Activation, commands, diagnostics wiring, quick-fix command handler
  - `scanner.ts`: Semgrep invocation, result parsing, `Issue` type, diagnostics creator
  - `fixes.ts`: Applies fixes when an `Issue.fix` is provided
  - `promptEnricher.ts`: Example prompt enrichment hook (optional)
- `semgrep-rules/`: Custom Semgrep rules (e.g. `hardcoded_secret.yml`, `missing_auth.yml`)
- `out/`: Compiled JavaScript output
- `.gitignore`: Ignores build outputs, logs, samples, and environment files

## Requirements
- Node.js (LTS recommended)
- Semgrep installed on your system
  - macOS (Homebrew): `brew install semgrep`
  - Python/pipx: `pipx install semgrep`
  - Verify: `semgrep --version`

## Setup
```bash
npm install
npm run compile
```

## Run the Extension (VS Code)
1. Open this folder in VS Code.
2. Press F5 to launch an Extension Development Host.
3. Use the Command Palette and run: `Cognitiv: Scan Code for Security Issues`.
4. Findings will appear in the Problems panel.
5. Some findings offer a Quick Fix command via code actions.

## How Scanning Works
- The extension shells out to `semgrep` with the project rules directory.
- Rules directory resolution (in `scanner.ts`):
  1. `${workspaceRoot}/semgrep-rules`
  2. `${workspaceRoot}/test-file/semgrep-rules`
  3. `${extensionDir}/../semgrep-rules`
- Semgrep outputs JSON; we map its results to an `Issue` with range and metadata.
- Diagnostics are created from `Issue` ranges using `createDiagnostics`.

## Quick Fixes
- The extension registers a command `cognitiv.applyQuickFix`.
- When invoked from a diagnostic, it maps the diagnostic range into an `Issue` and calls `applyQuickFix` from `fixes.ts`.
- If an `Issue.fix` is provided by the rule’s metadata, the replacement is applied. Otherwise a message indicates no quick fix is available.

## Development
- Build once: `npm run compile`
- Watch mode: `npm run watch`
- TypeScript is configured in `tsconfig.json` (strict mode, `src` → `out`).

## Troubleshooting
- "Command not found: semgrep": Ensure Semgrep is installed and on your PATH.
- No findings appear:
  - Confirm your files are tracked by git (Semgrep sometimes honors gitignore).
  - Ensure your rules exist under one of the fallback locations above.
  - Try running Semgrep manually: `semgrep --config semgrep-rules <path> --json`.
- Quick Fix not shown:
  - Some rules may not provide `fix` metadata.
  - Ensure the diagnostic `code` matches what your code action provider expects.

## License
MIT (or your chosen license)
