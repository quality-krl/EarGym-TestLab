# Pitch QA — Ear Trainer (EN/HE)

A bilingual (English/Hebrew) pitch-recognition mini site that treats **ear training like QA**:
input (tone) → decision (note) → feedback (pass/fail) → iterate.

If a note feels “off”, it’s a failing test — and the goal is to build a reliable inner loop:
**hear → verify → improve**.

---

## What this is

- A fast ear-training game: press **Play**, guess the note, track score/streak.
- Designed with a **QA mindset**: measurable reps, instant feedback, consistent progression.
- Mobile-friendly, with a safe language switch (no `dir` mutation that can cause blank frames on phones).

---

## Features

- **Two languages:** English + Hebrew (RTL content where relevant)
- **Difficulty levels:** Easy / Standard / Hard (optional octave shifts on Hard)
- **Assist mode:** plays **A=440** before the target note (reference anchor)
- **Local best score:** saved per language in `localStorage`
- **Benchmark wall:** only publicly documented absolute/perfect pitch references
- **Touch UX:** tap a benchmark card to pin tooltip; tap outside to close

---

## Tech

- Vanilla **HTML/CSS/JS**
- Web Audio API (`AudioContext`, oscillator)
- No frameworks, no build step

---

## Run locally

### Option 1 — VS Code Live Server
1. Open the folder in VS Code
2. Install “Live Server”
3. Right click `index.html` → **Open with Live Server**

### Option 2 — Python HTTP server
From the project folder:

```bash
python -m http.server 5500

## QA Exploration (Sample)

This project is also used as a QA practice environment.

Example test scenarios:

| Area | Scenario | Expected Result |
|------|----------|-----------------|
| Audio | Play reference tone (A4) | Tone plays clearly without distortion |
| Input | Guess wrong note | UI shows failure feedback and resets state |
| Language | Switch EN → HE | Layout flips RTL without breaking UI |
| Storage | Refresh page | Best score persists correctly |
| Touch UX | Tap outside tooltip | Tooltip closes reliably |

Known edge cases explored:
- RTL direction mutation causing blank frames on mobile  
- AudioContext resume on iOS  
- LocalStorage per-language isolation  


