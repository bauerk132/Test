"""Read a transcript that was copy-pasted from YouTube's "Show transcript" panel."""

from pathlib import Path

from segments import Segment, parse_timestamp


def parse_pasted_transcript(text: str) -> list[Segment]:
    """Find the captions in a pasted YouTube page, ignoring the page noise around them."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    groups = _group_by_timestamp(lines)
    runs = _find_caption_runs(groups)
    # The transcript is the longest unbroken run; max() keeps the first one if there's a tie.
    return max(runs, key=len)


def read_transcript_file(path: str | Path) -> list[Segment]:
    """Read a pasted YouTube transcript from a text file and return its captions."""
    # "utf-8-sig" also removes the invisible marker (BOM) that Notepad may put at the start.
    text = Path(path).read_text(encoding="utf-8-sig")
    segments = parse_pasted_transcript(text)
    if not segments:
        raise ValueError(
            f"No timestamped captions found in {path}. On YouTube, click 'Show transcript' "
            "and copy the transcript panel so the timestamps are included."
        )
    return segments


def _group_by_timestamp(lines: list[str]) -> list[tuple[int | None, list[str]]]:
    """Pair each timestamp with the text lines after it (text before any timestamp gets None)."""
    groups = []
    current_start = None
    current_text_lines = []
    for line in lines:
        seconds = parse_timestamp(line)
        if seconds is None:
            current_text_lines.append(line)
            continue
        groups.append((current_start, current_text_lines))
        current_start = seconds
        current_text_lines = []
    groups.append((current_start, current_text_lines))
    return groups


def _find_caption_runs(groups: list[tuple[int | None, list[str]]]) -> list[list[Segment]]:
    """Split the groups into runs of back-to-back captions."""
    runs = []
    current_run = []
    for start, text_lines in groups:
        if not text_lines:
            # An empty caption, like "0:00" directly followed by "0:01". Skip it but keep the run.
            continue
        if start is None or len(text_lines) > 1:
            # Page noise: text with no timestamp, or a timestamp followed by several lines.
            runs.append(current_run)
            current_run = []
            continue
        if current_run and start < current_run[-1].start:
            # Time jumped backwards, so this caption starts a new run.
            runs.append(current_run)
            current_run = []
        current_run.append(Segment(start, text_lines[0]))
    runs.append(current_run)
    return runs
