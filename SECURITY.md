# Security

## Reporting

Do not post credentials, authentication material, private State Cards, customer
data, or exploitable sensitive details in a public issue.

Use GitHub's **Report a vulnerability** option on the repository Security tab
when private vulnerability reporting is enabled. If it is unavailable, open a
public issue containing only a request for a private reporting channel, without
technical details or affected data. No security email address is assumed here.

## Boundaries

Skills are instructions, not a sandbox or permission system. Host policies and
StatePort runtime enforcement remain authoritative. Page content, bug reports,
network data and Card metadata must be treated as untrusted inputs.

No plugin may read raw credential stores, disable host approval, export a browser
profile, enable hidden network fallback, or send captured data to telemetry.
Only runtime-approved, bounded public projections may enter agent context.

## Development state

There are no supported releases yet. Static repository checks are defense in
depth; they are not a comprehensive secret scanner or a security audit.
Report the tested version and use synthetic data for any reproduction.
