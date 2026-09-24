"""Turn a YouTube lecture into Markdown notes."""

import argparse
import re
import sys
from urllib.parse import parse_qs, urlparse

# YouTube video IDs are 11 characters: letters, digits, "-" and "_".
VIDEO_ID_PATTERN = re.compile(r"[A-Za-z0-9_-]{11}")

# Exact host names, not a "contains youtube.com" check, so look-alike
# domains such as youtube.com.evil.example are rejected.
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"}
ID_PATH_PREFIXES = ("/embed/", "/shorts/", "/live/", "/v/")


def extract_video_id(url_or_id: str) -> str:
    text = url_or_id.strip()

    if VIDEO_ID_PATTERN.fullmatch(text):
        return text

    # Without "https://", urlparse can't tell where the host name is.
    if "://" not in text:
        text = "https://" + text

    parsed = urlparse(text)
    host = parsed.hostname or ""
    candidate = ""

    if host == "youtu.be":
        candidate = parsed.path.lstrip("/").split("/")[0]
    elif host in YOUTUBE_HOSTS:
        if parsed.path == "/watch":
            candidate = parse_qs(parsed.query).get("v", [""])[0]
        elif parsed.path.startswith(ID_PATH_PREFIXES):
            candidate = parsed.path.split("/")[2]

    if VIDEO_ID_PATTERN.fullmatch(candidate):
        return candidate

    raise ValueError(f"Couldn't find a YouTube video ID in: {url_or_id!r}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Turn a YouTube lecture into Markdown notes.")
    parser.add_argument("url", help="YouTube video URL or 11-character video ID")
    args = parser.parse_args()

    try:
        video_id = extract_video_id(args.url)
    except ValueError as error:
        sys.exit(f"Error: {error}")

    print(f"Video ID: {video_id}")


if __name__ == "__main__":
    main()
