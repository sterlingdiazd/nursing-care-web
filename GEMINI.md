# Gemini Web Bootloader

Use `../../AGENTS.md` as the workspace contract.

Load `../../NursingCareDocumentation/` guides and specs when the task affects behavior, validation, or auth.

Web-specific rules:
- keep user-facing copy in Spanish
- do not expose backend role codes directly
- reuse shared validation and API error-handling patterns
- preserve parity with mobile auth and shared flows
- run targeted `npm test` coverage for changed areas

Software Development Life Cycle (SDLC) state remains under `../../NursingCareDocumentation/docs/sdlc/`.
Keep handoffs compact and prefer referenced artifacts for large outputs.
