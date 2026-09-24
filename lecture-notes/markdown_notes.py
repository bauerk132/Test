"""Turn caption segments into a Markdown file of timestamped paragraphs."""

import re

from segments import Segment, format_timestamp

# A sentence ends with ".", "?" or "!", optionally followed by closing quotes
# or brackets, e.g. 'binary.', 'he said "stop!"' or '(see chapter 2.)'.
SENTENCE_END_PATTERN = re.compile(r"[.?!][\"'”’)\]]*$")


def ends_sentence(text: str) -> bool:
    """Return True if this caption text finishes a sentence."""
    return SENTENCE_END_PATTERN.search(text.rstrip()) is not None


def should_start_new_paragraph(
    paragraph: list[Segment], segment: Segment, soft_seconds: float, hard_seconds: float
) -> bool:
    """Decide whether `segment` should begin a new paragraph instead of joining `paragraph`."""
    if not paragraph:
        return False

    elapsed = segment.start - paragraph[0].start
    if elapsed >= hard_seconds:
        return True
    return elapsed >= soft_seconds and ends_sentence(paragraph[-1].text)


def group_paragraphs(
    segments: list[Segment], soft_seconds: float = 60, hard_seconds: float = 120
) -> list[list[Segment]]:
    """Group caption segments into paragraphs of roughly one to two minutes each."""
    paragraphs = []
    current = []

    for segment in segments:
        if should_start_new_paragraph(current, segment, soft_seconds, hard_seconds):
            paragraphs.append(current)
            current = []
        current.append(segment)

    if current:
        paragraphs.append(current)
    return paragraphs


def format_paragraph(paragraph: list[Segment], video_id: str | None) -> str:
    """Render one paragraph as a bold timestamp followed by its text."""
    first = paragraph[0]
    timestamp = format_timestamp(first.start)

    if video_id:
        label = f"**[{timestamp}](https://youtu.be/{video_id}?t={int(first.start)})**"
    else:
        label = f"**[{timestamp}]**"

    # split() then join() also squashes stray newlines and double spaces inside captions.
    words = " ".join(segment.text for segment in paragraph).split()
    return f"{label} {' '.join(words)}"


def describe_source(video_id: str | None, source: str | None) -> str | None:
    """Pick the text for the Source line, or None if there is nothing to show."""
    if video_id:
        return f"https://www.youtube.com/watch?v={video_id}"
    return source or None


def build_markdown(
    segments: list[Segment], title: str, video_id: str | None = None, source: str | None = None
) -> str:
    """Build the full Markdown notes for a transcript."""
    if not segments:
        raise ValueError("no transcript lines to write")

    lines = [f"# {title}", ""]

    source_line = describe_source(video_id, source)
    if source_line:
        lines.append(f"- **Source:** {source_line}")

    length = format_timestamp(segments[-1].start)
    count = f"{len(segments)} caption line" + ("" if len(segments) == 1 else "s")
    lines.append(f"- **Length:** {length} ({count})")

    lines += ["", "## Transcript"]
    for paragraph in group_paragraphs(segments):
        lines += ["", format_paragraph(paragraph, video_id)]

    return "\n".join(lines) + "\n"
