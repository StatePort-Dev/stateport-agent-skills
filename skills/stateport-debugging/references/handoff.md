# Safe session handoff

Keep this only in user-approved local task context. Do not publish it by default.
Use the identifiers and safe fields supplied by the public runtime; do not invent
paths or read private storage to recover them.

Record:

- exact Card and revision references;
- safe project/target identity allowed by the current public contract;
- the observed symptom and the user-provided expected behavior;
- relevant run/comparison references and the current-code target actually tested;
- the last completed step, typed blockers, and the next bounded action;
- any reason for intentionally creating a different Card.

Leave an unavailable field unknown rather than guessing. Never include passwords,
cookies, tokens, protected references, captured payloads or raw local paths.
After resuming, inspect the exact referenced Card again before acting.
