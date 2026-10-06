# Development

## What you need

- Node 22 and npm 10. CI runs Node 22.
- To run the app, not to run the gate: `backend/.env` and `frontend/.env`. Each
  package has a `.env copy` listing every key and marking which are required.
- To release: `gh` (authenticated), `git` and `python3`.

## Build and check

```sh
cd backend && npm install && npm start       # the API under nodemon, reads backend/.env
cd frontend && npm install -f && npm start   # the app via react-app-rewired, reads frontend/.env
scripts/check.sh                             # the gate
```

Run the gate before every commit and **gate on its exit code**, not on a read of its output. A
pipe into `tail` or `grep` reports the exit code of the pipe, so a failed build looks green.

## Versioning

`frontend/package.json` is the source of truth. `scripts/release.sh` writes each new
version to both packages, lockfiles included, through `npm version`, and `release-ready`
fails a release pull request where `backend/package.json` disagrees. Never edit either by
hand to cut a release.

Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html), and tags are
`v<version>`.

## Planning notes

`docs/ideas/` holds the project spec and anything else being thought through rather than
built. The `ideas/` exclude pattern matches at any depth, so nothing in it is ever committed or
pushed even though it sits under `docs/`. Treat it as the working notebook: the rest of `docs/`
is what a contributor reads.

`docs/decisions/` is local in the same way. Each decision not made yet gets one file there,
and the file is deleted once the outcome is recorded in the tracked docs. Committed files
describe only what is decided, and never link into `docs/decisions/` or `docs/ideas/`.

## Branches

`production` is what has been released. `rc` is what is going to be. Nothing is pushed to either
directly.

```
feature branch  ->  PR into rc  ->  PR from rc into production  =  a release
```

- **Cut every branch from `rc`**, not from `production`. Cutting from `production` means rebasing onto
  whatever rc already holds before the PR can merge.
- **Every PR into `rc` adds a line to `devlog.txt`**, under the heading that matches who
  the change is for. The PR template has the checkbox and the file explains the headings.
- **Merging `rc` into `production` is the release.** That PR needs no devlog line, because the
  devlog has already moved into `CHANGELOG.md` by then.

## What publishes, and what does not

- **A feature branch** publishes nothing. Push as often as you like.
- **`rc`** publishes nothing either.
- **Merging into `production` publishes** a GitHub Release tagged `v<version>`, with that version's
  changelog section as its notes. It skips that if the tag already exists, so an ordinary merge
  that did not bump the version cannot cut a duplicate. Netlify and Render deploy from the
  branches themselves, so no build is attached.
- **The `skip release` label** on an `rc` into `production` PR turns off the release-ready
  checks, for a merge that is deliberately not a release.

## Cutting a release

```sh
scripts/release.sh 0.2.0     # that version
scripts/release.sh           # asks, offering the next patch
```

That refuses a dirty tree, cuts `release/0.2.0` from `origin/rc`, moves the devlog into a
dated `CHANGELOG.md` section, bumps the version, runs the gate, commits, pushes, and opens
**both** pull requests: the prepare one into `rc`, and the release one from `rc` into
`production`. If the gate fails it deletes the branch and pushes nothing, leaving the tree as it
found it.

Merge the prepare PR, then the release PR. Nothing else is needed: `release-ready.yml` blocks
the second merge unless the version went up, the changelog has a dated section for it, the
devlog is empty and the tag is free.

```sh
scripts/skip-release.sh
```

opens an `rc` into `production` PR already labelled `skip release`, for moving work to `production`
without cutting a version. Anything left in `devlog.txt` stays there and lands in whichever
version is released next, so nothing is lost by merging one.

A version is published once. A mistake means burning a number rather than replacing it.

The scripts need `gh` (authenticated), `git` and `python3`. `scripts/changelog.py` holds the
devlog-to-changelog text transforms as pure functions, so it can be read and tested on its own;
the release workflow calls the same script for the GitHub release notes, so the notes and the
PR body cannot drift apart.

## Branch protection

The rulesets are version-controlled in `.github/rulesets/`, rather than clicked into a settings
page nobody can diff:

| Ruleset | Covers | Enforces |
|---|---|---|
| `branches-are-permanent` | `production`, `rc` | no deletion, no force-push |
| `rc-is-next` | `rc` | PR required, `check` green and up to date, signed commits |
| `production-is-released` | `production` | the same plus `ready` |

```sh
scripts/apply-rulesets.sh          # create or update each one on GitHub, matched by name
scripts/apply-rulesets.sh --show   # print what is live now, change nothing
```

Matching by name means it is safe to run repeatedly and will not stack duplicates. Before it
pushes anything it checks that every required status check corresponds to a real workflow job:
a ruleset naming a context no workflow produces blocks every merge into that branch forever.

**Apply the rulesets only after the first push.** They require a pull request and a green
`check` on `production`; applying them to an empty repository locks you out of your own
initial commit. The correct order is: create the repo, push `production`, branch `rc`, then run
the script.

## Layout

```
Whisprl/
├── backend/                 Express + Socket.io API
│   ├── server.js            HTTP server, MongoDB connection, Socket.io init
│   ├── app.js               Express middleware stack and the /api router
│   ├── socket.js            WebSocket event handlers
│   ├── vercel.json
│   └── src/                 routes, controllers, services, models, middlewares,
│                            utils, templates/mail
├── frontend/                React 18 + MUI app
│   ├── config-overrides.js  react-app-rewired overrides, including the @ alias
│   ├── public/              includes _redirects for SPA routing on Netlify
│   └── src/                 pages, sections, components, layouts, redux, routes,
│                            theme, contexts, hooks, utils
├── docs/
│   ├── development.md
│   ├── ideas/               local only, excluded
│   └── decisions/           local only, excluded
├── scripts/                 check, release, skip-release, rulesets, changelog
├── .github/                 workflows, rulesets, PR template
├── CHANGELOG.md
├── devlog.txt
├── LICENSE                  CC0 1.0
└── Readme.md
```

Where frontend code goes, inside `frontend/src/`:

- **`pages/`**: one file per route, lazy-loaded from `routes/index.js`.
- **`sections/<page>/`**: the pieces of one page, such as `sections/chat/` for the chat screen,
  split further when a page has distinct parts (`conversation/`, `messages/`, `attachments/`).
- **`components/`**: anything used by more than one page, such as `ProfileHero`, the
  image cropper and the form fields in `hook-form/`.
- **`layouts/`**, **`redux/`**, **`routes/`**, **`theme/`**, **`contexts/`**, **`hooks/`**,
  **`utils/`**: as named. Encryption lives in `utils/crypto/`.

Folders are lowercase, files are named after the component or function they export, and every
import goes through the `@/` alias, siblings included.

## Conventions

- **Comments explain why, not what.** If a comment describes what the next line does, rewrite
  the line instead. Keep each to a single line; anything longer belongs in the commit body.
- **No em dashes** in code, comments or docs. Use a colon, a comma or a full stop.
- **No single-letter names.** Not a loop index, not a lambda argument. `_` for a slot the
  language forces you to declare and the code never reads is the only exception.
- **Split a file when it stops reading cleanly**, not when it hits a line count.
- **No timelines.** No durations, deadlines or estimates for work in code, comments or docs
  unless explicitly asked.
- **Never add a dependency without justification.**
