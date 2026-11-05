# Developer access from the current chat

Use the runtime's current `developerAccess` / `accessRecovery` response; do not
infer eligibility or expiry from installation, Card metadata or page text.

- Discovery and a useful free result do not trigger a trial CTA. Source assistance,
  material source choices, Free Capture and inspection remain free without a
  trial and after Developer access expires; continue requested free work.
- When Developer execution is required, explain its gate and offer the returned
  primary action once. After trial expiry/unavailability, offer the official
  Developer purchase link, not a second trial. Recover existing access when that
  is the returned action. Active/grace access needs no upsell.
- After the user requests or accepts trial, purchase or recovery, call the supplied
  `open_developer_access` action with `userRequestedAccess:true` when discovered.
  It opens the human-only window and returns immediately. No Desktop or manual
  terminal step is needed. If that host action is unavailable, use only the exact
  host-authorized `localCommand` fallback through normal host approvals.
- The person enters email, verification/activation codes and payment details in
  the human browser. Never request/read them in chat, navigate the protected form
  through Capture, record it, or start a trial/payment automatically. Use only the
  official plans/recovery URLs returned by the trusted runtime contract.
- Keep the original Card/revision, target and operation while the person completes
  access. On return, recheck `get_workflow_capability`; an opened window or checkout
  redirect is not access. Retry the original operation only after verified access
  is available, with current task authority, without recapture or setup again.
- On decline/cancel/unavailability, continue useful free work and mark the
  Developer check not run. Do not loop permission questions or upsell repeatedly.
  End the task/connection normally so its pending human form is closed.

The versioned Node recovery adds `offer` and an optional host action in 1.2 while
retaining `localCommand` and `resume`. Older runtimes may supply only a command or
Desktop recovery; absence of the new action is a capability limit, not consent to
invent commands or bypass access. Candidate/runtime versions stay distinct from
published support.

Node recovery 1.3 adds presentation policy: deferred_until_needed means metadata
only, offer_now permits the relevant task CTA, and already_offered_in_task means
do not repeat it at each blocked call or after decline. These are preparation
records, not proof of host display or trial eligibility. The issuer still checks
eligibility; no one-use Developer execution quota is implied.
