---
name: stateport-capture
description: Use when recording a browser state or supplied reproduction steps with StatePort, including requested login and saving a reusable State Card.
license: MIT
---

# StatePort Capture

Choose one procedure from the user's task:

- **Capture plus investigation/fix/verification:** inspect `get_capture_capability` once. An available `executableWorkflow` plus host-authorized local execution uses [the executable path](references/executable-fix-verify.md); otherwise use [Fix & Verify](references/fix-verify.md). Retain that choice when Debugging is also invoked.
- **Capture only:** read [Standalone Capture](references/capture-only.md). This scope does not authorize code changes or replay.

If the selected procedure is already loaded, continue from retained task state.
Use the connected tool schema for a missing argument; load further references only
for the concrete conditions named by the selected procedure.
