# Public MCP operation map

Discover the tools and input schemas exposed by the connected local MCP server
before acting. The names below match the public StatePort MCP reference as
inspected on 2026-09-16; the connected runtime's actual capabilities take
precedence. Do not assume an operation exists because this file lists it.

For an existing Card, use `list_states` only when no exact Card was supplied.
Use `inspect_state` on the exact identifier before `open_state`. The public
contract also exposes `stop_run`, `get_run_summary`, `compare_runs`, and
`get_reproduction_outcome` for safe run evidence. Discover each input schema
instead of inferring IDs or arguments from the operation name. Keep the exact
Card and revision, run IDs, target and outcome distinct.

For a new Card, first call `get_capture_capability`. Capture may proceed only
when it returns `available: true` and `permission: "enabled"`, with a managed
`browserSessionMode: "clean-session"` and `auth: "none"`. The documented
public lifecycle is `start_capture`, `observe_capture`,
`observe_capture_page`, `act_on_capture_page`, `stop_capture`,
`save_capture`, and `discard_capture`. Discover every input schema before use.
`start_capture` creates a named, origin-scoped Capture session; the default
browser visibility is headless and visible mode is an explicit request.

Use `observe_capture_page` to receive the exact managed Page, then use only
the bounded semantic operations advertised by `act_on_capture_page`. Start
before the reproduction. `stop_capture` enters mandatory Review; only a
reviewed capture may be saved as an ordinary Card. Discard an inconclusive or
unwanted capture. Permission revocation, scope denial, authentication or
protected-data decisions, and finalization errors are safe blockers: stop the
affected action and report them. Do not use development-only validation tools,
browser debug protocols, raw selectors, arbitrary script execution, a browser
profile, or an unrelated agent browser as a substitute.

`start_journey` is a human-confirmation handoff, not autonomous Journey
authority. A successful `open_state` does not itself prove the current code was
loaded or the bug was fixed; inspect the resulting run and comparison evidence.
