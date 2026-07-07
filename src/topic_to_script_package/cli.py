"""Command-line interface for topic-to-script-package."""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence

from .package import TopicToScriptError, build_script_package


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="topic-to-script-package",
        description="Emit a v1 script-package JSON document for one topic.",
    )
    parser.add_argument("topic", nargs="+", help="technical topic to explain")
    args = parser.parse_args(argv)

    topic = " ".join(args.topic)
    try:
        package = build_script_package(topic)
        sys.stdout.write(
            json.dumps(package, ensure_ascii=False, separators=(",", ":"))
        )
    except TopicToScriptError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        print(f"error: failed to generate script package: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
