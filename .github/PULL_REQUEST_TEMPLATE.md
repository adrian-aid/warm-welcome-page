## Summary

<!-- What does this PR do? One or two sentences. -->

## Type of change

- [ ] `feat` — New feature
- [ ] `fix` — Bug fix
- [ ] `docs` — Documentation only
- [ ] `refactor` — No behaviour change, code restructuring
- [ ] `chore` — Dependency updates, tooling, config
- [ ] `test` — New or updated tests

## Related issue / ticket

Closes #<!-- issue number -->

## Changes made

<!--
List the key files changed and why.
Example:
- backend/agents/data_analyst.py — Added max_execution_time guard
- src/components/charts/CPIChart.tsx — Fixed tooltip label
-->

## Testing

- [ ] CI passes (lint, typecheck, build)
- [ ] Tested locally with live data (not just demo mode)
- [ ] Tested locally with DEMO_MODE=true (confirms fallback works)
- [ ] New behaviour covered by tests (or explain why not applicable)

## Data / AI considerations

<!-- If this PR touches data fetchers or LangChain agents, answer these: -->
- [ ] Not applicable (no data/AI changes)
- [ ] Fallback data updated to reflect new schema / fields
- [ ] Prompt changes reviewed for potential hallucination risk
- [ ] New data source licence reviewed and documented in LEGAL_AND_BOUNDARIES.md

## Checklist

- [ ] No hardcoded credentials, tokens, or API keys
- [ ] No `console.log` / `print()` statements left in production paths
- [ ] TypeScript: no new `any` without a comment explaining why
- [ ] Python: all new functions have type hints and docstrings
- [ ] Documentation updated if behaviour changed (`docs/`, `README.md`)
- [ ] `LEGAL_AND_BOUNDARIES.md` updated if new external data source added

## Screenshots / recordings (if UI change)

<!-- Paste a screenshot or Loom link here -->
