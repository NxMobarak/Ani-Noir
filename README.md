# ⚔️ AniNoir — Your Anime Universe

A sleek, feature-packed anime quiz and discovery app built for the otaku community.

![AniNoir](https://img.shields.io/badge/AniNoir-Anime%20Quiz-ff006e?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTEyIDJMMiAyMmgyMEwxMiAyeiIvPjwvc3ZnPg==)

## Features

### Quiz Modes
- **🧠 Classic Quiz** — Standard anime trivia MCQ across 5 difficulty levels (Genin → Kage)
- **🎯 Emoji Quiz** — Guess the anime from emoji clues! (250 questions across all levels)
- **🔤 Anagram** — Unscramble anime titles from mixed-up letters
- **🕵️ Shadow Quiz** — Identify characters from silhouettes and clues
- **💀 Survival Mode** — Infinite quiz with 3 lives. How long can you survive?
- **📅 Daily Challenge** — A new question every day for bonus spades

### Discovery
- **🔍 Anime Search** — Search anime with details, synopsis, genres, and streaming links
- **📋 Watchlist** — Save anime to your personal watchlist
- **📰 News** — Latest anime news with category filters (Anime, Manga, Games)
- **🎂 Birthdays** — Popular anime character birthday calendar

### Gamification
- **♠ Spades Currency** — Earn by playing, spend on hints, skips, and unlocking modes
- **🔥 Combo System** — 3+ correct in a row = bonus spades
- **🏅 Badges** — Earn badges for achievements
- **🏆 Leaderboard** — Track your personal bests across all modes

## Tech Stack

- **React** (Vite)
- **No external UI libraries** — Custom CSS-in-JS dark theme
- **Web Audio API** — Sound effects
- **localStorage** — Progress persistence
- **Jikan API** — Anime data
- **PWA Ready** — Service worker + manifest included

## Getting Started

```bash
# Clone the repo
git clone https://github.com/NxMobarak/Ani-Noir.git
cd Ani-Noir

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Difficulty Levels

| Level | Name | Difficulty | Timer |
|-------|------|-----------|-------|
| 🌱 | Genin | 100% Can Solve | 30s |
| ⚔️ | Chunin | 60% Can Solve | 30s |
| 🔥 | Jonin | 30% Can Solve | 25s |
| 👁️ | Elite Shinobi | 10% Can Solve | 20s |
| 👑 | Kage | 1% Can Solve | 15s |

## Spades Economy

| Action | Reward |
|--------|--------|
| Complete Genin quiz | +10♠ |
| Complete Chunin quiz | +20♠ |
| Complete Jonin quiz | +30♠ |
| Complete Elite quiz | +50♠ |
| Complete Kage quiz | +100♠ |
| Daily Challenge | +30♠ |
| Survival (per 5 correct) | +100♠ |
| 3x Combo | +5♠ |

## Contributing

Feel free to:
- Add more emoji quiz questions
- Add more shadow quiz characters
- Suggest new features
- Report bugs

## Follow

- 📷 Instagram: [@mobarak_sekh_](https://www.instagram.com/mobarak_sekh_)
- ▶ YouTube: [AnimeTMTalks](https://youtube.com/@animetmtalks)

## License

MIT

---

Built with ❤️ for the anime community by an anime lover who eats, sleeps, and breathes anime.
