"""OpenRouter provider for the Ideation Agent.

Single LLM call per run using deepseek/deepseek-v4-flash (configurable).
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass

import httpx

DEFAULT_MODEL = "deepseek/deepseek-v4-flash"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


@dataclass(frozen=True)
class Topic:
    topic: str
    angle: str


class ProviderError(Exception):
    """Raised when the LLM call fails."""


def _model() -> str:
    return os.environ.get("IDEATION_MODEL", DEFAULT_MODEL)


def _api_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise ProviderError("OPENROUTER_API_KEY environment variable is not set")
    return key


def generate_topics(concept: str, topic_count: int = 1) -> list[Topic]:
    if topic_count < 1:
        raise ProviderError("topic_count must be at least 1")

    model = _model()

    system_prompt = (
        "You are a technical education content strategist. "
        "Given a vague concept, produce concrete short-form video topics "
        "suitable for a 60-90 second TikTok technical education clip. "
        "Each topic must include a one-line teaching angle. "
        "Rank topics by suitability for a technical education TikTok clip."
    )

    count_instruction = (
        f"Produce exactly {topic_count} topic(s)."
        if topic_count == 1
        else f"Produce exactly {topic_count} topics, ranked best first."
    )

    user_prompt = (
        f'Concept: "{concept}"\n\n'
        f"{count_instruction}\n\n"
        'Return only a JSON array of objects with "topic" and "angle" keys. '
        "No other text."
    )

    headers = {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 500 * topic_count,
    }

    try:
        response = httpx.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=30.0,
        )
        response.raise_for_status()
        body = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise ProviderError(
                f"model not available: {model}"
            ) from exc
        raise ProviderError(f"OpenRouter API call failed: {exc}") from exc
    except httpx.HTTPError as exc:
        raise ProviderError(f"OpenRouter API call failed: {exc}") from exc

    raw = body["choices"][0]["message"]["content"]

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise ProviderError(f"LLM returned unparseable output: {raw}")

    if not isinstance(parsed, list):
        raise ProviderError(f"LLM returned non-array output: {raw}")

    if not parsed:
        raise ProviderError("LLM returned zero topics")

    topics = []
    for item in parsed:
        if not isinstance(item, dict) or "topic" not in item or "angle" not in item:
            raise ProviderError(f"LLM returned malformed topic entry: {item}")
        topics.append(Topic(topic=item["topic"], angle=item["angle"]))

    return topics
