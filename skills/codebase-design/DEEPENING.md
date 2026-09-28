# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Assumes the vocabulary in [SKILL.md](SKILL.md) — **module**, **interface**, **seam**, **adapter**.

## Dependency categories

When assessing a candidate for deepening, classify its dependencies to understand ownership, lifecycle, and deployment constraints.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable — merge the modules. No adapter needed.

### 2. Local resources

Dependencies such as a database or filesystem. Account for resource access and lifecycle when deciding what belongs in the deepened module.

### 3. Remote but owned (Ports & Adapters)

Your own services across a network boundary (microservices, internal APIs). Define a **port** (interface) at the seam. The deep module owns the logic; the transport is injected as an **adapter**, such as HTTP/gRPC/queue.

Recommendation shape: *"Define a port at the seam and an HTTP adapter for the transport, so the logic sits in one deep module even though it's deployed across a network."*

### 4. True external

Third-party services (Stripe, Twilio, etc.) you don't control. The deepened module takes the external dependency as an injected port.

## Seam discipline

- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a port unless at least two adapters are justified. A single-adapter seam is just indirection.

## Preserve useful coverage

Keep useful behavioral and regression coverage through the refactor. Replace or remove tests only when their coverage is redundant or no longer required by the approved behavior.
