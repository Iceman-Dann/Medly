# Contributing to Medly

Medly is open to contributions. This guide gets you from zero to contributing in minutes.

---

## Quick Start

```bash
# Fork and clone
git clone https://github.com/your-username/Medly.git
cd Medly

# Install
npm install

# Environment
cp .env.example .env.local
# Add your API keys to .env.local

# Run
npm run dev
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | New features |
| `bugfix/*` | Bug fixes |
| `hotfix/*` | Critical fixes |

---

## Commit Format

```
type(scope): description

feat(ai): add symptom pattern detection
fix(ui): resolve mobile layout issue
docs(readme): update quick start guide
```

| Type | When |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Code cleanup |
| `test` | Tests |
| `chore` | Build/dependencies |

---

## Code Standards

- **TypeScript** — strict mode, no `any`
- **Prettier** — auto-formatting enforced
- **ESLint** — must pass before PR
- **Functional components** — hooks only, no class components
- **Error boundaries** — required on all async operations

---

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## Pull Request Process

1. Test your changes thoroughly
2. Ensure all tests pass — `npm test`
3. Lint your code — `npm run lint`
4. Type check — `npm run type-check`
5. Open PR against `develop` not `main`

**PR description must include:**
- What changed and why
- How to test it
- Screenshots if UI changed

---

## Bug Reports

Open an issue on [GitHub](https://github.com/Iceman-Dann/Medly/issues) with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser + OS + version
- Screenshots if applicable

---

## Feature Requests

Open an issue on [GitHub](https://github.com/Iceman-Dann/Medly/issues) with:

- What problem it solves
- Proposed solution
- Alternatives considered

---

## Security

**Never commit API keys or secrets.** Use environment variables always.

For security vulnerabilities — open a private GitHub issue. Do not post publicly.

---

## Getting Help

- **GitHub Issues** — bugs and features
- **GitHub Discussions** — general questions

---

## License

By contributing, you agree your contributions are licensed under the same [MIT License](https://opensource.org/licenses/MIT) as this project.

---

*Every contribution helps make healthcare more intelligent for everyone.*
