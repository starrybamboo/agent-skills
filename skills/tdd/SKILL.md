---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
---

# Test-Driven Development

TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, the anti-patterns, and the rules of the loop. Load the guidance needed for the current behavior; keep each cycle focused on a useful failing test and its implementation.

When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.

## What a good test is

Tests verify required behavior and concrete failure risks. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists. Choose the test approach that demonstrates the behavior reliably, without coupling assertions to irrelevant implementation details.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Anti-patterns

- **Implementation-coupled** — asserts incidental structure or interactions without checking the required behavior. The tell: a harmless refactor breaks the test while a real regression can still pass.
- **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
- **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead — one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
- **One slice at a time.** One behavior, one test, one minimal implementation per cycle.
- **Refactor when useful, while green.** Remove duplication or simplify the implementation within the tested behavior, then rerun the affected tests. Separate review or simplification workflows are optional tools, not required stages of each loop.
