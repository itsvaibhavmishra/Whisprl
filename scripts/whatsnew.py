#!/usr/bin/env python3
"""Stamping the upcoming What's new highlights with their release, as pure text.

release.sh does the git; everything here can be reasoned about by reading it.

    whatsnew.py release <version>   turn the upcoming highlights into a dated release, if there are any
    whatsnew.py check               exit 1 while highlights are still waiting for a release
"""

import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WHATS_NEW = ROOT / "frontend" / "src" / "sections" / "whats-new" / "releases.json"


def released(content, version, date):
    """The upcoming highlights become the newest release, and a release without any adds nothing."""
    if not content["upcoming"]:
        return content
    release = {"version": version, "date": date, "highlights": content["upcoming"]}
    return {"upcoming": [], "releases": [release, *content["releases"]]}


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    content = json.loads(WHATS_NEW.read_text())

    if command == "release" and len(sys.argv) == 3:
        # The local date, as the changelog uses, so both agree on the day of the release.
        today = datetime.date.today().isoformat()
        WHATS_NEW.write_text(json.dumps(released(content, sys.argv[2], today), ensure_ascii=False, indent=2) + "\n")
    elif command == "check":
        if content["upcoming"]:
            print(f"{WHATS_NEW.relative_to(ROOT)} still has upcoming highlights, so they would not show for this release.")
            sys.exit(1)
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
