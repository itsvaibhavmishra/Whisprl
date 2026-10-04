#!/usr/bin/env python3
"""Moving the devlog into the changelog, as pure text.

release.sh does the git and the network; everything here can be reasoned about by reading it.

    changelog.py read                       counts per heading, exit 1 if the devlog is empty
    changelog.py release <version> <repo>   rewrite CHANGELOG.md and blank devlog.txt
    changelog.py section <version>          the changelog section for one version
"""

import datetime
import re
import sys
from pathlib import Path

HEADINGS = ("New", "Improvements", "Fixed", "Developers", "Internal")

ROOT = Path(__file__).resolve().parent.parent
CHANGELOG = ROOT / "CHANGELOG.md"
DEVLOG = ROOT / "devlog.txt"


def read_devlog(text):
    """Everything written under each heading since the last release, empty ones dropped."""
    sections = {heading: [] for heading in HEADINGS}
    current = None
    for line in text.split("\n"):
        if line.lstrip().startswith("#"):
            continue
        stripped = line.strip()
        opening = next((h for h in HEADINGS if stripped == f"- {h}:"), None)
        if opening:
            current = opening
            continue
        if current and stripped.startswith("- "):
            sections[current].append(stripped[2:].strip())
    return [(h, entries) for h, entries in sections.items() if entries]


def blank_devlog(text):
    """Keep the explanatory header, drop everything written under the headings."""
    header = text[: text.index("  - New:")]
    return header + "\n".join(f"  - {heading}:\n" for heading in HEADINGS)


def build_entry(version, date, sections):
    lines = [f"## [{version}] - {date}", ""]
    for heading, entries in sections:
        lines += [f"### {heading}", ""] + [f"- {entry}" for entry in entries] + [""]
    # The next heading needs a blank line before it, or the two sections run together.
    return "\n".join(lines + [""])


LINK_LINE = re.compile(r"^\[[^\]]+\]: \S+$")


def split_links(changelog):
    """The changelog split from its trailing block of reference links."""
    lines = changelog.rstrip().split("\n")
    cut = len(lines)
    while cut > 0 and (LINK_LINE.match(lines[cut - 1]) or not lines[cut - 1].strip()):
        cut -= 1
    links = [line for line in lines[cut:] if LINK_LINE.match(line)]
    return "\n".join(lines[:cut]).rstrip(), links


def with_release(changelog, entry, version, repo):
    """The new section above the previous release, and its reference link above the others."""
    body, links = split_links(changelog)
    first = body.find("## [")
    if first == -1:
        # No release yet: append below the preamble, dropping the placeholder comment.
        body = re.sub(r"<!-- Nothing has been released.*?-->\n?", "", body, flags=re.S)
        body = body.rstrip() + "\n\n" + entry
    else:
        body = body[:first] + entry + re.sub(r"\n*$", "\n", body[first:])

    # Newest first, matching the order the sections above are in.
    links.insert(0, f"[{version}]: {repo}/releases/tag/v{version}")
    return body.rstrip() + "\n\n" + "\n".join(links) + "\n"


def section_for(changelog, version):
    """The changelog section for one version, used as the body of the release PR."""
    start = changelog.find(f"## [{version}]")
    if start == -1:
        return ""
    rest = changelog[start:]
    following = rest.find("\n## [", 1)
    section = rest if following == -1 else rest[:following]
    # The oldest section runs into the reference-link block at the foot of the file, which
    # would otherwise end up in the release notes and the pull request body.
    lines = section.split("\n")[1:]
    kept = []
    for line in lines:
        if LINK_LINE.match(line):
            break
        kept.append(line)
    return "\n".join(kept).strip()


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else ""

    if command == "read":
        sections = read_devlog(DEVLOG.read_text())
        if not sections:
            print("devlog.txt is empty, so there is nothing to release.", file=sys.stderr)
            return 1
        for heading, entries in sections:
            print(f"  {heading}: {len(entries)}")
        return 0

    if command == "count":
        sections = read_devlog(DEVLOG.read_text())
        print(sum(len(entries) for _, entries in sections))
        return 0

    if command == "release":
        version, repo = sys.argv[2], sys.argv[3]
        devlog = DEVLOG.read_text()
        sections = read_devlog(devlog)
        if not sections:
            print("devlog.txt is empty, so there is nothing to release.", file=sys.stderr)
            return 1
        # The local date, not UTC. A release cut just after midnight was being dated
        # yesterday, which nobody notices until they read the changelog a year later.
        today = datetime.date.today().isoformat()
        entry = build_entry(version, today, sections)
        CHANGELOG.write_text(with_release(CHANGELOG.read_text(), entry, version, repo))
        DEVLOG.write_text(blank_devlog(devlog))
        for heading, entries in sections:
            print(f"  {heading}: {len(entries)}")
        return 0

    if command == "section":
        print(section_for(CHANGELOG.read_text(), sys.argv[2]))
        return 0

    print(__doc__, file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
