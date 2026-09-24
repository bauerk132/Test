# Lecture Notes

A small command-line tool that turns a YouTube lecture into a tidy Markdown
notes file. Point it at a video link (or a transcript you've pasted from
YouTube) and it groups the captions into readable paragraphs, each starting
with a timestamp (a clickable link when you give it the video's URL), so you
get something you can actually study from — handy if you're working through a
free CompTIA A+ course on YouTube.

## Setup

You need Python 3.11 or newer and Git. Get the code, then work inside the
`lecture-notes` folder; every command below assumes you're in it:

```bash
git clone https://github.com/bauerk132/Test.git
cd Test/lecture-notes
```

You only need to do the rest once. A **virtual environment** is a private,
project-only folder for Python packages, so what this tool installs doesn't
mix with (or clash with) anything else on your computer.

**Windows (PowerShell):**

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If activation is blocked with an error about "running scripts is disabled",
run this once and try again — it only allows scripts for your own user
account, nothing system-wide:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**macOS/Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Each time you come back to use the tool, re-activate the virtual environment
(the `Activate.ps1` or `source .venv/bin/activate` line above) before running
it.

## Usage

### 1. Link mode — give it a YouTube URL

```bash
python notes.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

This downloads the video's English captions automatically and saves them as
`VIDEO_ID-notes.md` in the current folder.

### 2. File mode — paste a transcript yourself

Some school or work networks block YouTube, or YouTube may temporarily block
automated requests. If link mode doesn't work, you can copy the transcript by
hand instead:

1. Open the video on YouTube.
2. Under the video, open the description and click **Show transcript**.
3. Select the whole page (`Ctrl+A`, or `Cmd+A` on a Mac) and copy it. Grabbing
   extra page text is fine; the timestamps just need to be included.
4. Paste it into a plain `.txt` file, e.g. `lecture.txt`, and save it.

```bash
python notes.py --transcript-file lecture.txt
```

This saves notes to `lecture-notes.md` (the transcript file's name plus
`-notes.md`). Don't worry about page clutter like comments or recommended
videos — the tool ignores anything that isn't part of the transcript itself.

### 3. Both — clickable timestamps from a pasted transcript

```bash
python notes.py "https://www.youtube.com/watch?v=VIDEO_ID" --transcript-file lecture.txt
```

Combining both uses your pasted transcript (so it doesn't need to reach
YouTube) but also turns every timestamp into a link to that moment in the video.

### Other options

| Option | What it does |
|---|---|
| `--title "..."` | Sets the heading at the top of the notes |
| `-o path.md` | Chooses where to save the output file |
| `--force` | Allows overwriting a notes file that already exists |

By default, the tool refuses to overwrite an existing output file, so you
never lose notes you've already edited by hand.

## What the notes look like

Here's a short, made-up example of the output (not from a real video):

```markdown
# Networking Basics: Lesson 2

- **Source:** https://www.youtube.com/watch?v=VIDEO_ID
- **Length:** 14:32 (58 caption lines)

## Transcript

**[0:00](https://youtu.be/VIDEO_ID?t=0)** Welcome back. Today we're covering
the OSI model and why it matters for the exam...

**[1:47](https://youtu.be/VIDEO_ID?t=107)** Let's start at the bottom, the
physical layer. This is anything that moves raw bits...
```

## Turning notes into a study guide

This tool gives you a clean transcript. To get a **study guide** from it (key
terms, main ideas with timestamps, exam tips, and a self-quiz with hidden
answers), open Claude Code in this repo and run the `/study-guide` skill:

```text
/study-guide https://www.youtube.com/watch?v=VIDEO_ID
/study-guide lecture.txt
/study-guide            (then paste the whole YouTube page)
```

It runs this tool for you, then writes `study-guides/<title>-study-guide.md`.
The instructions are in `.claude/skills/study-guide/SKILL.md`.

## Running the tests

```bash
python -m pytest
```

## Known limitations

- Videos without captions can't be used in link mode.
- School/work networks sometimes block YouTube, and YouTube itself sometimes
  blocks automated requests — use `--transcript-file` in either case.
- Only English captions are supported for now.
- The paste parser expects YouTube's current transcript layout (a timestamp
  on its own line, followed by the caption text on the next line). If YouTube
  changes that layout, file mode may need updating.

## A note on sharing notes

These notes are for your own studying. Please don't republish full
transcripts — they belong to the video's creator.
