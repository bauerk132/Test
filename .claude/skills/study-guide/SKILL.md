---
name: study-guide
description: Turn a lecture transcript into a Markdown study guide with the big picture, key terms, main ideas with timestamps, comparison tables, exam tips, and a self-quiz with hidden answers. Use when the user pastes a YouTube transcript or a whole YouTube page, gives a transcript .txt or a lecture-notes *-notes.md file, or gives a YouTube link and asks for a study guide, study notes, a review sheet, or a quiz. Also use when they paste a lecture transcript without saying what they want.
argument-hint: "[youtube-link | transcript-file]"
---

Make a study guide from a lecture transcript. The user is a student (currently studying for CompTIA A+ 220-1201/1202), so write in plain language and define jargon the first time it appears.

Input: `$ARGUMENTS` (a YouTube link, a file path, or nothing when the transcript is pasted into the chat).

## 1. Get a clean, timestamped transcript

Use the `lecture-notes` tool in this repo. It strips YouTube page clutter and joins captions into timestamped paragraphs. Run it from `lecture-notes/`. If `.venv` is missing, set it up first: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`. On Windows the interpreter is `.venv\Scripts\python.exe`.

Write its output to a temporary file, not into the repo. Then read that file.

| The user gave | Do this |
|---|---|
| A pasted page or transcript in the chat | Save the paste unchanged to a temporary `.txt` file, then use file mode (next row) |
| A `.txt` transcript | `.venv/bin/python notes.py --transcript-file PATH -o TMP.md --force` |
| A `*-notes.md` file from this tool | Read it directly |
| A YouTube link | `.venv/bin/python notes.py "URL" -o TMP.md --force` |
| A link plus a transcript | `.venv/bin/python notes.py "URL" --transcript-file PATH -o TMP.md --force` (the timestamps become links) |

Handling problems:

- **Download fails** ("Couldn't reach YouTube", "no captions"): don't retry. Tell the user to paste the transcript instead:
  1. Open **Show transcript** under the video.
  2. Press `Ctrl+A`, then `Ctrl+C`.
  3. Paste it here.
- **"no timestamped captions"**: the text is a plain transcript. Use it as is and leave out the timestamps.
- **Title**: take it from the pasted page if it's visible (the video title, not a "Next:" suggestion). Otherwise make up a short descriptive title. Don't stop to ask.

## 2. Read everything before writing

Read the whole transcript first. For long lectures, read it in chunks and keep running notes: terms, claims, examples, and tips, each with its timestamp.

## 3. Write the guide

Follow [template.md](template.md). [example.md](example.md) shows a finished guide for a short, invented lecture.

- **Stay faithful to the lecture.** Everything comes from the transcript.
  - Put anything you add, such as a definition the lecturer skipped, in an **Added context (not from the lecture)** callout.
  - If the lecturer says something wrong or outdated, flag it in a callout. Don't repeat it as fact.
- **Paraphrase.** Don't copy long passages. At most one short quote (under about 15 words) per section. The guide should help the user study the video, not replace it.
- **Cite timestamps** on every main idea, key term, tip, and quiz answer.
  - Link them as `[m:ss](https://youtu.be/ID?t=SECONDS)` when you know the video ID.
  - Leave them as plain `[m:ss]` when you don't.
- **Scale to the lecture's length.** Don't pad, and delete template sections that don't apply.

  | Lecture length | Key terms | Quiz questions |
  |---|---|---|
  | About 10 minutes | 5-10 | 6-8 |
  | An hour | 15-25 | 12-15 (split the main ideas into parts) |

- **Mix the quiz questions.** Include recall, applying the idea (a scenario, or a calculation with the working shown in the answer), and at least one "explain why". Answers go in the `<details>` block so the user can test themselves.
- **Tailor exam tips.** If the user named an exam or class, aim the exam tips at it. Only name objective numbers (like "1.2") that the lecture itself states. Never guess them.

## 4. Save it

Save to `study-guides/<slug>-study-guide.md` at the repo root. The slug is the title in lowercase with hyphens.

- If that file already exists, add `-2`, `-3`, and so on. Never overwrite a guide, since the user may have edited it.
- Don't commit unless the user asks. `study-guides/` is in the root `.gitignore` because this repo is public, so committing a guide on purpose needs `git add -f`.
- In a cloud session, tell the user the file is lost when the session ends unless they download it or ask you to commit it.
- Guides of someone else's lecture are for personal study. Say so if the user wants to push them to a public repo.

## 5. Hand it over

Reply briefly with:
- the file path
- a two-sentence summary of the lecture
- how many key terms and quiz questions the guide has
- any **Added context** or corrections you included

Then offer to quiz the user one question at a time in the chat. When you do, wait for each answer and explain any mistakes.
