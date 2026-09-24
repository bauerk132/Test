from pathlib import Path

import pytest

from notes import extract_video_id, main

VIDEO_ID = "abcDEF12345"
SAMPLE_PASTE = Path(__file__).parent / "fixtures" / "sample_paste.txt"


@pytest.mark.parametrize(
    "url",
    [
        f"https://www.youtube.com/watch?v={VIDEO_ID}",
        f"https://youtube.com/watch?v={VIDEO_ID}&t=120s",
        f"https://www.youtube.com/watch?feature=share&v={VIDEO_ID}",
        f"https://m.youtube.com/watch?v={VIDEO_ID}",
        f"https://youtu.be/{VIDEO_ID}",
        f"https://youtu.be/{VIDEO_ID}?si=tracking123",
        f"https://www.youtube.com/embed/{VIDEO_ID}",
        f"https://www.youtube.com/shorts/{VIDEO_ID}",
        f"https://www.youtube.com/live/{VIDEO_ID}",
        f"youtu.be/{VIDEO_ID}",
        f"  {VIDEO_ID}  ",
        VIDEO_ID,
    ],
)
def test_extracts_id_from_supported_formats(url):
    assert extract_video_id(url) == VIDEO_ID


@pytest.mark.parametrize(
    "bad_input",
    [
        "",
        "not a url",
        "https://www.youtube.com/watch?v=tooShort",
        "https://www.youtube.com/playlist?list=PL123",
        "https://www.youtube.com/shorts/",
        f"https://evil.example.com/watch?v={VIDEO_ID}",
        f"https://www.youtube.com.evil.example/watch?v={VIDEO_ID}",
    ],
)
def test_rejects_invalid_input(bad_input):
    with pytest.raises(ValueError):
        extract_video_id(bad_input)


def run_cli(args):
    """Run main() and return the SystemExit code/message, or None if it finished normally."""
    try:
        main(args)
    except SystemExit as exit_:
        return exit_.code
    return None


def test_transcript_file_writes_notes(tmp_path, monkeypatch, capsys):
    monkeypatch.chdir(tmp_path)
    assert run_cli(["--transcript-file", str(SAMPLE_PASTE)]) is None

    notes = (tmp_path / "sample_paste-notes.md").read_text(encoding="utf-8")
    assert notes.startswith("# sample_paste\n")
    assert "## Transcript" in notes
    assert "https://youtu.be/" not in notes
    assert "Saved" in capsys.readouterr().out


def test_url_plus_transcript_file_adds_timestamp_links(tmp_path):
    output = tmp_path / "out.md"
    args = [f"https://youtu.be/{VIDEO_ID}", "--transcript-file", str(SAMPLE_PASTE)]
    assert run_cli(args + ["-o", str(output), "--title", "Binary basics"]) is None

    notes = output.read_text(encoding="utf-8")
    assert notes.startswith("# Binary basics\n")
    assert f"https://www.youtube.com/watch?v={VIDEO_ID}" in notes
    assert f"https://youtu.be/{VIDEO_ID}?t=" in notes


def test_refuses_to_overwrite_without_force(tmp_path):
    output = tmp_path / "out.md"
    output.write_text("my own edits", encoding="utf-8")
    args = ["--transcript-file", str(SAMPLE_PASTE), "-o", str(output)]

    assert "already exists" in run_cli(args)
    assert output.read_text(encoding="utf-8") == "my own edits"

    assert run_cli(args + ["--force"]) is None
    assert "## Transcript" in output.read_text(encoding="utf-8")


def test_missing_transcript_file(tmp_path):
    assert "file not found" in run_cli(["--transcript-file", str(tmp_path / "nope.txt")])


def test_transcript_file_without_captions(tmp_path):
    empty = tmp_path / "empty.txt"
    empty.write_text("just some words\nno timestamps here\n", encoding="utf-8")
    assert run_cli(["--transcript-file", str(empty), "-o", str(tmp_path / "out.md")]).startswith("Error:")


def test_bad_url_with_transcript_file(tmp_path):
    message = run_cli(["https://example.com/video", "--transcript-file", str(SAMPLE_PASTE)])
    assert "Couldn't find a YouTube video ID" in message


def test_no_arguments_is_a_usage_error():
    assert run_cli([]) == 2
