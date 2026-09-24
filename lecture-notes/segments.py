"""A caption segment and helpers for converting timestamps."""

import re
from dataclasses import dataclass

TIMESTAMP_PATTERN = re.compile(r"(?:(\d+):)?(\d{1,2}):(\d{2})")


@dataclass(frozen=True)
class Segment:
    start: float  # seconds from the start of the video
    text: str


def parse_timestamp(text: str) -> int | None:
    """'0:07' -> 7, '12:05' -> 725, '1:02:03' -> 3723; None if text isn't a timestamp."""
    match = TIMESTAMP_PATTERN.fullmatch(text.strip())
    if not match:
        return None
    hours, minutes, seconds = (int(part) if part else 0 for part in match.groups())
    if seconds >= 60 or (match.group(1) and minutes >= 60):
        return None
    return hours * 3600 + minutes * 60 + seconds


def format_timestamp(seconds: float) -> str:
    """7 -> '0:07', 725 -> '12:05', 3723 -> '1:02:03'."""
    total = int(seconds)
    hours, rest = divmod(total, 3600)
    minutes, secs = divmod(rest, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"
