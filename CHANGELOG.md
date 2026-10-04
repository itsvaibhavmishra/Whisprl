# Changelog

All notable changes to Whisprl are recorded here. Each released version gets a dated
section, filled from `devlog.txt` at release time.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) loosely, and the
versioning is [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-04

### Improvements

- Renamed throughout from TwinkConnect to Whisprl: the page title and social metadata, the sidebar and welcome screens, the OTP and password reset emails, and every link

### Developers

- One gate, `scripts/check.sh`, run by CI on every pull request: loads every backend module, runs the frontend tests and builds the frontend
- Release flow: `scripts/release.sh` and `scripts/skip-release.sh`, this devlog, `CHANGELOG.md`, the `release-ready` check and version-controlled branch rulesets

### Internal

- Licence declared as CC0-1.0 in both packages, matching `LICENSE`
- `frontend/build` and `frontend/coverage` are ignored where they are actually written

[1.0.0]: https://github.com/itsvaibhavmishra/Whisprl/releases/tag/v1.0.0
