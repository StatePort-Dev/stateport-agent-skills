# External prerequisites and native controls

Read only when the reproduction needs these features.

**External state is separate.** If the task explicitly authorizes preparing local
fixture data and discovery advertises `optionalPrepare`, export `prepare(url)`
in this same file. It runs before Capture, local restore and live navigation, so initial UI reads
see the prepared data. No Page is supplied. Keep it deterministic, limited to
the authorized local fixture and unchanged with setup. Omit it when unnecessary.
It never runs on `captured_source`; a Card is not a backend snapshot.
If a service advances on each request, avoid consuming its sequence in setup or
probing it again just to inspect data. Keep the coherent request sequence in exercise,
using recorded responses where supported. Use advertised `localRequests = 'recorded'` only for a same-origin response
sequence whose request method, URL and body repeat exactly, and whose required
responses are all reached during the original exercise before its failing assertion.
Generated operation IDs/timestamps, changed write bodies or new post-fix requests
make that choice unsuitable: keep ordinary Local Open and check authorized local
service effects with `live`. Do not normalize away meaningful request differences
or invent recorded responses. Select the option before Capture and keep it stable.
Exact matching preserves response content and per-request sequence, not causal
ordering between concurrent endpoints. If failure depends on controlled response
release, use ordinary Local Open with authorized deterministic preparation and
check the required delivery orders live; do not infer timing from recorded content.
It replays finite exact data requests; misses fail closed. Current frontend assets
and separate live checks stay live. Without an authorized reset, a fresh live run
may start later in the sequence; report that limitation. Hand-written
`page.route().fulfill()` fixtures are separate test evidence, not captured replay.
Preparation must establish the same external prerequisites for the saved
checkpoint on every local invocation; setup itself still runs only on fresh
Capture/live. A changed prepare requires new comparable preconditions.
Never add remote resets or assume a fresh browser clears server data.
Browser exercise network checks use the owned Page (for example `page.evaluate`
with ordinary fetch), so requests pass through browser routing. Explicit local
routing may reach the local backend; replayed responses are not live-write proof. Node fetch and
`page.request` bypass that routing and cannot establish replay evidence. Use
them only for explicitly authorized external preparation or separate live
evidence. APIRequestContext takes a string URL (`new URL(path,url).href`),
not a URL object. Keep compatible UI checks together. Backend journals/effects require live evidence:
use `--live-check required` when the core exercise already covers them, or a separate
`live` script when they need different checks. Replaying a write cannot update a journal.
For request-count criteria, count matching operation entries by method, endpoint
and relevant identity, using a scenario-local delta where needed. A global HTTP
counter includes initial reads, polling and control traffic; it is not a mutation
count. Auxiliary accounting must not stop Capture before required responses arrive:
check it after the complete bug sequence or in the planned live check. Journal
pending/released state is not proof the frontend has applied an optimistic update
or consumed the released response; observe that UI transition separately.

For a native `<select>` prerequisite, use `locator.focus()` and bounded
`locator.press()` keys (Home/End/ArrowUp/ArrowDown, then Tab) and confirm
`inputValue()` plus the dependent content before the next action. Playwright
`selectOption()` dispatches untrusted DOM events that Capture does not record;
synthetic `dispatchEvent`/evaluate mutations cannot establish replayable setup.
Custom comboboxes use their actual semantic button/option actions. Determine
the option order and accessible name from the actual app, not an assumed index.

