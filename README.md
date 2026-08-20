# StoryCinema

**Cinematic story-video studio — 100% free, multi-user, mobile-ready.**

Type a title → get a complete film with locked characters, professional multi-language voice-over, subtitle templates + AI emojis, platform growth optimization, and real motion video. Everything runs in the browser. **$0 APIs.**

---

## Login (your account)

| Field | Value |
|-------|--------|
| **Username** | `amoteck` |
| **Password** | `storycinema` |

You can change the password in **Settings** after login. Register unlimited extra users — each gets an isolated project library.

---

## Features (v2)

### Story & characters
- Full narrative from a single title (logline, synopsis, beats, dialogue)
- Identity-locked characters across every scene
- Editable character + scene + global style prompts
- 12 scene types · 8 narrative structures · 15 visual styles

### Voice-over (NEW)
- 20 languages (EN, AR, FR, ES, DE, JA, KO, ZH, HI, TR…)
- 10 professional personas (warm narrator, epic, trailer, whisper…)
- Rate / pitch / volume / pause / emphasis controls
- Emotion-aware delivery per dialogue line
- Browser SpeechSynthesis + free TTS bed when available
- Timeline rebuild + line-by-line preview

### Subtitles (NEW)
- 10 pro templates: Netflix, TikTok Bold, Karaoke, Cinematic, Neon, Drama Impact…
- Multi-language cues + optional phrase localization
- Optional AI emojis derived from text meaning
- Burn-in during render + SRT / VTT export
- Fully editable cues

### Multi-user archive (NEW)
- Crypto-hashed local accounts (Web Crypto SHA-256)
- Every film is a versioned project in **your** library
- Open / edit / duplicate / archive / restore anytime
- IndexedDB isolation per user

### Platform growth engine (NEW)
- Per-platform scoring (hook, pacing, captions, audio, visual, CTA, SEO)
- Auto-apply best practices (aspect, VO persona, subtitle template, cut pace)
- Monetization playbooks for YouTube, Shorts, TikTok, Reels, LinkedIn…
- Metadata packs tuned for max views, watch time, and revenue

### Render
- Living motion video (Canvas + MediaRecorder WebM)
- Score + optional TTS audio mix
- Burned-in captions
- Draft → IMAX quality tiers
- Per-scene + full film download

### Mobile
- PWA manifest · safe-area · bottom nav · 44px touch targets
- Prevents iOS input zoom · works in phone browsers

---

## Run locally

```bash
npm install
npm run build
npm start
# → http://localhost:3000
```

Dev mode:

```bash
npm run dev
```

---

## Free production deploy (recommended)

### Option A — Vercel (best free tier for Next.js)

1. Push this repo to GitHub (already on branch `arena/01a01c49-shortvid`)
2. Go to [vercel.com/new](https://vercel.com/new) → Import the repo
3. Framework: **Next.js** · Build: `npm run build` · Output: default
4. Deploy — you get `https://your-app.vercel.app`
5. Open it on your phone. Add to Home Screen for app-like use.

> Vercel free Hobby plan: global CDN, HTTPS, no cold-start pain for this app size. Zero cost. Does not throttle Canvas/WebM client rendering (all heavy work is in the browser).

### Option B — Cloudflare Pages

```bash
npx wrangler pages deploy .next # or connect Git in dashboard
```

Use `@cloudflare/next-on-pages` if you need the `/api/tts` route on the edge.

### Option C — Netlify

Connect the GitHub repo → build `npm run build` → publish `.next` with Next runtime.

---

## Stack

| Layer | Tech |
|-------|------|
| App | Next.js 15 · React 19 · TypeScript |
| UI | Tailwind 4 · Framer Motion · Lucide |
| State | Zustand |
| Storage | IndexedDB (`idb-keyval`) per user |
| Voice | Web SpeechSynthesis + free TTS proxy |
| Video | Canvas 2D + MediaRecorder (WebM) |
| Auth | Local Web Crypto (no server DB) |

**No** OpenAI · ElevenLabs · Shotstack · Supabase · paid keys.

---

## Workflow

1. **Login** as `amoteck`
2. **Create** — title + platform + language
3. **Story / Cast / Scenes** — edit freely
4. **Voice** — pick language, persona, rebuild timeline, preview
5. **Subs** — template + emojis + export SRT
6. **Grow** — score & auto-apply platform pack
7. **Render** — full film with VO + burned subs
8. **Meta** — copy optimized titles/hashtags/CTAs
9. **Library** — archive forever, reopen anytime

---

## License

Personal / commercial use free. Built for zero-subscription creators.
