# External prerequisites and native controls

Read only when the reproduction needs these features.

**External state is separate.** If the task explicitly authorizes preparing local
fixture data and discovery advertises `optionalPrepare`, export `prepare(url)`
in this same file. It runs before Capture, local restore and live navigation, so initial UI reads
see the prepared data. No Page is supplied. Keep it deterministic, limited to
the authorized local fixture and unchanged with setup. Omit it when unnecessary.
It never runs on `captured_source`; a Card is not a backend snapshot.
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
not a URL object. Request journals/counters need scenario-local deltas or
explicit expected inputs, not a global zero inherited from a previous run.

For a native `<select>` prerequisite, use `locator.focus()` and bounded
`locator.press()` keys (Home/End/ArrowUp/ArrowDown, then Tab) and confirm
`inputValue()` plus the dependent content before the next action. Playwright
`selectOption()` dispatches untrusted DOM events that Capture does not record;
synthetic `dispatchEvent`/evaluate mutations cannot establish replayable setup.
Custom comboboxes use their actual semantic button/option actions. Determine
the option order and accessible name from the actual app, not an assumed index.

