### Description

<!-- What changed, and why. The why is the part that is hard to recover later. -->

### Screenshots or Video

<!-- Anything that changes what a screen looks like. -->

### Devlog

<!-- Required for a pull request into rc. Add your line to devlog.txt under the heading
     that matches who the change is for, and tick the box below.
     Not required for rc into production: the release prep has already moved the whole devlog
     into CHANGELOG.md by then. -->

- [ ] `devlog.txt` updated, or this is an rc into production pull request
- [ ] Anything worth a highlight is in What's new's `upcoming` list, or nothing here is

### Release

<!-- Only meaningful on an rc into production pull request, because merging into production is what
     publishes. -->

- [ ] Not a release, so this pull request carries the `skip release` label

### Checklist

- [ ] `scripts/check.sh` passes, and I gated on its exit code rather than reading its output
- [ ] Screenshots are up to date with the latest push
- [ ] Checked at mobile and desktop widths, or the change has no UI
