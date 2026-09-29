"""Shared prompt helpers.

WHY THIS FILE EXISTS
    The text the model sees during TRAINING and during EVALUATION must be built by
    the same code. If training data says "<patch>...</patch>" and the eval parser
    looks for something else, the model can be perfect and still score 0. Keeping
    the format in one module means it can only be wrong in one place.
"""
import re

SYSTEM_PROMPT = (
    "You are an expert software engineer. Read the issue and the code, then reply "
    "with one patch in the requested format and nothing else."
)

_PATCH_TAG = re.compile(r"<patch>\s*(.*?)\s*</patch>", re.DOTALL)
_FENCE = re.compile(r"^```[a-zA-Z]*\n|\n```\s*$")


def wrap_patch(patch: str) -> str:
    """Training target: the gold patch inside <patch> tags (the SWE-bench prompt asks for this)."""
    return "<patch>\n" + patch.strip("\n") + "\n</patch>"


def extract_patch(output: str) -> str:
    """Pull a git-appliable patch out of raw model output. Returns '' if none found.

    A patch must start at 'diff --git' and end with a newline or `git apply` rejects it.
    """
    match = _PATCH_TAG.search(output)
    body = match.group(1) if match else output.strip()
    body = _FENCE.sub("", body.strip())  # drop ```diff fences if the model added them
    start = body.find("diff --git")
    if start < 0:
        return ""
    return body[start:].rstrip() + "\n"


def to_messages(prompt_text: str, patch: str | None = None) -> list[dict]:
    """Chat messages for one task. Pass `patch` to include the training answer."""
    msgs = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt_text},
    ]
    if patch is not None:
        msgs.append({"role": "assistant", "content": wrap_patch(patch)})
    return msgs


if __name__ == "__main__":  # python common/prompts.py  -> quick self-test
    p = "diff --git a/x.py b/x.py\n--- a/x.py\n+++ b/x.py\n@@ -1 +1 @@\n-a\n+b\n"
    assert extract_patch(wrap_patch(p)) == p
    assert extract_patch("Sure!\n<patch>\n```diff\n" + p + "```\n</patch>") == p
    assert extract_patch("no patch here") == ""
    assert extract_patch("<patch>\n" + p[:-1]) == p            # missing closing tag still recovers
    assert to_messages("q", p)[-1]["content"].startswith("<patch>")
    print("prompts.py self-test OK")
