"""Turn a YouTube lecture into Markdown notes."""

import argparse
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from markdown_notes import build_markdown
from transcript_file import read_transcript_file

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


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Turn a YouTube lecture into Markdown notes.")
    parser.add_argument("url", nargs="?", help="YouTube video URL or 11-character video ID")
    parser.add_argument(
        "--transcript-file",
        help="text file with a transcript copied from YouTube's 'Show transcript' panel",
    )
    parser.add_argument("--title", help="title for the notes (default: the file name or video ID)")
    parser.add_argument("-o", "--output", help="where to save the notes (default: <name>-notes.md)")
    parser.add_argument("--force", action="store_true", help="overwrite the output file if it exists")
    return parser


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not args.transcript_file:
        parser.error("downloading captions isn't built yet: use --transcript-file")

    try:
        video_id = extract_video_id(args.url) if args.url else None
        segments = read_transcript_file(args.transcript_file)
    except FileNotFoundError:
        sys.exit(f"Error: file not found: {args.transcript_file}")
    except ValueError as error:
        sys.exit(f"Error: {error}")

    name = Path(args.transcript_file).stem
    output = Path(args.output) if args.output else Path(f"{name}-notes.md")
    # Never silently replace notes the user may have edited.
    if output.exists() and not args.force:
        sys.exit(f"Error: {output} already exists (use --force to replace it, or -o to pick another name)")

    markdown = build_markdown(
        segments,
        title=args.title or name,
        video_id=video_id,
        source=args.transcript_file,
    )
    output.write_text(markdown, encoding="utf-8")
    print(f"Saved {len(segments)} caption lines to {output}")


if __name__ == "__main__":
    main()
