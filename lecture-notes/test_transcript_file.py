from pathlib import Path

import pytest

from segments import Segment
from transcript_file import parse_pasted_transcript, read_transcript_file

SAMPLE_PASTE = Path(__file__).parent / "fixtures" / "sample_paste.txt"


def paste(*lines):
    """Join lines the way they'd appear in a pasted text file."""
    return "\n".join(lines)


def test_sample_paste_gives_the_expected_captions():
    segments = read_transcript_file(SAMPLE_PASTE)

    assert len(segments) == 36
    assert segments[0] == Segment(1, "Hi everyone, and welcome back to Tidewater Night School.")
    assert segments[-1] == Segment(169, "Thanks for watching, and I'll see you then!")
    starts = [segment.start for segment in segments]
    assert starts == sorted(starts)


@pytest.mark.parametrize(
    "noise",
    ["Skip navigation", "Next:", "Ask about this video", "Summarize the video",
     "subscribers", "views", "Comments", "@", "Reply", "is where it clicked"],
)
def test_sample_paste_leaves_out_page_noise(noise):
    segments = read_transcript_file(SAMPLE_PASTE)

    assert not any(noise in segment.text for segment in segments)


def test_handles_windows_line_endings_and_blank_lines():
    lines = ["Transcript", "", "0:01", "", "  First caption.  ", "0:04", "Second caption.", ""]
    text = "\r\n".join(lines)

    assert parse_pasted_transcript(text) == [
        Segment(1, "First caption."),
        Segment(4, "Second caption."),
    ]


def test_empty_caption_is_skipped_without_breaking_the_run():
    text = paste(
        "0:10", "Earlier run one.", "0:11", "Earlier run two.",
        "Page noise",
        "0:00", "0:01", "Hello.", "0:02", "0:03", "Still here.", "0:05", "Goodbye.",
    )

    assert parse_pasted_transcript(text) == [
        Segment(1, "Hello."),
        Segment(3, "Still here."),
        Segment(5, "Goodbye."),
    ]


def test_time_going_backwards_ends_the_run():
    text = paste("0:05", "A", "0:06", "B", "0:02", "C", "0:03", "D", "0:04", "E")

    assert parse_pasted_transcript(text) == [Segment(2, "C"), Segment(3, "D"), Segment(4, "E")]


def test_first_run_wins_a_tie():
    text = paste("0:05", "A", "0:06", "B", "0:01", "C", "0:02", "D")

    assert parse_pasted_transcript(text) == [Segment(5, "A"), Segment(6, "B")]


def test_timestamp_followed_by_several_lines_ends_the_run():
    text = paste(
        "0:01", "A", "0:02", "B",
        "0:03", "Some related video", "Some channel",
        "0:04", "C", "0:05", "D", "0:06", "E",
    )

    assert parse_pasted_transcript(text) == [Segment(4, "C"), Segment(5, "D"), Segment(6, "E")]


@pytest.mark.parametrize("text", ["", "Skip navigation\nNo timestamps here", "0:00\n0:01\n0:02"])
def test_no_captions_gives_an_empty_list(text):
    assert parse_pasted_transcript(text) == []


def test_read_transcript_file_strips_notepad_bom(tmp_path):
    transcript_path = tmp_path / "transcript.txt"
    transcript_path.write_bytes("﻿0:00\r\n0:01\r\nHello.\r\n".encode("utf-8"))

    assert read_transcript_file(str(transcript_path)) == [Segment(1, "Hello.")]


def test_read_transcript_file_without_captions_raises_value_error(tmp_path):
    transcript_path = tmp_path / "notes.txt"
    transcript_path.write_text("I copied the video description by mistake.\n", encoding="utf-8")

    with pytest.raises(ValueError, match="Show transcript") as error:
        read_transcript_file(transcript_path)
    assert str(transcript_path) in str(error.value)


def test_read_transcript_file_missing_file_raises_file_not_found(tmp_path):
    with pytest.raises(FileNotFoundError):
        read_transcript_file(tmp_path / "does_not_exist.txt")
