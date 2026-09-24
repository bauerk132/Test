import pytest

from segments import format_timestamp, parse_timestamp


@pytest.mark.parametrize(
    "text, seconds",
    [("0:00", 0), ("0:07", 7), ("12:05", 725), ("1:02:03", 3723), (" 3:20 ", 200)],
)
def test_parse_timestamp(text, seconds):
    assert parse_timestamp(text) == seconds


@pytest.mark.parametrize(
    "text",
    ["", "Reply", "220-1201", "5:0", "5:75", "1:75:00", "[34:30](https://example.com)", "0:07 Hello"],
)
def test_parse_timestamp_rejects_non_timestamps(text):
    assert parse_timestamp(text) is None


@pytest.mark.parametrize(
    "seconds, text",
    [(0, "0:00"), (7, "0:07"), (7.9, "0:07"), (725, "12:05"), (3723, "1:02:03")],
)
def test_format_timestamp(seconds, text):
    assert format_timestamp(seconds) == text
