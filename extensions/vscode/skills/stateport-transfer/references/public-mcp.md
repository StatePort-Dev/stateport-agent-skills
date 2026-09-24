# Public MCP operation map

This map includes the existing Capture/replay contract and the Bug Workflows
source candidate. New operations require a compatible runtime; host acceptance
is version-bound and separate. Discover tools and schemas on the connected runtime before using
them; features such as credentials and element IDs depend on the advertised
schema. Source coverage is not host workflow verification.

| Task | Public operations | Guidance |
| --- | --- | --- |
| Choose and inspect a Card | `list_states`, `inspect_state` | Use the exact supplied Card; list only when selection is needed |
| Read existing evidence | `get_state_history`, `read_console_evidence` | Exact-Card terminal history and redacted baseline console events |
| Diagnose authentication | `get_auth_requirement`, `inspect_auth` | Non-secret requirement/status; inspect_auth needs the intended local targetOrigin |
| Capture | `get_capture_capability`, `start_capture`, `observe_capture`, `observe_capture_page`, `act_on_capture_page`, `stop_capture`, `save_capture`, `discard_capture` | [Capture procedure](capture.md), including supplied credentials and exact controls |
| Authorize the requested task | `begin_agent_task`, `end_agent_task` | [Task authorization](authorization.md); no repeated permission questions |
| Replay a Journey | `inspect_journey`, `inspect_journey_action`, `start_journey`, `get_journey_progress` | [Journey procedure](journey.md), using the original task authorization |
| Open and finalize | `open_state`, `stop_run` | Local current-code Open; finalize a run and retain its result |
| Evaluate results | `get_run_summary`, `get_reproduction_outcome`, `compare_runs` | Keep stable run IDs and exact attempt IDs distinct |
| Check owned replay | `get_run_page_capability`, `observe_run_page`, `act_on_run_page`, `check_run_page`, `describe_run_verification` | Original task authorization; [verification procedure](verification.md) |
| Read terminal behavior | `read_run_checks`, `read_run_console`, `compare_run_checks` | Stable run IDs after stop/restart; runtime verdict stays separate |
| Inspect replay routes | `list_routes`, `inspect_exchange` | Safe session targets and exchange projections |
| Change request matching | `inspect_request_changes`, `apply_request_remap`, `remove_request_remap` | Runtime-issued eligible evidence only |
| Test routes and responses | `set_route_mode`, `create_response_overlay`, `remove_response_overlay` | [Experiment procedure](experiments.md), including replacement session IDs |
| Import, export and share | `inspect_state_transfer`, `import_state`, `export_state` | [Transfer procedure](transfer.md), preview digest and requested destination |

`read_console_evidence` is paginated (up to 50 events per request) and can filter
levels. Read the amount useful to the investigation; it is recorded baseline
evidence, not a live console stream. Auth tools expose status rather than values;
human sign-in and protected acceptance remain in Desktop when the runtime
requires them.

`open_state` needs `stateCardId`; supply the current loopback `frontendOrigin`
to test current code. Omission selects retained captured-source material.
Its default browser is headless; pass `browserVisibility: visible` when requested.
Do not confuse this local target with a captured-source Journey. The connected
schema determines which paths are actually available.

`stop_run` returns the persisted terminal machine outcome. `get_run_summary`
uses a stable run ID; old unqualified evidence may return `legacy_unclassified`.
`get_reproduction_outcome` reads one exact persisted attempt without changing
or reconciling it. Missing/nonterminal evidence is not success. `compare_runs`
compares completed baseline/candidate runs; check comparability and meaningful
evidence before drawing a fix conclusion.

For setup/update verification, discovery is sufficient. No Card enumeration,
Capture or permission change is needed to prove a connection. On a missing
operation or contract mismatch, use [compatibility guidance](compatibility.md).
