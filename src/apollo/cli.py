"""Apollo unified CLI entry point."""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence

from concept_ideation import IdeationError, ideate
from script_agent import ScriptError, generate_script


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="apollo",
        description="Autonomous clip production workspace CLI.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    ideate_parser = subparsers.add_parser(
        "ideate",
        help="Generate video topics from a vague concept.",
    )
    ideate_parser.add_argument(
        "concept",
        help="Vague concept string (e.g. 'LLMs', 'Kubernetes').",
    )
    ideate_parser.add_argument(
        "--count",
        type=int,
        default=None,
        help="Number of topics to generate (overrides IDEATION_TOPIC_COUNT).",
    )

    script_parser = subparsers.add_parser(
        "script",
        help="Generate a teaching script package from a concrete topic.",
    )
    script_parser.add_argument(
        "input",
        help='JSON input: {"topic":"...", "angle":"..."} or "-" for stdin.',
    )

    args = parser.parse_args(argv)

    if args.command == "ideate":
        try:
            result = ideate(args.concept, topic_count=args.count)
            json.dump(result, sys.stdout, ensure_ascii=False, separators=(",", ":"))
        except IdeationError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 1
        except Exception as exc:
            print(f"error: internal failure: {exc}", file=sys.stderr)
            return 1
        return 0

    if args.command == "script":
        try:
            if args.input == "-":
                raw = sys.stdin.read()
            else:
                raw = args.input
            input_obj = json.loads(raw)
        except json.JSONDecodeError as exc:
            print(f"error: malformed input JSON: {exc}", file=sys.stderr)
            return 1

        try:
            result = generate_script(input_obj)
            json.dump(result, sys.stdout, ensure_ascii=False, separators=(",", ":"))
        except ScriptError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 1
        except Exception as exc:
            print(f"error: internal failure: {exc}", file=sys.stderr)
            return 1
        return 0

    return 1
