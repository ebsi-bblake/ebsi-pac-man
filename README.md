# Empyrean Navigator – MVP Web Game Specification

A single-screen, polished, Pac-Man-inspired game built with HTML, CSS, and JavaScript. Designed for mobile and desktop, this game supports keyboard and swipe controls, and reflects Empyrean Benefit Solutions' mission: guiding employees through complex benefits with clarity and confidence.

This project emphasizes **high visual polish** and **retro 70s–80s arcade nostalgia**, incorporating thematic elements, iconography, and audio reminiscent of the golden age of arcade games, reinterpreted through the Empyrean brand.

---

## 🎯 Game Scope

### Core Mechanics

- Single-screen maze with fixed layout (no level transitions).
- Player: "The Navigator" – moves to collect benefit tokens.
- Four enemy entities chase the player (HR obstacles).
- Power-up grants temporary invincibility to “clear confusion” (eat enemies).
- 3 lives per game.
- Win = all tokens collected.  
- Loss = 3 collisions with enemies.

### Controls

- **Keyboard**: Arrow keys or WASD.
- **Touch (mobile)**: Swipe up/down/left/right to move.

---

## 🧠 Game Entities

### Player Character

**The Navigator**  
- Glowing teal orb with a star/compass symbol.  
- Represents Empyrean’s clarity and guidance.

### Benefit Tokens (Collectibles)

Each icon symbolizes an employee benefit. Collecting adds +10 to **Empowerment Score**:
- 🏥 Health
- 🦷 Dental
- 👓 Vision
- 💳 HSA
- 💼 401(k)

Icons are nostalgic-style pixel-art or clean SVG with a neon glow effect.

### Power-Ups

**Enrollment Boosts**  
- Large glowing icons (sparkle or lightning bolt).
- Activate invincibility (visual aura) for 5 seconds.
- Enables “clearing confusion” by defeating enemies.

### Enemies

HR-themed ghosts:
| Name        | Symbolism                | Color    | Notes                        |
|-------------|---------------------------|----------|------------------------------|
| Confuso     | Confusing plan language   | Purple   | Slow but direct chaser       |
| Delaya      | Enrollment delays         | Red      | Fastest                      |
| MissyMatch  | Out-of-network providers  | Blue     | Patrols area randomly        |
| Forgotto    | Missed deadlines          | Orange   | Zigzag unpredictable movement|

Each has a unique color, simple AI behavior, and icon.

---

## 🎨 Visual Design

- Maze: HR portal-like, styled with **blue-gray tones** and **neon outlines**.
- High visual polish required: subtle shadows, glows, transitions, animation.
- Brand colors:
  - Deep Navy: `#0C1E2C`
  - Bright Blue: `#00ADEF`
  - Teal: `#00BFB3`
  - White: `#FFFFFF`
- Background overlays: softly rendered company values — “Clarity”, “Confidence”, “Support”.
- Retro arcade aesthetic: scanlines, pixel fonts, or CRT-style border (optional).

---

## 🔊 Audio & Feedback

- **Optional background music** with light synthwave feel (toggleable).
- Sound effects:
  - Token collect: soft "ping"
  - Power-up: shimmer/surge
  - Enemy hit (powered): zap
  - Player hit (unpowered): static buzz
  - Win/loss chimes
- Mute toggle for mobile users.

---

## 🖥️ UI & Messaging

- Empowerment Score = Player score
- Lives = Compass/star icons (e.g., 🌟🌟🌟)
- Power-up = “ENROLLMENT BOOST ACTIVE” banner or glow
- End Messages:
  - Win: “🎉 You’ve unlocked your full benefits potential with Empyrean!”
  - Loss: “😓 Overwhelmed? Let Empyrean guide you next time.”

---

## ✨ Optional Enhancements

- High score tracking via `localStorage`
- Responsive layout on all screen sizes
- First-time onboarding screen for swipe tutorial
- Retro attract mode screen when idle

---
