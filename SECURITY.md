# Security Policy

Security isn't a feature in Medly — it's the foundation. We handle sensitive health data. Trust is everything.

---

## Architecture

Medly is built on a zero-knowledge design:

| Principle | Implementation |
|---|---|
| Local-first processing | AI analysis happens client-side |
| Encrypted storage | Data encrypted before it's ever stored |
| No server access | Servers cannot read user health data |
| User control | Users own and control all their data |

```mermaid
graph LR
    A[User Input] --> B[Client Encryption]
    B --> C[Local Processing]
    C --> D[Encrypted Storage]
    D --> E[User-Only Access]
    
    style A fill:#1a1a1a
    style B fill:#2d2d2d
    style C fill:#404040
    style D fill:#535353
    style E fill:#666666
```

---

## Encryption Standards

| Standard | Usage |
|---|---|
| AES-256 | Data at rest |
| TLS 1.3 | Data in transit |
| PBKDF2 | Key derivation |
| Auto PII redaction | Before any external API call |

---

## Compliance

| Standard | Status |
|---|---|
| HIPAA | Ready by architecture |
| GDPR | Ready by architecture |
| OWASP Top 10 | Implemented |

---

## Data Protection

- **Anonymous mode** — full functionality without an account
- **Local-first** — primary storage on the user's device
- **Optional sync** — user-controlled cloud synchronization
- **Right to deletion** — complete data removal on request
- **No data selling** — ever

---

## Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public issue.**

Open a private [GitHub Security Advisory](https://github.com/Iceman-Dann/Medly/security/advisories/new) instead.

We respond within 24 hours. Critical issues within 4 hours.

---

## Secure Development Practices

- TypeScript strict mode — no `any`
- Dependency scanning on every commit
- Secret detection in CI/CD pipeline
- Security-focused code reviews on all PRs
- Environment variables for all sensitive config — never hardcoded

---

## Incident Response

| Severity | Response Time |
|---|---|
| Critical | Within 4 hours |
| High | Within 24 hours |
| Medium | Within 72 hours |
| Low | Next release cycle |

---

*Effective February 2026. Reviewed and updated regularly.*
