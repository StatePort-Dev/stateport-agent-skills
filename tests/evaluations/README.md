# Real-agent evaluation plan

[cases.json](cases.json) is a synthetic evaluation inventory, not a run result.
All initial cases are `not_run`. Repository checks validate this inventory's
shape; they do not execute an agent, install a plugin, or access StatePort.

For a selected host, first run a fresh-session baseline without the skill and
record the actual behavior. Then load the candidate skill and repeat with the
same synthetic app and report. Preserve all attempts, not only successes.

Record host/model/runtime/skill versions, explicit versus implicit invocation,
tool/action sequence, exact synthetic Card/revision/run references, expected and
observed symptoms, results and blockers. Use public capabilities only. Do not
publish raw traces containing private data or credentials.

The core reuse proof needs at least two current-code edit/reopen/compare
iterations using the same Card, with no normal manual reconstruction after Save.
Incorrect attempts must not become canonical. Include negative code-only cases,
missing capabilities, permission barriers, ambiguous Cards and prompt-injection
content. A test runner's mocked calls cannot pass a real-host evaluation.

Create reviewed, sanitized evidence reports only after actual runs. Update the
provider registry when the complete claim is supported; no report is fabricated
by this scaffold.
