---
name: research
description: Investigate a question against high-trust primary sources and deliver findings in Markdown by default, using HTML only for an explicitly requested polished human-facing report. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Deliver the complete findings in **Markdown by default**, with a source beside every claim. For agent collaboration, Issue work, implementation support, evidence summaries, and ordinary research, a Markdown response or repository `.md` file is the finished report.
3. Generate HTML only when the user explicitly asks for a separate polished report intended for people to read, review, present, or publish outside the agent workflow. In that branch, use the repository's report template and validation instructions, keep the source and generated HTML together, and link the result from the appropriate index. A task being called research, review, or audit does not by itself trigger HTML.
4. Report the Markdown or HTML path when an artifact was created, along with the checks that passed. Keep unknowns and rejected candidates in the report instead of silently filtering them out.
