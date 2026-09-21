---
name: stateport-transfer
description: Preview and import StatePort Cards from .scard files or Share URLs, export a Card to a file, or create a temporary sharing link for a requested handoff.
license: MIT
---

# StatePort Card transfer

Complete the requested import, export or sharing task using public MCP tools.
Read [the transfer procedure](references/transfer.md),
[workflow guidance](references/workflow.md) and
[data handling](references/safety.md).

For import, preview the supplied file or link with `inspect_state_transfer`,
then use `import_state` with that exact source and returned digest. A user
request to import this source supplies confirmation for an ordinary import;
do not ask again after an unchanged preview. A preview-only request stops at
the preview. Protected contents require an explicit Card-only choice or
acceptance in Desktop; ask only if that choice was not already given.

For export, inspect the exact Card and use `export_state` with the requested
file destination or link destination. A request to create a sharing link
authorizes that upload; set `confirmedByUser: true` on that basis. If the user
only says “export” and the destination cannot be inferred, ask whether they
want a local file or a link before uploading. Existing files are not overwritten.

Use the default seven-day expiry for a link unless the task requests another
supported duration. Return the resulting file or link only in the requested
handoff context. A Share URL grants access to whoever has it; avoid repeating
it in logs, public artifacts or unrelated messages. Sending it to another
person is a separate action unless included in the user's request.

Report the resulting Card identity, file or link and expiry, and any protected
content excluded. Import/export success does not itself establish replay
quality. Continue with inspection or debugging if requested.
