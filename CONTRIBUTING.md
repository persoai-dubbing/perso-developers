# Contributing

Thanks for your interest in contributing to the Perso Developer Portal! This document describes how to get a working dev environment and what we expect from contributions.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to the maintainers.

## Reporting issues

- **Bugs:** open a [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) issue.
- **Features:** open a [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) issue and describe the problem before proposing a solution.
- **Security:** see [SECURITY.md](SECURITY.md). Do not file public issues for sensitive vulnerabilities.

Search existing issues before opening a new one — duplicates slow us down.

## Development setup

### Prerequisites

- **Node.js** 20 or later
- **pnpm** 9 or later (`npm install -g pnpm`)
- A Perso AI API key for local testing (see [README](README.md#1-get-an-api-key))

### Getting started

```bash
git clone https://github.com/persoai-dubbing/perso-developers.git
cd perso-developers
pnpm install
cp .env.example .env.local
# fill in the values in .env.local
pnpm dev
```

The portal will be available at `http://localhost:3000`.

### Useful scripts

```bash
pnpm dev      # start the dev server
pnpm build    # production build
pnpm start    # run the production build
pnpm lint     # run eslint
```

Run a TypeScript check with:

```bash
pnpm exec tsc --noEmit
```

## Making changes

1. **Branch from `main`.** Use a descriptive name (e.g. `fix/dubbing-error-toast`, `feat/api-key-rotation`).
2. **Keep changes focused.** One PR per logical change. If you find unrelated issues, open separate PRs.
3. **Match the existing style.** Follow the patterns already in the codebase; let `pnpm lint` guide you.
4. **Don't commit secrets.** Never commit API keys, tokens, or `.env*` files.
5. **Test locally** before opening a PR — at minimum, `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` should pass.

## Pull requests

- Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md) — it helps reviewers understand the change quickly.
- Link related issues with `Closes #123` / `Fixes #123` in the description.
- Include screenshots or short clips for UI changes.
- Keep PRs as small as practical. Large PRs take longer to review and are more likely to introduce regressions.
- CI must pass before review. If CI is flaky, mention it in the PR.

### Commit messages

We don't enforce a strict format, but clear messages help. A good rule of thumb:

```
<short summary in imperative mood>

<optional body explaining the why, not the what>
```

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
