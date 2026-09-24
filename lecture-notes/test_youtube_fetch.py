import pytest
import requests
from youtube_transcript_api import (
    AgeRestricted,
    FetchedTranscriptSnippet,
    InvalidVideoId,
    IpBlocked,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
)

import youtube_fetch
from segments import Segment
from youtube_fetch import FetchError, fetch_segments

VIDEO_ID = "abcDEF12345"


class FakeApi:
    """Stands in for YouTubeTranscriptApi so the tests never use the network."""

    def __init__(self, snippets=(), error=None):
        self.snippets = list(snippets)
        self.error = error
        self.calls = []

    def fetch(self, video_id, languages=("en",)):
        self.calls.append((video_id, languages))
        if self.error is not None:
            raise self.error
        return self.snippets


def snippet(start, text):
    return FetchedTranscriptSnippet(text=text, start=start, duration=2.0)


def test_converts_snippets_to_segments():
    api = FakeApi([snippet(0.0, "Welcome to the lecture."), snippet(3.5, "Today: recursion.")])

    assert fetch_segments(VIDEO_ID, api=api) == [
        Segment(start=0.0, text="Welcome to the lecture."),
        Segment(start=3.5, text="Today: recursion."),
    ]


def test_collapses_newlines_and_extra_spaces():
    api = FakeApi([snippet(1.0, "  first line\nsecond   line \n\n third\tline  ")])

    assert fetch_segments(VIDEO_ID, api=api) == [Segment(start=1.0, text="first line second line third line")]


def test_drops_snippets_that_are_empty_after_cleaning():
    api = FakeApi([snippet(0.0, "Hello"), snippet(1.0, ""), snippet(2.0, " \n "), snippet(3.0, "World")])

    assert fetch_segments(VIDEO_ID, api=api) == [Segment(0.0, "Hello"), Segment(3.0, "World")]


def test_passes_video_id_and_languages_to_the_api():
    api = FakeApi()

    fetch_segments(VIDEO_ID, languages=("de", "en"), api=api)

    assert api.calls == [(VIDEO_ID, ("de", "en"))]


def test_uses_the_real_api_class_when_none_is_given(monkeypatch):
    fake = FakeApi([snippet(0.0, "Hi")])
    monkeypatch.setattr(youtube_fetch, "YouTubeTranscriptApi", lambda: fake)

    assert fetch_segments(VIDEO_ID) == [Segment(0.0, "Hi")]
    assert fake.calls == [(VIDEO_ID, ("en",))]


PROXY_ERROR_TEXT = (
    "HTTPSConnectionPool(host='www.youtube.com', port=443): Max retries exceeded with url: "
    "/watch?v=abcDEF12345 (Caused by ProxyError('Unable to connect to proxy', "
    "OSError('Tunnel connection failed: 403 Forbidden')))"
)


@pytest.mark.parametrize(
    "error, key_phrase",
    [
        (TranscriptsDisabled(VIDEO_ID), "no captions"),
        (NoTranscriptFound(VIDEO_ID, ["en"], None), "no captions"),
        (RequestBlocked(VIDEO_ID), "blocking caption requests from this network"),
        (IpBlocked(VIDEO_ID), "blocking caption requests from this network"),
        (VideoUnavailable(VIDEO_ID), "Couldn't find that video"),
        (InvalidVideoId(VIDEO_ID), "Couldn't find that video"),
        (AgeRestricted(VIDEO_ID), "Couldn't get captions for this video (AgeRestricted)"),
        (requests.exceptions.ProxyError(PROXY_ERROR_TEXT), "Couldn't reach YouTube"),
        (requests.exceptions.ConnectionError("Name or service not known"), "Couldn't reach YouTube"),
    ],
)
def test_errors_become_short_fetch_errors(error, key_phrase):
    with pytest.raises(FetchError) as excinfo:
        fetch_segments(VIDEO_ID, api=FakeApi(error=error))

    message = str(excinfo.value)
    assert key_phrase in message
    assert "\n" not in message  # the library's long multi-paragraph text isn't passed through
    assert excinfo.value.__cause__ is error


@pytest.mark.parametrize(
    "error",
    [
        TranscriptsDisabled(VIDEO_ID),
        RequestBlocked(VIDEO_ID),
        requests.exceptions.ProxyError(PROXY_ERROR_TEXT),
    ],
)
def test_suggests_transcript_file_when_captions_cant_be_downloaded(error):
    with pytest.raises(FetchError, match="--transcript-file"):
        fetch_segments(VIDEO_ID, api=FakeApi(error=error))


def test_no_captions_message_names_the_requested_languages():
    api = FakeApi(error=NoTranscriptFound(VIDEO_ID, ["de", "fr"], None))

    with pytest.raises(FetchError, match="de, fr"):
        fetch_segments(VIDEO_ID, languages=("de", "fr"), api=api)


def test_unrelated_errors_are_not_hidden():
    with pytest.raises(ValueError):
        fetch_segments(VIDEO_ID, api=FakeApi(error=ValueError("a bug, not a YouTube problem")))
