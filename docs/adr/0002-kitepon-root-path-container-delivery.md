# ADR 0002: Serve the Hugo blog from the kitepon.dev root path

## Status

Accepted

## Context

The blog is a content surface of the `kitepon.dev` master brand. Serving it from the
separate `blog.kitepon.dev` GitHub Pages site kept the canonical URL, brand navigation,
and production routing outside the root site.

The Hugo content and its Zenn/dev.to pipeline remain useful and should not be coupled to
the root site's application image.

## Decision

- Keep Hugo extended as the static site generator and keep the theme in this repository.
- Use `https://kitepon.dev/blog/` as Hugo's canonical `baseURL`.
- Build a dedicated non-root nginx image with `Dockerfile`.
- Route `/blog*` from the root site's Caddy edge to the blog container.
- Keep `blog.kitepon.dev/*` as a permanent Cloudflare redirect to `/blog/*`.
- Use GitHub Actions to validate content and the Hugo build, not to deploy GitHub Pages.

## Consequences

- Blog releases and root-site application releases remain independently buildable.
- Existing links and externally embedded images continue working through the permanent redirect.
- Production publishing requires updating the running blog container after a validated main commit.
- ADR 0001's GitHub Pages deployment decision is superseded; its in-repository theme decision remains.
