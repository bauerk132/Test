"""Download a YouTube video's captions and turn them into Segments."""

from collections.abc import Iterable, Sequence

import requests
from youtube_transcript_api import (
    InvalidVideoId,
    IpBlocked,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
    YouTubeTranscriptApi,
    YouTubeTranscriptApiException,
)

from segments import Segment

TRANSCRIPT_FILE_TIP = "You can paste the transcript into a .txt file and use --transcript-file instead."


class FetchError(Exception):
    """Captions couldn't be downloaded; the message is short enough to show the user."""


def fetch_segments(
    video_id: str,
    languages: Sequence[str] = ("en",),
    api: YouTubeTranscriptApi | None = None,
) -> list[Segment]:
    """Download a video's captions in the first available language from `languages`."""
    if api is None:
        api = YouTubeTranscriptApi()

    # When YouTube can't be reached at all, the library lets the underlying
    # `requests` error through instead of raising one of its own exceptions.
    try:
        snippets = api.fetch(video_id, languages=languages)
    except (YouTubeTranscriptApiException, requests.RequestException) as error:
        raise FetchError(friendly_message(error, languages)) from error

    return snippets_to_segments(snippets)


def snippets_to_segments(snippets: Iterable) -> list[Segment]:
    """Convert caption snippets to Segments, skipping any with no text."""
    segments = []
    for snippet in snippets:
        text = clean_text(snippet.text)
        if text:
            segments.append(Segment(start=snippet.start, text=text))
    return segments


def clean_text(text: str) -> str:
    """Collapse newlines and repeated spaces into single spaces, and trim the ends."""
    # split() with no argument splits on any run of whitespace, newlines included.
    return " ".join(text.split())


def friendly_message(error: Exception, languages: Sequence[str]) -> str:
    """Turn a library or network error into a short message for the user."""
    # The library's own messages are several paragraphs long, so we write our own.
    if isinstance(error, (TranscriptsDisabled, NoTranscriptFound)):
        language_list = ", ".join(languages)
        return (
            f"This video has no captions in the requested language(s): {language_list}. "
            f"{TRANSCRIPT_FILE_TIP}"
        )
    if isinstance(error, (RequestBlocked, IpBlocked)):
        return (
            "YouTube is blocking caption requests from this network "
            f"(common on cloud servers and some school networks). {TRANSCRIPT_FILE_TIP}"
        )
    if isinstance(error, (VideoUnavailable, InvalidVideoId)):
        return "Couldn't find that video. Check that the link or video ID is correct."
    if isinstance(error, requests.RequestException):
        return (
            "Couldn't reach YouTube: check your internet connection, "
            f"or your network may be blocking YouTube. {TRANSCRIPT_FILE_TIP}"
        )
    return f"Couldn't get captions for this video ({type(error).__name__}). {TRANSCRIPT_FILE_TIP}"
