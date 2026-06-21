# random — little web pages

This repo hosts a couple of small static pages, deployed together via GitHub Pages.
The bare site URL redirects to the proposal page.

- **`proposal/`** — an interactive "Hoćeš li biti moja djevojka?" page (Croatian), styled as an
  engineering blueprint, played as a 5-sheet dossier (cover → 3 games → result):
  - **NASLOVNICA** — scratch off the "POVJERLJIVO" cover to reveal the question + a funny parts list.
  - **NACRT 001 — zupčanici** — drag 3 gears onto their axles so they mesh; they then spin.
  - **NACRT 002 — skica** — SolidWorks-style sketch: drag the points onto the dimensions to **draw a
    tractor**; it goes from under-defined (blue) to potpuno određena (green).
  - **NACRT 003 — spoji srce** — drag the two heart halves ("TI" onto "JA") until they snap (the
    romantic last beat).
  - **POTVRDA** — "SKLOP DOVRŠEN" finale + confetti; the title block flips to ODOBRENO.
  Scratch is only on the cover sheet. Vanilla HTML/CSS/JS + canvas-confetti CDN.
  Live: `https://dineeek.github.io/dearjs/proposal/` (or just the bare repo URL, which redirects here).
- **`animation-script-page/`** — the animated greeting page below.
  Live: `https://dineeek.github.io/dearjs/animation-script-page/`.

The Pages workflow (`.github/workflows/deploy.yml`) serves the **repo root**, so both pages ship on
every push to `main`.

---

# Animated Greeting Page

An animated, customizable greeting page built with GSAP (GreenSock Animation Platform). Features a multi-step animated sequence with text reveals, floating balloons, and a personalized message — perfect for birthdays, Valentine's Day, or any special occasion.

## Features

- Multi-step GSAP timeline animation with smooth transitions
- Fully customizable content via `customize.json` (no code changes needed)
- Floating balloons, text animations, and profile image reveal
- Replay button to re-watch the animation
- Mobile-friendly responsive design

## Customization

Edit `animation-script-page/customize.json` to personalize the greeting:

```json
{
  "greeting": "Hello",
  "recipientName": "Name!",
  "occasionTitle": "Happy Birthday!",
  "chatMessage": "Your message here",
  "profileImage": "img/her.jpeg",
  "mainWish": "Happy Birthday Name!",
  "personalMessage": "Your personal note here"
}
```

## Local Development

```bash
cd animation-script-page
npm install
npm start
```

Opens at `http://localhost:7777`.

## Tech Stack

- HTML/CSS/JavaScript
- [GSAP (TweenMax)](https://greensock.com/gsap/) for animations
- [Babel](https://babeljs.io/) for ES6+ support
- GitHub Pages for hosting
