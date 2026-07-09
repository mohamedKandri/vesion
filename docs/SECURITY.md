# Security

Security posture, OWASP Top 10 mapping, and operational guidance.

## Authentication & sessions

- **Passwords** — bcrypt (cost 12), policy enforced in DTOs (≥10 chars, upper/lower/digit).
  Uniform "invalid email or password" errors and uniform forgot-password responses prevent
  account enumeration.
- **Tokens** — 15-minute JWT access tokens; 30-day opaque refresh tokens stored **SHA-256
  hashed**, rotated on every refresh. Reuse of a rotated token is treated as theft: the entire
  session family is revoked and audited. Refresh cookie: `httpOnly`, `Secure`, `SameSite=Strict`,
  path-scoped to `/api/v1/auth`.
- **2FA** — TOTP (RFC 6238) via authenticator apps; secrets encrypted at rest with AES-256-GCM
  (`ENCRYPTION_KEY`). Disabling requires password + current code.
- **Sessions** — users can list and revoke active sessions; password reset and account
  deactivation revoke all of them.
- **Email verification** — required before login; single-use, hashed, 24h-expiring tokens.

## OWASP Top 10 mapping

| Risk | Mitigation |
| --- | --- |
| A01 Broken access control | Global JWT guard (deny-by-default), role guard, and company-scoping inside every service (`companyId` from the token, never the request). Clients cannot see drafts, internal notes, or other tenants' rows. Object-level checks on files, tickets, conversations. |
| A02 Cryptographic failures | TLS at NGINX (TLS 1.2/1.3, HSTS preload); bcrypt; AES-256-GCM; SHA-256 token hashing; secrets validated at boot (production refuses placeholders). |
| A03 Injection | Prisma parameterized queries (no raw SQL); `class-validator` DTOs with `whitelist` + `forbidNonWhitelisted`; sort fields whitelisted to prevent column probing. |
| A04 Insecure design | Threat-modeled flows: token rotation with reuse detection, server-side money math, per-year invoice numbering with unique constraints, quote/contract state machines. |
| A05 Security misconfiguration | Helmet + CSP, non-root distroless-style containers, `server_tokens off`, security headers at both Next.js and NGINX, env validation, no default credentials (seed password is documented and overridable). |
| A06 Vulnerable components | Minimal, mainstream dependencies; CI builds fail on broken lockfiles; `pnpm audit` in the release checklist. No third-party runtime CDNs — everything is bundled. |
| A07 Auth failures | Rate limits on auth (5/min) + global throttling + NGINX zones; 2FA; session management; audit log entries for login, failures, resets, 2FA changes. |
| A08 Integrity failures | Images built from source in CI; migrations reviewed in PRs; uploads stored with random names, extension blocklist (`.exe`, `.js`, `.svg`, …), size caps, and `nosniff` downloads as attachments. |
| A09 Logging failures | Structured pino logs with `authorization`/`cookie` redaction; an immutable `AuditLog` of every authenticated mutation (sensitive body fields stripped); admin UI for review. |
| A10 SSRF | The platform makes **no outbound HTTP requests** by design (SMTP only). User-supplied URLs are stored/displayed, never fetched; the markdown renderer drops non-http(s) hrefs. |

## Frontend protections

- React escaping everywhere; the markdown renderer builds React nodes and **never** uses
  `dangerouslySetInnerHTML`, so raw HTML in content is inert (covered by tests).
- CSRF: state-changing APIs require the Bearer header (not readable cross-site); the refresh
  cookie is `SameSite=Strict` and path-scoped. CORS restricted to `CORS_ORIGINS` with credentials.
- Access tokens live in `sessionStorage` (tab-scoped), not long-lived storage.

## Secrets management

All secrets come from environment variables (`.env` is git-ignored; `.env.example` documents
them). Rotate JWT secrets to force global re-login. `ENCRYPTION_KEY` rotation requires
re-encrypting `twoFactorSecret` values — plan a maintenance window.

## Reporting a vulnerability

Email **security@vesion.dev**. We acknowledge within 48 hours, keep you informed, and credit
researchers who follow coordinated disclosure. Please avoid accessing other tenants' data while
testing.
