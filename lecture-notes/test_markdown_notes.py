import pytest

from markdown_notes import build_markdown, group_paragraphs
from segments import Segment

VIDEO_ID = "abcDEF12345"


def paragraph_starts(paragraphs: list[list[Segment]]) -> list[list[float]]:
    """Reduce paragraphs to their start times so tests are easy to read."""
    return [[segment.start for segment in paragraph] for paragraph in paragraphs]


# --- group_paragraphs ---


def test_empty_segments_give_no_paragraphs():
    assert group_paragraphs([]) == []


def test_no_break_before_soft_seconds():
    segments = [Segment(0, "One."), Segment(30, "Two."), Segment(59, "Three.")]

    assert paragraph_starts(group_paragraphs(segments)) == [[0, 30, 59]]


def test_soft_break_at_sentence_end_after_soft_seconds():
    segments = [Segment(0, "Welcome to the course."), Segment(60, "Today we learn binary.")]

    assert paragraph_starts(group_paragraphs(segments)) == [[0], [60]]


def test_no_soft_break_in_the_middle_of_a_sentence():
    segments = [
        Segment(0, "Welcome to the course"),
        Segment(61, "where we will learn"),
        Segment(70, "about binary."),
        Segment(80, "Let's begin."),
    ]

    assert paragraph_starts(group_paragraphs(segments)) == [[0, 61, 70], [80]]


@pytest.mark.parametrize(
    "ending",
    [
        "That is binary.",
        "Is that clear?",
        "Wow!",
        'He said "stop."',
        "It's called 'base two.'",
        "(See chapter 2.)",
        "[applause!]",
        "That is binary.   ",
    ],
)
def test_sentence_endings_allow_a_soft_break(ending):
    segments = [Segment(0, ending), Segment(65, "Next part")]

    assert paragraph_starts(group_paragraphs(segments)) == [[0], [65]]


@pytest.mark.parametrize(
    "not_an_ending",
    ["where we will learn", "the value 3.5 is", "e.g. like this one", '"quoted" words', ""],
)
def test_non_sentence_endings_do_not_allow_a_soft_break(not_an_ending):
    segments = [Segment(0, not_an_ending), Segment(65, "keeps going")]

    assert paragraph_starts(group_paragraphs(segments)) == [[0, 65]]


def test_hard_break_without_any_punctuation():
    segments = [Segment(second, "no punctuation here") for second in range(0, 250, 10)]

    starts = paragraph_starts(group_paragraphs(segments))

    assert [paragraph[0] for paragraph in starts] == [0, 120, 240]
    assert starts[0][-1] == 110


def test_custom_soft_and_hard_seconds():
    segments = [Segment(0, "A."), Segment(10, "B"), Segment(15, "C"), Segment(30, "D")]

    paragraphs = group_paragraphs(segments, soft_seconds=10, hard_seconds=20)

    assert paragraph_starts(paragraphs) == [[0], [10, 15], [30]]


# --- build_markdown ---


def test_empty_segments_raise_value_error():
    with pytest.raises(ValueError, match="no transcript lines to write"):
        build_markdown([], title="Empty")


def test_full_output_with_video_id():
    segments = [
        Segment(0, "Welcome to the course"),
        Segment(3, "where we will learn"),
        Segment(6, "about binary."),
        Segment(65, "Binary uses two digits."),
    ]

    markdown = build_markdown(segments, title="Binary 101", video_id=VIDEO_ID)

    assert markdown == (
        "# Binary 101\n"
        "\n"
        f"- **Source:** https://www.youtube.com/watch?v={VIDEO_ID}\n"
        "- **Length:** 1:05 (4 caption lines)\n"
        "\n"
        "## Transcript\n"
        "\n"
        f"**[0:00](https://youtu.be/{VIDEO_ID}?t=0)** "
        "Welcome to the course where we will learn about binary.\n"
        "\n"
        f"**[1:05](https://youtu.be/{VIDEO_ID}?t=65)** Binary uses two digits.\n"
    )


def test_video_id_wins_over_source():
    markdown = build_markdown([Segment(0, "Hi.")], title="T", video_id=VIDEO_ID, source="talk.txt")

    assert f"- **Source:** https://www.youtube.com/watch?v={VIDEO_ID}\n" in markdown
    assert "talk.txt" not in markdown


def test_source_line_with_source_only():
    markdown = build_markdown([Segment(0, "Hi.")], title="T", source="lecture-01.txt")

    assert "- **Source:** lecture-01.txt\n" in markdown


def test_no_source_line_when_neither_is_given():
    markdown = build_markdown([Segment(0, "Hi.")], title="T")

    assert "Source" not in markdown
    assert markdown.startswith("# T\n\n- **Length:** 0:00 (1 caption line)\n\n## Transcript\n")


def test_timestamp_is_plain_bold_without_video_id():
    segments = [Segment(0, "Intro."), Segment(65, "Next part.")]

    markdown = build_markdown(segments, title="T", source="lecture.txt")

    assert "\n**[0:00]** Intro.\n" in markdown
    assert "\n**[1:05]** Next part.\n" in markdown
    assert "youtu.be" not in markdown


def test_linked_timestamp_uses_whole_seconds():
    segments = [Segment(0, "Intro."), Segment(65.7, "Next part.")]

    markdown = build_markdown(segments, title="T", video_id=VIDEO_ID)

    assert f"\n**[1:05](https://youtu.be/{VIDEO_ID}?t=65)** Next part.\n" in markdown


def test_length_line_uses_last_segment_start_and_line_count():
    segments = [Segment(0, "a"), Segment(1800, "b"), Segment(3723, "c")]

    markdown = build_markdown(segments, title="T")

    assert "- **Length:** 1:02:03 (3 caption lines)\n" in markdown


def test_texts_are_joined_with_single_spaces():
    segments = [Segment(0, " Welcome to "), Segment(2, "the\ncourse"), Segment(4, "  today. ")]

    markdown = build_markdown(segments, title="T")

    assert "**[0:00]** Welcome to the course today.\n" in markdown


def test_output_ends_with_exactly_one_newline():
    segments = [Segment(0, "Intro."), Segment(65, "The end.")]

    markdown = build_markdown(segments, title="T", video_id=VIDEO_ID)

    assert markdown.endswith("The end.\n")
    assert not markdown.endswith("\n\n")
