"""Core ideation logic: validate, call LLM, return structured output."""

from __future__ import annotations

import os
import sys
from typing import Any

from .provider import ProviderError, generate_topics


class IdeationError(Exception):
    """Expected ideation failure."""


def _default_topic_count() -> int:
    try:
        return int(os.environ.get("IDEATION_TOPIC_COUNT", "1"))
    except ValueError:
        return 1


def ideate(concept: str, topic_count: int | None = None) -> dict[str, str] | list[dict[str, str]]:
    if not concept.strip():
        raise IdeationError("concept must be non-empty")

    count = topic_count if topic_count is not None else _default_topic_count()
    if count < 1:
        raise IdeationError("topic_count must be at least 1")

    try:
        topics = generate_topics(concept, topic_count=count)
    except ProviderError as exc:
        try:
            topics = generate_topics(concept, topic_count=count)
        except ProviderError:
            raise IdeationError(str(exc)) from exc

    if len(topics) < count:
        print(
            f"warning: requested {count} topics, received {len(topics)}",
            file=sys.stderr,
        )

    results: list[dict[str, str]] = [
        {"topic": t.topic, "angle": t.angle} for t in topics
    ]

    if count == 1:
        return results[0]
    return results
