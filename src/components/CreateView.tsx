"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import {
  STORY_STYLES,
  NARRATIVE_STRUCTURES,
  LENGTH_CONFIG,
} from "@/lib/story-engine";
import {
  AspectRatio,
  NarrativeStructure,
  StoryStyle,
  VideoLength,
  Platform,
} from "@/lib/types";
import { Clapperboard, Sparkles, Wand2, Zap, Film, Users, Tags } from "lucide-react";
import { motion } from "framer-motion";
import { getPlatformLabel, getAllPlatforms } from "@/lib/metadata-engine";
import { VOICE_LANGUAGES } from "@/lib/voice-engine";

const ASPECTS: { id: AspectRatio; label: string; desc: string }[] = [
  { id: "9:16", label: "9:16", desc: "Shorts / Reels / TikTok" },
  { id: "16:9", label: "16:9", desc: "YouTube / Cinema" },
  { id: "1:1", label: "1:1", desc: "Feed square" },
  { id: "4:5", label: "4:5", desc: "Instagram portrait" },
];

const LENGTHS: VideoLength[] = ["short", "medium", "long", "feature"];

const EXAMPLES = [
  "The Last Lighthouse Keeper",
  "Neon Hearts in Tokyo Rain",
  "A Letter from Tomorrow",
  "The Thief Who Stole Time",
  "Echoes of the Silent Forest",
  "When the Stars Forgot Their Names",
];

export function CreateView() {
  const createFromTitle = useApp((s) => s.createFromTitle);
  const settings = useApp((s) => s.settings);
  const user = useApp((s) => s.user);
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState<StoryStyle>(settings.defaultStyle);
  const [structure, setStructure] = useState<NarrativeStructure>("three-act");
  const [aspect, setAspect] = useState<AspectRatio>(settings.defaultAspect);
  const [length, setLength] = useState<VideoLength>("short");
  const [genreHint, setGenreHint] = useState("");
  const [globalStyle, setGlobalStyle] = useState("");
  const [platform, setPlatform] = useState<Platform>(settings.targetPlatform || "youtube-shorts");
  const [language, setLanguage] = useState(settings.defaultLanguage || "en-US");
  const [busy, setBusy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await createFromTitle({
        title: title.trim(),
        style,
        structure,
        aspectRatio: aspect,
        targetLength: length,
        genreHint: genreHint || undefined,
        globalStylePrompt: globalStyle || undefined,
        targetPlatform: platform,
        language,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 badge badge-accent mb-5">
          <Zap className="w-3 h-3" />
          100% Free · No API Keys · Runs in Browser
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          <span className="glow-text">StoryCinema</span>
        </h1>
        <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed px-2">
          Type a title. Get a complete cinematic story — voice-over, subtitles, locked characters,
          and platform-optimized growth packs. Saved forever in{" "}
          <strong className="text-white">{user?.displayName || "your"}</strong> library.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card mb-8"
      >
        <div className="card-body space-y-5">
          <div className="field">
            <label htmlFor="title">Story Title — that&apos;s all you need</label>
            <div className="relative">
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. The Clockmaker's Daughter"
                className="text-lg py-4 pr-12"
                autoFocus
              />
              <Clapperboard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-dim)]" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="chip" onClick={() => setTitle(ex)}>
                {ex}
              </button>
            ))}
          </div>

          <div className="field">
            <label>Visual Style</label>
            <div className="chip-group">
              {STORY_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${style === s ? "active" : ""}`}
                  onClick={() => setStyle(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label>Narrative Structure</label>
              <select
                value={structure}
                onChange={(e) => setStructure(e.target.value as NarrativeStructure)}
              >
                {NARRATIVE_STRUCTURES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Length</label>
              <select value={length} onChange={(e) => setLength(e.target.value as VideoLength)}>
                {LENGTHS.map((l) => (
                  <option key={l} value={l}>
                    {LENGTH_CONFIG[l].label} · ~{LENGTH_CONFIG[l].scenes} scenes
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Aspect Ratio</label>
              <select value={aspect} onChange={(e) => setAspect(e.target.value as AspectRatio)}>
                {ASPECTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.desc}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Target Platform (auto-optimize)</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                {getAllPlatforms().map((p) => (
                  <option key={p} value={p}>
                    {getPlatformLabel(p)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Voice / Subtitle Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {VOICE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Genre Hint (optional)</label>
              <input
                value={genreHint}
                onChange={(e) => setGenreHint(e.target.value)}
                placeholder="horror, romance, sci-fi…"
              />
            </div>
          </div>

          <button
            type="button"
            className="text-sm text-[var(--color-accent)] font-semibold"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "− Hide" : "+"} Advanced style prompt
          </button>

          {showAdvanced && (
            <div className="field">
              <label>Global Style Prompt (applied to every scene)</label>
              <textarea
                value={globalStyle}
                onChange={(e) => setGlobalStyle(e.target.value)}
                placeholder="e.g. Shot on 35mm anamorphic, Denis Villeneuve lighting, desert planet palette, dust motes in god rays…"
                rows={3}
              />
            </div>
          )}

          <button
            className="btn btn-primary btn-lg w-full"
            disabled={!title.trim() || busy}
            onClick={handleCreate}
          >
            {busy ? (
              <>
                <Wand2 className="w-5 h-5 animate-spin" />
                Writing your film<span className="loading-dots" />
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Complete Story Film
              </>
            )}
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            icon: Users,
            title: "Locked Characters",
            desc: "Every character keeps the same face, wardrobe, and identity across every scene — short or feature.",
          },
          {
            icon: Film,
            title: "Living Motion Scenes",
            desc: "Real animated video per scene: breathing, blinking, camera moves, weather, dialogue — not static slides.",
          },
          {
            icon: Tags,
            title: "Pro Platform Metadata",
            desc: "YouTube, TikTok, Reels, LinkedIn & more — titles, hooks, hashtags, CTAs, chapters, thumbnails.",
          },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="card"
          >
            <div className="card-body">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mb-3 border border-indigo-500/20">
                <f.icon className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
