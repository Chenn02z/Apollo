"""Core timeline logic: parse input, call LLM, inject visual_instruction, validate."""

from __future__ import annotations

from typing import Any

from .provider import ModelNotAvailableError, ProviderError, call_llm


class TimelineError(Exception):
    """Expected timeline generation or validation failure."""


def _normalize_ws(text: str) -> str:
    return " ".join(text.split())


def generate_timeline(input_obj: dict[str, Any]) -> dict[str, Any]:
    """Generate a narrated timeline draft from a script package.

    Args:
        input_obj: Dict with keys topic, angle, narration, visual_beats,
                   duration_estimate_s, target_audience.

    Returns:
        A dict representing the narrated timeline draft.

    Raises:
        TimelineError: For invalid input, LLM failure, or contract violation.
    """
    if not isinstance(input_obj, dict):
        raise TimelineError("input must be a JSON object")

    # --- Validate required fields ---
    required = {
        "topic", "angle", "narration", "visual_beats",
        "duration_estimate_s", "target_audience",
    }
    missing = required - set(input_obj)
    if missing:
        raise TimelineError(
            f"input missing required fields: {', '.join(sorted(missing))}"
        )

    topic = input_obj["topic"]
    angle = input_obj["angle"]
    narration = input_obj["narration"]
    visual_beats = input_obj["visual_beats"]
    duration_estimate_s = input_obj["duration_estimate_s"]
    target_audience = input_obj["target_audience"]

    if not isinstance(topic, str) or not topic.strip():
        raise TimelineError("topic must be a non-empty string")
    if not isinstance(angle, str) or not angle.strip():
        raise TimelineError("angle must be a non-empty string")
    if not isinstance(narration, str) or not narration.strip():
        raise TimelineError("narration must be a non-empty string")
    if not isinstance(visual_beats, list) or len(visual_beats) == 0:
        raise TimelineError("visual_beats must be a non-empty array")
    if not isinstance(duration_estimate_s, (int, float)):
        raise TimelineError(
            f"duration_estimate_s must be a number, got {type(duration_estimate_s).__name__}"
        )
    if not isinstance(target_audience, str) or not target_audience.strip():
        raise TimelineError("target_audience must be a non-empty string")

    duration_estimate_s = int(duration_estimate_s)

    # Validate visual_beats entries
    for i, vb in enumerate(visual_beats):
        if not isinstance(vb, dict):
            raise TimelineError(
                f"visual_beats[{i}] must be an object, got {type(vb).__name__}"
            )
        ts = vb.get("timestamp")
        desc = vb.get("description")
        if not isinstance(ts, str) or not ts.strip():
            raise TimelineError(f"visual_beats[{i}].timestamp must be a non-empty string")
        if not isinstance(desc, str) or not desc.strip():
            raise TimelineError(f"visual_beats[{i}].description must be a non-empty string")

    # --- Call LLM with one retry ---
    vb_list: list[dict[str, str]] = [
        {"timestamp": vb["timestamp"], "description": vb["description"]}
        for vb in visual_beats
    ]

    try:
        draft_raw = call_llm(narration, vb_list, duration_estimate_s)
    except ModelNotAvailableError as exc:
        raise TimelineError(str(exc)) from exc  # fail fast, never retry
    except ProviderError:
        try:
            draft_raw = call_llm(narration, vb_list, duration_estimate_s)
        except ModelNotAvailableError as exc:
            raise TimelineError(str(exc)) from exc  # fail fast, never retry
        except ProviderError as exc:
            raise TimelineError(str(exc)) from exc

    # --- Validate segment count before injection ---
    num_beats = len(visual_beats)
    num_segments = len(draft_raw.timeline_segments)
    if num_segments != num_beats:
        raise TimelineError(
            f"segment count {num_segments} does not equal visual_beats length {num_beats}"
        )

    # --- Inject visual_instruction from visual_beats description ---
    timeline_segments: list[dict[str, Any]] = []
    for i, seg in enumerate(draft_raw.timeline_segments):
        timeline_segments.append({
            "start_s": seg.start_s,
            "end_s": seg.end_s,
            "narration_text": seg.narration_text,
            "visual_instruction": visual_beats[i]["description"],
            "subtitle_text": seg.subtitle_text,
        })

    result: dict[str, Any] = {
        "topic": topic,
        "angle": angle,
        "narration": narration,
        "visual_beats": [
            {"timestamp": vb["timestamp"], "description": vb["description"]}
            for vb in visual_beats
        ],
        "duration_estimate_s": duration_estimate_s,
        "target_audience": target_audience,
        "timeline_segments": timeline_segments,
    }

    # --- Validate the complete draft ---
    validate_timeline_draft(result, input_obj)

    return result


