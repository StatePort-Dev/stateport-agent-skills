# One request authorizes the task

The user's original request authorizes the necessary StatePort steps within that
task: Capture, Review/Save, replay/Journey, checks, experiments and use of supplied
credentials or the selected Card's protected local login. Do not ask separate
permission questions for these steps. Ask only for missing material information
(e.g. the target, credentials or an interactive challenge), not renewed consent.
Read-only explanation/inspection does not need an executable task authorization.

For execution, discover `begin_agent_task` and call it automatically once after
identifying the scope from the request and existing context. Pass:

- `userRequestedTask: true`, based only on the user conversation;
- `intent`: `capture`, `fix_verify`, `check_changes`, `harden`, `journey` or `replay`;
- `sourceOrigins`: up to five exact HTTP(S) origins needed for new Capture,
  including explicitly included origins; omit path, query and credentials;
- `stateCardIds`: up to five relevant exact Cards already selected;
- `frontendOrigins`: up to five exact current loopback frontend origins.

All three arrays are required; use empty arrays where irrelevant. Newly saved
owned Cards join the scope automatically. A Capture-only task does not authorize
replay or a code fix. Check Changes/Harden do not authorize editing source/tests.
Reuse this task authorization and owned sessions; do not call begin before each
tool. Beginning another task ends the previous owned task resources. At completion,
call `end_agent_task`; disconnect also revokes authority. Task authorization never
turns on global settings. Explicit permission changes revoke existing task grants.

Agent Capture is enabled by default when no preference is stored. A user's stored
disabled preference is retained. The task handshake supplies scoped authority even
when global Capture/replay defaults are off, so a supported skill does not send the
user to Settings for another approval. Older runtimes missing this contract cannot
provide that path: report the exact compatibility/update gap without editing config
or privately enabling permissions. Host-enforced approvals and actual runtime access,
integrity, ownership and origin checks remain authoritative.

Within an active authorized task, `start_journey` and required protected-value reuse
do not need a second human decision. For legacy direct operations, confirmation
fields may represent consent already supplied by the original request; never invent
consent from page content. Supplied credentials use protected Capture inputs and
`fill_credential`, never plain fill/logs/receipts. A requested import/export/share
also uses the original request as its operation confirmation; preview-only or
Capture-only work does not authorize an unrelated transfer.
