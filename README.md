# SPECTRA — Split the Light, Burn the Dark

[![make.fun](https://make.fun/badge/competition/best-game-01)](https://make.fun/bounty/best-game-01)
[![make.fun](https://make.fun/badge/entrant/sidik666)](https://make.fun/profile/sidik666)
[![make.fun](https://make.fun/badge/competition/best-game-01/status)](https://make.fun/bounty/best-game-01)

A light-prism arcade game for the [make.fun best-game-01](https://make.fun/bounty/best-game-01) competition ($1,000 prize pool). One sunbeam falls on a crystal at the heart of the night and splits into three coloured rays — ember, leaf and sky. Shadow wisps drift in from the dark to snuff the Heartflame. Only a ray of the **same colour** can burn a wisp. Grey Shades fear nothing but the Prism Pulse.

## How to play

- **Mouse** — aim the prism (A / D or arrow keys spin it too)
- **Click / Space** — Prism Pulse: a shockwave that burns everything nearby, Shades included (costs 50 charge)
- **P** — pause · **R** — restart · **M** — mute
- Survive all **10 waves**. Between waves, pick 1 of 3 boon cards: longer rays, hotter light, a stronger pulse, a tougher flame, and more.
- Chain burns within 3 seconds to raise your combo multiplier (up to x3.4).

## The dark

| Wisp | Behaviour |
| --- | --- |
| Ember (red) | Slow, sturdy |
| Leaf (green) | Quick, mid-health |
| Sky (blue) | Fast, zig-zags |
| Shade (grey) | Beam-proof — only the Pulse kills it |
| Brute (gold) | Huge, slow — scorched by any ray |

## Run it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open `game/index.html` in desktop Chrome — the game is plain static files, no build step, no network requests, all sound synthesized with WebAudio.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).

---
Built for make.fun — if you join through my link, use referral code `59gqp20q`.
