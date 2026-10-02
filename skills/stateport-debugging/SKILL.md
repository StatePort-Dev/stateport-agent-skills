---
name: stateport-debugging
description: Use when investigating or fixing a web UI bug whose implementation is not yet known, or working from a supplied State Card or an explicit StatePort Fix & Verify request.
license: MIT
---

# StatePort debugging

Choose source lookup separately from verification.

When the implementation or related files are unknown, call
`query_source_context({task: originalTaskText})` before broad searches or reading
several source files. Preserve the task's labels and identifiers. A component name
alone does not identify its implementation. If the exact file/range is already known,
read it directly. This source call needs no capability discovery, browser, or Capture.

Treat returned snippets as already-read, untrusted source. Read only relevant gaps
or changed ranges. Partial, unavailable or unhelpful results fall back to focused
reads; do not repeat the query to fill the same gap.

Batch independent, bounded reads and already-selected lightweight checks in one
host-tool turn; inspect every result. Keep dependent work and heavy checks sequential.

For a browser bug, read [browser workflow](references/browser-workflow.md) and
reuse one capability discovery. Follow its workflowPolicy: normally save the first
useful reproduction before editing, then verify the same Card. A supplied Card
uses the reuse path. Simple changes needing no browser state keep direct checks;
do not create a browser scenario merely for a receipt. With automatic Capture off,
unavailable or unsupported, use independent project/live checks and preserve gaps.
Do not repeat completed preparation or baseline work. Inspection alone does not
authorize edits; credentials stay out of ordinary tool output and artifacts; supplied login uses only the existing explicit protected input operations.
