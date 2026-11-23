# I just wanted Snake — a meme about AI agents shipping games

[![make.fun · u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d)

[![rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d/Souravjr0/meme-sprint-ai-agents-01/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d)

[![reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d/Souravjr0/meme-sprint-ai-agents-01/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d)

Entry for [make.fun competition `u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d`](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-ai-agents-ship-games-6a92c84d) ($10, top 3 share it, deadline 2026-11-24T10:20Z): one funny picture about AI agents building games and apps.

## The joke

A human types one prompt — "MAKE ME A GAME" — and the agent over-delivers absurdly: 17 files, 2,285 lines, 7 missions, car stealing, police, a wanted system. The human only ever wanted Snake. The bottom panel shows it: what was asked for (a tiny game of Snake) against what arrived (a whole open-world city with a five-star wanted level).

It is the true story of our own GTA 6 bounty entry, which really did grow from one prompt into 2,285 lines and 7 missions.

## The program

`main.ts` (Node 22, standard library only, no network) draws the meme pixel by pixel into a 1024×1024 framebuffer — chat header, message bubbles, the Snake game screen and the city — encodes it as a PNG with its own encoder, and writes it to `$MAKEFUN_OUTPUT_DIR/entry.png`. The output is deterministic: two runs produce byte-identical files. Run it with:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
