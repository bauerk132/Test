# Counting in Binary: Study Guide

- **Source:** `lecture-notes/fixtures/sample_paste.txt` (an invented lecture used for testing)
- **Length:** 2:49 · **Made:** 2026-09-24

## The big picture

Computers store every number using only two digits, 0 and 1. This system is called
binary. It works like the everyday decimal system, except each place is worth twice
the place to its right instead of ten times. The lecture shows how to read a binary
number, how to convert a decimal number into binary, and why computers use binary.

## By the end you should be able to

- Explain how place value works in decimal and in binary
- Convert a binary number such as 1011 to decimal
- Convert a decimal number such as 13 to binary using repeated division by 2
- State how many bits are in a byte and the largest number a byte can hold

## Key terms

| Term | What it means | Where |
|---|---|---|
| Binary (base two) | A number system with only two digits, 0 and 1 | [0:10] |
| Decimal (base ten) | The everyday system with ten digits, 0-9 | [0:14] |
| Place value | Each position's worth: ×10 per step left in decimal, ×2 in binary | [0:24] |
| Bit | One binary digit, a single 0 or 1 ("**bi**nary dig**it**") | [0:55] |
| Byte | 8 bits grouped together; holds 0 to 255 | [2:30] |

## Main ideas

### 1. Place value in decimal vs. binary [0:14]

- In decimal, 352 means 3 hundreds + 5 tens + 2 ones [0:30].
- Binary uses the same idea with ×2 steps. From the right, the places are worth
  1, 2, 4, 8, 16, and so on [0:44].

### 2. Reading binary: 1011 → 11 [1:01]

1. Write the place values under the digits, starting from the right: 1, 2, 4, 8.
2. Add the place values wherever there's a 1: 8 + 2 + 1 = **11** [1:21].

### 3. Writing binary: 13 → 1101 [1:31]

Keep dividing by 2 and write down each remainder [1:36]:

| Step | Division | Remainder |
|---|---|---|
| 1 | 13 ÷ 2 = 6 | 1 |
| 2 | 6 ÷ 2 = 3 | 0 |
| 3 | 3 ÷ 2 = 1 | 1 |
| 4 | 1 ÷ 2 = 0 | 1 |

Read the remainders **from bottom to top**: 1101 [2:03]. Check it: 8 + 4 + 1 = 13 [2:12].

### 4. Why computers use binary [2:18]

- A wire is easily either on or off. Those two states map neatly onto 1 and 0 [2:21].
- 8 bits make a byte, which can store any number from 0 to 255 [2:30].

> **Added context (not from the lecture):** 255 is the largest byte value because
> 11111111 = 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1. Counting 0 as well, that's 256
> possible values, or 2⁸. You'll see 255 again in networking, as in the subnet mask
> 255.255.255.0.

## Exam tips and common mistakes

- Read the remainders **bottom to top**. Reading them top to bottom gives the digits
  in reverse order [2:03].
- Check every conversion by adding the place values back up, as the lecturer does [2:12].

## Check yourself

1. What is a bit, and what is it short for?
2. Convert binary 1011 to decimal.
3. Convert decimal 13 to binary. Show the divisions.
4. How many bits are in a byte, and what range of numbers can a byte store?
5. Explain why computers use binary instead of decimal.
6. Using the lecture's method, convert decimal 6 to binary.

<details>
<summary>Answers (try the questions first)</summary>

1. A single 0 or 1. Short for "binary digit". See [0:55].
2. 8 + 0 + 2 + 1 = **11**. See [1:21].
3. 13÷2 = 6 r1, 6÷2 = 3 r0, 3÷2 = 1 r1, 1÷2 = 0 r1. Bottom to top gives **1101**. See [1:45]-[2:03].
4. 8 bits, storing 0 to 255. See [2:30].
5. A wire is easily on or off, which maps onto 1 and 0. See [2:21].
6. 6÷2 = 3 r0, 3÷2 = 1 r1, 1÷2 = 0 r1. Bottom to top gives **110** (4 + 2 = 6). Uses the method from [1:36].

</details>

## Still unclear?

- How to add two binary numbers. The lecturer saves that for the next lesson [2:44].
- Practice suggested by the lecturer: convert your age into binary [2:38].
