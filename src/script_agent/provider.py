"""OpenRouter provider for the Script Agent.

Single LLM call per run using deepseek/deepseek-v4-pro (configurable).
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass

import httpx

DEFAULT_MODEL = "deepseek/deepseek-v4-pro"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


@dataclass(frozen=True)
class VisualBeat:
    timestamp: str
    description: str


@dataclass(frozen=True)
class ScriptPackage:
    topic: str
    angle: str
    narration: str
    visual_beats: list[VisualBeat]
    duration_estimate_s: int
    target_audience: str


class ProviderError(Exception):
    """Raised when the LLM call fails."""


def _model() -> str:
    return os.environ.get("SCRIPT_MODEL", DEFAULT_MODEL)


def _temperature() -> float:
    try:
        return float(os.environ.get("SCRIPT_TEMPERATURE", "0.3"))
    except ValueError:
        return 0.3


def _max_duration_s() -> int:
    try:
        return int(os.environ.get("SCRIPT_MAX_DURATION_S", "90"))
    except ValueError:
        return 90


def _min_duration_s() -> int:
    try:
        return int(os.environ.get("SCRIPT_MIN_DURATION_S", "60"))
    except ValueError:
        return 60


def _api_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise ProviderError("OPENROUTER_API_KEY environment variable is not set")
    return key


def _build_prompt(topic: str, angle_seed: str | None) -> str:
    min_dur = _min_duration_s()
    max_dur = _max_duration_s()

    min_words = int(min_dur * 2.25)  # ~135 words for 60s
    max_words = int(max_dur * 2.5)   # ~225 words for 90s

    angle_line = (
        f'Consider this angle seed: "{angle_seed}"\n'
        if angle_seed
        else "Invent a compelling teaching angle for this topic.\n"
    )

    return (
        f'Topic: "{topic}"\n\n'
        f"{angle_line}\n"
        "Produce a teaching script for a 60-90 second technical education clip "
        "targeted at software developers preparing for interviews.\n\n"
        "Requirements:\n"
        f"- Narration: {min_words}-{max_words} words of speakable prose. No markdown, "
        "no bullet lists, no parentheticals.\n"
        "- Visual beats: at least 4 entries covering the full timeline, each with "
        'a "timestamp" (M:SS from start) and "description" (what appears on screen).\n'
        f"- Duration estimate: {min_dur}-{max_dur} seconds.\n"
        "- Content: concrete and concept-driven. Assume coding knowledge but explain "
        "the target concept from first principles. Include at least one code example "
        "or developer-recognizable analogy.\n"
        "- Close with key takeaways phrased for interview recall.\n\n"
        "Return ONLY a JSON object with these keys:\n"
        '- "angle": the refined/authoritative teaching angle (string)\n'
        '- "narration": the full narration draft (string)\n'
        '- "visual_beats": array of {"timestamp": "M:SS", "description": "..."}\n'
        '- "duration_estimate_s": integer\n'
        '- "target_audience": string\n'
        "No other text."
    )


def _parse_response(raw: str, topic: str) -> ScriptPackage:
    parsed: dict[str, object]
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise ProviderError(f"LLM returned unparseable output: {raw}")

    if not isinstance(parsed, dict):
        raise ProviderError(f"LLM returned non-object output: {raw}")

    required = {"angle", "narration", "visual_beats", "duration_estimate_s", "target_audience"}
    missing = required - set(parsed)
    if missing:
        raise ProviderError(
            f"LLM response missing required fields: {', '.join(sorted(missing))}"
        )

    angle = parsed["angle"]
    narration = parsed["narration"]
    visual_beats_raw = parsed["visual_beats"]
    duration_estimate_s = parsed["duration_estimate_s"]
    target_audience = parsed["target_audience"]

    if not isinstance(angle, str) or not angle.strip():
        raise ProviderError("angle must be a non-empty string")
    if not isinstance(narration, str) or not narration.strip():
        raise ProviderError("narration must be a non-empty string")
    if not isinstance(visual_beats_raw, list) or len(visual_beats_raw) < 4:
        raise ProviderError(
            f"visual_beats must be an array with at least 4 entries, got {len(visual_beats_raw) if isinstance(visual_beats_raw, list) else type(visual_beats_raw).__name__}"
        )
    if not isinstance(duration_estimate_s, (int, float)):
        raise ProviderError(
            f"duration_estimate_s must be a number, got {type(duration_estimate_s).__name__}"
        )
    if not isinstance(target_audience, str) or not target_audience.strip():
        raise ProviderError("target_audience must be a non-empty string")

    # Validate visual beats
    visual_beats: list[VisualBeat] = []
    for i, vb in enumerate(visual_beats_raw):
        if not isinstance(vb, dict):
            raise ProviderError(f"visual_beats[{i}] must be an object, got {type(vb).__name__}")
        ts = vb.get("timestamp")
        desc = vb.get("description")
        if not isinstance(ts, str) or not ts.strip():
            raise ProviderError(f"visual_beats[{i}].timestamp must be a non-empty string")
        if not isinstance(desc, str) or not desc.strip():
            raise ProviderError(f"visual_beats[{i}].description must be a non-empty string")
        visual_beats.append(VisualBeat(timestamp=ts, description=desc))

    dur_s = int(duration_estimate_s)

    return ScriptPackage(
        topic=topic,
        angle=angle,
        narration=narration,
        visual_beats=visual_beats,
        duration_estimate_s=dur_s,
        target_audience=target_audience,
    )


def call_llm(topic: str, angle_seed: str | None) -> ScriptPackage:
    model = _model()
    prompt = _build_prompt(topic, angle_seed)

    system_prompt = (
        "You are a technical education scriptwriter. "
        "Write concise, engaging teaching scripts for short-form video. "
        "Output only valid JSON."
    )

    headers = {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": _temperature(),
        "max_tokens": 2048,
    }

    try:
        response = httpx.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=60.0,
        )
        response.raise_for_status()
        body = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise ProviderError(f"model not available: {model}") from exc
        raise ProviderError(f"OpenRouter API call failed: {exc}") from exc
    except httpx.HTTPError as exc:
        raise ProviderError(f"OpenRouter API call failed: {exc}") from exc

    raw = body["choices"][0]["message"]["content"]
    return _parse_response(raw, topic)
