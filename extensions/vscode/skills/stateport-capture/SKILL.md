---
name: stateport-capture
description: Use when recording a browser state or supplied reproduction steps with StatePort, including requested login and saving a reusable State Card.
license: MIT
---

# StatePort Capture

Choose one procedure from the user's task:

- **Capture plus investigation/fix/verification:** reuse one get_workflow_capability result (legacy fallback: get_capture_capability). Follow workflowPolicy when advertised; explicit Capture requests remain available with existing permissions even when automatic Capture is off. When `executableWorkflow.available` is true and its descriptor supports the needed prerequisites, read [the executable path](references/executable-fix-verify.md) and invoke its descriptor through the host command tool under its normal execution approval. No separate adapter consent is needed. Use [Fix & Verify](references/fix-verify.md) if the helper is unavailable, execution is denied, the descriptor directs the needed protected input to managed Capture, or the user specifically requires individual MCP tool calls. Use already supplied credential context before starting that Capture; follow the existing protected input operations, without a preliminary anonymous attempt. Retain that choice when Debugging is also invoked.
- **Capture only:** read [Standalone Capture](references/capture-only.md). This scope does not authorize code changes or replay.

If the selected procedure is already loaded, continue from retained task state.
Use the connected tool schema for a missing argument; load further references only
for the concrete conditions named by the selected procedure.

The helper performs managed Capture, Card save and same-Card replay. A request
for those outcomes or to use StatePort MCP does not require separate calls.
A sandbox startup error alone is not evidence that the helper is unavailable;
use the host's permitted execution handling without bypassing a denial.

For investigation/fix only, the same discovery may advertise `contextBroker`.
Before broad source reads, if the relevant implementation is unknown, follow
[bounded source context](references/context-broker.md). Reuse the descriptor and
any pack already obtained; Capture-only tasks do not need source retrieval.
