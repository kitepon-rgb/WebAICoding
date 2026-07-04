# ADR 0001: Hugo Static Site with In-Repository Theme and GitHub Pages Deploy

## Status

Accepted

## Context

The repository is a Japanese technical blog built with Hugo. README.md and CLAUDE.md describe the site as a Hugo static site hosted on GitHub Pages. They also state that the theme is custom and lives inside this repository under `layouts/` and `assets/`, so no external Hugo theme submodule is required.

## Decision

Use Hugo extended as the static site generator, keep the theme in this repository, and deploy the generated site to GitHub Pages through GitHub Actions.

## Consequences

- Local production verification uses `hugo --minify`, matching `.github/workflows/deploy.yml`.
- Theme changes are ordinary repository changes under `layouts/` and `assets/`.
- External theme submodule setup is intentionally unnecessary.
