# StoryCinema

**Cinematic story-video studio — 100% free, zero API keys, runs entirely in your browser.**

Type a title → get a complete film: locked characters, editable scene prompts, living motion video, and professional multi-platform metadata.

## Features

1. **Storytelling engine** — full narrative from a single title (logline, synopsis, beats, dialogue)
2. **Character consistency** — identity-locked appearance + consistency prompts across every scene
3. **Editable prompts** — full control over character prompts, scene visual prompts, global style
4. **Scene types & narrative structures** — 12 scene types, 8 structures (Three-Act, Hero’s Journey, Save the Cat…)
5. **Per-scene living video** — real motion (breathing, blinks, camera, weather, dialogue) via Canvas + MediaRecorder — not static slideshows
6. **Title → full film** — one click generates story, cast, scenes, metadata
7. **Pro social metadata** — YouTube, Shorts, TikTok, Reels, Feed, Facebook, X, LinkedIn, Snapchat, Pinterest
8. **Ready to use** — no demo data, no external AI subscriptions
9. **$0 cost** — local story AI + local renderer + IndexedDB storage
10. **Editable / regenerable metadata** — per platform, with thumbnail variants
11. **Film-grade controls** — camera angles, lighting moods, color grades, transitions, quality tiers (Draft → IMAX)
12. **Library, autosave, download WebM scenes & full film**

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Zustand + idb-keyval (IndexedDB)
- Framer Motion + Lucide
- **No OpenAI / ElevenLabs / Shotstack / Supabase required**

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Workflow

1. **Create** — enter a title, pick style / structure / length / aspect
2. **Story** — edit bible, global style prompt, themes
3. **Characters** — lock appearance, rebuild consistency prompts
4. **Scenes** — edit narration, dialogue, camera, lighting, visual prompts; render one-by-one
5. **Render** — full film with title/end cards; download WebM
6. **Metadata** — generate & tweak platform packs + thumbnails

Everything stays on your device.
