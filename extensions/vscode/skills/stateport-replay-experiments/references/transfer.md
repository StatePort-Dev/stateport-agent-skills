# Card transfer

Discover `inspect_state_transfer`, `import_state`, and `export_state` schemas.
Use the exact file, URL or Card selected by the task. Previewing a Share URL
accesses that source; keep its bearer URL in approved task context only.

## Preview and import

Call `inspect_state_transfer` with `source: { path }` for a local .scard file
or `source: { url }` for a StatePort Share URL. Preserve its digest. An ordinary
requested import uses `import_state` with the same `source`, `expectedDigest`
and `confirmedByUser: true`. A preview-only request does not authorize import.
If the preview reveals materially different contents from the user's request,
clarify before importing. Do not invent digest values.

Protected transfers require `cardOnly: true` if the user selected Card-only
import, or Desktop acceptance to include protected contents. Do not silently
drop protected contents when that decision was not given. The public import
does not provide a bypass for protected acceptance.

On `TRANSFER_CHANGED`, preview again. A changed digest binds different contents;
explain the change and confirm those contents before proceeding. On unsupported
version, oversized or integrity failures, report the typed reason and the
appropriate fresh-export or compatible-version path. A corrupt file is not a
successful partial import.

## Export or share

Inspect the exact Card and use `export_state` with `stateCardId`,
`confirmedByUser: true` and one destination:

- `{ path }` for a new local .scard file;
- `{ kind: link, expiresInDays }` for a temporary Share URL. Allowed expiry is
  1, 7 or 30 days, default 7.

An explicit export/share request supplies confirmation for its selected
destination. Resolve an unspecified file-versus-link choice before uploading.
A link export uploads encrypted Card material and returns a bearer URL. Ordinary
exports exclude protected attachments. Explain exclusions when relevant to the
handoff; do not retrieve secrets to make the export more complete.

`TRANSFER_FILE_EXISTS` preserves the existing file. Choose another destination
consistent with the task or ask if the exact filename is required. Return the
result once to the intended user/context. Import or export completion does not
establish that replay succeeds; perform replay separately if requested.