def validate_timeline_draft(
    draft: dict[str, Any],
    input_obj: dict[str, Any],
) -> None:
    """Validate a narrated timeline draft against all spec contracts.

    Raises TimelineError on any violation.
    """
    input_narration: str = input_obj["narration"]
    input_visual_beats: list[dict[str, Any]] = input_obj["visual_beats"]
    input_duration_estimate_s: int = int(input_obj["duration_estimate_s"])
    input_target_audience: str = input_obj["target_audience"]
    input_topic: str = input_obj["topic"]
    input_angle: str = input_obj["angle"]

    # Passthrough field preservation (checked first)
    if draft.get("topic") != input_topic:
        raise TimelineError("topic was mutated")
    if draft.get("angle") != input_angle:
        raise TimelineError("angle was mutated")
    if draft.get("narration") != input_narration:
        raise TimelineError("narration was mutated")
    if draft.get("target_audience") != input_target_audience:
        raise TimelineError("target_audience was mutated")
    if draft.get("duration_estimate_s") != input_duration_estimate_s:
        raise TimelineError("duration_estimate_s was mutated")

    segments = draft.get("timeline_segments")
    if not isinstance(segments, list) or len(segments) == 0:
        raise TimelineError("timeline_segments must be a non-empty array")

    # One segment per visual beat
    num_beats = len(input_visual_beats)
    if len(segments) != num_beats:
        raise TimelineError(
            f"segment count {len(segments)} does not equal visual_beats length {num_beats}"
        )

    # Contiguity: first start_s == 0.0, each start_s == prior end_s,
    # and every segment has positive duration (end_s > start_s).
    for i, seg in enumerate(segments):
        if not isinstance(seg, dict):
            raise TimelineError(f"timeline_segments[{i}] must be an object")

        start_s = seg.get("start_s")
        end_s = seg.get("end_s")

        if not isinstance(start_s, (int, float)):
            raise TimelineError(f"timeline_segments[{i}].start_s must be a number")
        if not isinstance(end_s, (int, float)):
            raise TimelineError(f"timeline_segments[{i}].end_s must be a number")

        if end_s <= start_s:
            raise TimelineError(
                f"timeline_segments[{i}] has non-positive duration: "
                f"start_s={start_s}, end_s={end_s}"
            )

        if i == 0:
            if start_s != 0.0:
                raise TimelineError(
                    f"first segment start_s must be 0.0, got {start_s}"
                )
        else:
            prior_end = segments[i - 1]["end_s"]
            if start_s != prior_end:
                raise TimelineError(
                    f"timeline_segments[{i}].start_s ({start_s}) "
                    f"does not equal prior end_s ({prior_end})"
                )

    # Final end_s within 1s of duration estimate
    final_end_s = segments[-1]["end_s"]
    if abs(final_end_s - input_duration_estimate_s) > 1.0:
        raise TimelineError(
            f"final end_s ({final_end_s}) is not within 1s of "
            f"duration_estimate_s ({input_duration_estimate_s})"
        )

    # visual_instruction must match corresponding visual_beats[].description
    for i, seg in enumerate(segments):
        vi = seg.get("visual_instruction")
        expected_desc = input_visual_beats[i]["description"]
        if vi != expected_desc:
            raise TimelineError(
                f"timeline_segments[{i}].visual_instruction does not match "
                f"visual_beats[{i}].description"
            )

    # Narration preservation: concatenated narration_text (normalized) == input (normalized)
    concat = " ".join(
        seg.get("narration_text", "") for seg in segments
    )
    if _normalize_ws(concat) != _normalize_ws(input_narration):
        raise TimelineError(
            "concatenated narration_text does not equal input narration "
            "(whitespace-normalized)"
        )

    # Subtitle mirroring: subtitle_text == narration_text per segment
    for i, seg in enumerate(segments):
        nt = seg.get("narration_text")
        st = seg.get("subtitle_text")
        if not isinstance(st, str) or not isinstance(nt, str) or st != nt:
            raise TimelineError(
                f"timeline_segments[{i}].subtitle_text does not equal narration_text"
            )

    # visual_beats passthrough shape check
    vb = draft.get("visual_beats")
    if not isinstance(vb, list) or len(vb) != num_beats:
        raise TimelineError("visual_beats passthrough mismatch")
    for i, beat in enumerate(vb):
        if not isinstance(beat, dict):
            raise TimelineError(f"visual_beats[{i}] must be an object in output")
        if beat.get("timestamp") != input_visual_beats[i]["timestamp"]:
            raise TimelineError(f"visual_beats[{i}].timestamp was mutated")
        if beat.get("description") != input_visual_beats[i]["description"]:
            raise TimelineError(f"visual_beats[{i}].description was mutated")

