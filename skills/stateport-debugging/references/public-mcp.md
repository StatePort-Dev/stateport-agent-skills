# Public MCP operation map

Discover the tools and input schemas exposed by the connected local MCP server
before acting. The names below match the public StatePort MCP reference as
inspected on 2026-09-12; the connected runtime's actual capabilities take
precedence. Do not assume an operation exists because this file lists it.

For an existing Card, use `list_states` only when no exact Card was supplied.
Use `inspect_state` on the exact identifier before `open_state`. The public
contract also exposes `stop_run`, `get_run_summary`, `compare_runs`, and
`get_reproduction_outcome` for safe run evidence. Discover each input schema
instead of inferring IDs or arguments from the operation name. Keep the exact
Card and revision, run IDs, target and outcome distinct.

The inspected public MCP reference does **not** expose Start/Observe/Stop/Review/
Save/Discard Capture or recorded managed-Page control. Those operations belong
to the separate runtime lifecycle. Until the connected public server advertises
and authorizes them, a text-only bug report without a suitable Card cannot use
agent-driven Capture. Explain this limitation and allow the normal Desktop
Capture path when the user chooses it; do not use development-only validation
tools or an agent browser as a substitute.

`start_journey` is a human-confirmation handoff, not autonomous Journey
authority. A successful `open_state` does not itself prove the current code was
loaded or the bug was fixed; inspect the resulting run and comparison evidence.
