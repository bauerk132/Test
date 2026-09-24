import pytest

from notes import extract_video_id

VIDEO_ID = "abcDEF12345"


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
