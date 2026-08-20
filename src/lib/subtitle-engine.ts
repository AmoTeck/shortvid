/**
 * Professional multi-language subtitles with templates + AI emoji enhancement.
 * Fully offline — $0.
 */

import {
  Emotion,
  Scene,
  SubtitleCue,
  SubtitleTemplateId,
  SubtitleTrack,
  Character,
  Platform,
} from "./types";
import { uid } from "./utils";
import { estimateDuration } from "./voice-engine";

export const SUBTITLE_TEMPLATES: {
  id: SubtitleTemplateId;
  label: string;
  desc: string;
  preview: string;
}[] = [
  { id: "netflix", label: "Netflix Clean", desc: "Soft white, subtle shadow, TV-safe", preview: "Clean · readable" },
  { id: "tiktok-bold", label: "TikTok Bold", desc: "Huge centered words, high retention", preview: "BOLD HOOK" },
  { id: "karaoke", label: "Karaoke Pop", desc: "Word-by-word highlight energy", preview: "word · by · word" },
  { id: "cinematic", label: "Cinematic", desc: "Letterboxed film credits feel", preview: "Elegant serif" },
  { id: "minimal", label: "Minimal", desc: "Tiny lower-third, art-house", preview: "quiet text" },
  { id: "youtube-classic", label: "YouTube Classic", desc: "Yellow outline, max clarity", preview: "Classic YT" },
  { id: "neon-glow", label: "Neon Glow", desc: "Cyber / night aesthetic", preview: "◈ neon" },
  { id: "typewriter", label: "Typewriter", desc: "Mystery / documentary reveal", preview: "reveal…" },
  { id: "instagram-clean", label: "IG Clean", desc: "Aesthetic soft caption", preview: "soft · clean" },
  { id: "drama-impact", label: "Drama Impact", desc: "One big emotional word stacks", preview: "IMPACT" },
];

export const SUBTITLE_LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "id", label: "Indonesia" },
  { code: "nl", label: "Nederlands" },
];

/* ── Lightweight offline "AI" emoji mapper ── */
const EMOJI_RULES: { re: RegExp; emoji: string; weight: number }[] = [
  { re: /\b(love|heart|kiss|romance|عاشق|حب)\b/i, emoji: "❤️", weight: 3 },
  { re: /\b(war|battle|fight|clash|حرب|قتال)\b/i, emoji: "⚔️", weight: 3 },
  { re: /\b(fire|burn|flame|نار)\b/i, emoji: "🔥", weight: 2 },
  { re: /\b(death|die|kill|grave|موت)\b/i, emoji: "💀", weight: 3 },
  { re: /\b(cry|tear|sad|grief|حزن|دمع)\b/i, emoji: "😢", weight: 3 },
  { re: /\b(happy|joy|laugh|smile|فرح)\b/i, emoji: "✨", weight: 2 },
  { re: /\b(fear|scared|terror|خوف)\b/i, emoji: "😨", weight: 3 },
  { re: /\b(run|chase|escape|هرب|ركض)\b/i, emoji: "💨", weight: 2 },
  { re: /\b(secret|mystery|hidden|سر)\b/i, emoji: "🕵️", weight: 2 },
  { re: /\b(night|moon|dark|ليل|ظلام)\b/i, emoji: "🌙", weight: 2 },
  { re: /\b(sun|dawn|morning|شمس|فجر)\b/i, emoji: "🌅", weight: 2 },
  { re: /\b(storm|thunder|rain|عاصفة|مطر)\b/i, emoji: "⛈️", weight: 2 },
  { re: /\b(king|queen|crown|empire|ملك)\b/i, emoji: "👑", weight: 2 },
  { re: /\b(magic|spell|wizard|سحر)\b/i, emoji: "✨", weight: 2 },
  { re: /\b(space|star|galaxy|planet|نجم|فضاء)\b/i, emoji: "🚀", weight: 2 },
  { re: /\b(money|gold|rich|مال|ذهب)\b/i, emoji: "💰", weight: 2 },
  { re: /\b(time|clock|hour|وقت|ساعة)\b/i, emoji: "⏳", weight: 2 },
  { re: /\b(truth|lie|secret reveal|حقيقة)\b/i, emoji: "💡", weight: 2 },
  { re: /\b(hope|dream|wish|أمل|حلم)\b/i, emoji: "🌟", weight: 2 },
  { re: /\b(danger|warning|risk|خطر)\b/i, emoji: "⚠️", weight: 2 },
  { re: /\b(power|strong|force|قوة)\b/i, emoji: "💪", weight: 2 },
  { re: /\b(end|final|last|نهاية|اخير)\b/i, emoji: "🎬", weight: 1 },
  { re: /\b(begin|start|first|بداية)\b/i, emoji: "🎬", weight: 1 },
  { re: /\b(you won't|nobody|shock|twist)\b/i, emoji: "😱", weight: 3 },
  { re: /\?\s*$/i, emoji: "❓", weight: 1 },
  { re: /!\s*$/i, emoji: "❗", weight: 1 },
];

const EMOTION_EMOJI: Partial<Record<Emotion, string>> = {
  happy: "😊",
  sad: "💔",
  angry: "😠",
  fearful: "😰",
  surprised: "😲",
  determined: "💪",
  loving: "💕",
  excited: "⚡",
  melancholy: "🌧️",
  fierce: "🔥",
  hopeful: "🌅",
  desperate: "🆘",
  triumphant: "🏆",
};

export function enhanceWithEmoji(text: string, emotion?: Emotion): string {
  const hits: { emoji: string; weight: number }[] = [];
  for (const rule of EMOJI_RULES) {
    if (rule.re.test(text)) hits.push({ emoji: rule.emoji, weight: rule.weight });
  }
  if (emotion && EMOTION_EMOJI[emotion]) {
    hits.push({ emoji: EMOTION_EMOJI[emotion]!, weight: 2 });
  }
  if (!hits.length) return text;
  hits.sort((a, b) => b.weight - a.weight);
  const unique: string[] = [];
  for (const h of hits) {
    if (!unique.includes(h.emoji)) unique.push(h.emoji);
    if (unique.length >= 2) break;
  }
  // Placement: start for hooks, end for soft
  const isHook = text.length < 48 || /[!?]$/.test(text.trim());
  if (isHook) return `${unique.join("")} ${text}`;
  return `${text} ${unique.join("")}`;
}

/* ── Tiny offline phrase dictionary for subtitle languages ── */
const PHRASE_MAP: Record<string, Record<string, string>> = {
  ar: {
    "the end": "النهاية",
    "presents": "يقدم",
    "if we stop now": "إذا توقفنا الآن",
    "tell me the truth": "قل لي الحقيقة",
    "i know what i have to do": "أعرف ما يجب عليّ فعله",
    "you're not alone": "لست وحدك",
    "come back to me": "عد إليّ",
    "there's still a way": "لا يزال هناك طريق",
  },
  fr: {
    "the end": "Fin",
    "presents": "présente",
    "tell me the truth": "Dis-moi la vérité",
    "you're not alone": "Tu n'es pas seul",
    "come back to me": "Reviens vers moi",
  },
  es: {
    "the end": "Fin",
    "presents": "presenta",
    "tell me the truth": "Dime la verdad",
    "you're not alone": "No estás solo",
    "come back to me": "Vuelve a mí",
  },
  de: {
    "the end": "Ende",
    "presents": "präsentiert",
    "tell me the truth": "Sag mir die Wahrheit",
    "you're not alone": "Du bist nicht allein",
  },
  tr: {
    "the end": "Son",
    "presents": "sunar",
    "tell me the truth": "Gerçeği söyle bana",
    "you're not alone": "Yalnız değilsin",
  },
};

export function localizeText(text: string, lang: string): string {
  if (!lang || lang === "en") return text;
  const dict = PHRASE_MAP[lang];
  if (!dict) return text;
  let out = text;
  for (const [en, loc] of Object.entries(dict)) {
    const re = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, loc);
  }
  return out;
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur.trim());
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

export function buildSubtitles(opts: {
  scenes: Scene[];
  characters: Character[];
  language: string;
  templateId: SubtitleTemplateId;
  emojisEnabled: boolean;
  fontScale?: number;
  platform?: Platform;
}): SubtitleTrack {
  const maxChars =
    opts.templateId === "tiktok-bold" || opts.templateId === "drama-impact"
      ? 28
      : opts.templateId === "minimal"
        ? 48
        : 42;

  const position: SubtitleTrack["position"] =
    opts.templateId === "tiktok-bold" || opts.templateId === "drama-impact"
      ? "center"
      : opts.templateId === "cinematic"
        ? "bottom"
        : "bottom";

  const cues: SubtitleCue[] = [];
  let t = 0;

  for (const scene of opts.scenes) {
    const bits: { text: string; emotion?: Emotion; speaker?: string }[] = [];
    if (scene.narration?.trim()) {
      bits.push({ text: scene.narration.trim(), emotion: "neutral" });
    }
    for (const d of scene.dialogue || []) {
      const ch = opts.characters.find((c) => c.id === d.characterId);
      bits.push({ text: d.line, emotion: d.emotion, speaker: ch?.name });
    }
    if (!bits.length) {
      t += scene.durationSec;
      continue;
    }

    const weights = bits.map((b) => Math.max(1, b.text.split(/\s+/).length));
    const sumW = weights.reduce((a, b) => a + b, 0);
    let local = 0.15; // small lead-in

    bits.forEach((b, i) => {
      const share = (weights[i] / sumW) * Math.max(1.5, scene.durationSec - 0.4);
      const start = t + local;
      const end = Math.min(t + scene.durationSec - 0.05, start + share);
      let text = localizeText(b.text, opts.language);
      // Platform hook compression for short-form
      if (
        opts.platform &&
        ["tiktok", "youtube-shorts", "instagram-reels", "snapchat"].includes(opts.platform) &&
        text.length > 90
      ) {
        text = text.slice(0, 87).trim() + "…";
      }
      const withEmoji = opts.emojisEnabled ? enhanceWithEmoji(text, b.emotion) : text;
      const wrapped = wrapLines(withEmoji, maxChars).join("\n");
      cues.push({
        id: uid("cue"),
        startSec: start,
        endSec: Math.max(start + 0.6, end),
        text: wrapLines(text, maxChars).join("\n"),
        textWithEmoji: wrapped,
        speaker: b.speaker,
        emotion: b.emotion,
      });
      local += share;
    });

    t += scene.durationSec;
  }

  const langLabel = SUBTITLE_LANGUAGES.find((l) => l.code === opts.language)?.label || opts.language;

  return {
    language: opts.language,
    languageLabel: langLabel,
    templateId: opts.templateId,
    emojisEnabled: opts.emojisEnabled,
    cues,
    fontScale: opts.fontScale ?? 1,
    position,
    maxCharsPerLine: maxChars,
  };
}

export function exportSrt(track: SubtitleTrack, useEmoji = true): string {
  const fmt = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  };
  return track.cues
    .map((c, i) => {
      const body = useEmoji && c.textWithEmoji ? c.textWithEmoji : c.text;
      return `${i + 1}\n${fmt(c.startSec)} --> ${fmt(c.endSec)}\n${body}\n`;
    })
    .join("\n");
}

export function exportVtt(track: SubtitleTrack, useEmoji = true): string {
  const fmt = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
  };
  const body = track.cues
    .map((c) => {
      const text = useEmoji && c.textWithEmoji ? c.textWithEmoji : c.text;
      return `${fmt(c.startSec)} --> ${fmt(c.endSec)}\n${text}\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

/** Draw subtitle cue onto canvas with template styling */
export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  track: SubtitleTrack,
  timeSec: number,
  karaokeProgress = 0
) {
  const cue = track.cues.find((c) => timeSec >= c.startSec && timeSec < c.endSec);
  if (!cue) return;

  const text = track.emojisEnabled && cue.textWithEmoji ? cue.textWithEmoji : cue.text;
  const lines = text.split("\n");
  const scale = track.fontScale * (w / 400);
  const template = track.templateId;

  let fontSize = Math.round(16 * scale);
  let fontWeight = "700";
  let fontFamily = "system-ui, sans-serif";
  let fill = "#ffffff";
  let stroke = "rgba(0,0,0,0.85)";
  let strokeWidth = 4 * scale;
  let yBase =
    track.position === "top" ? h * 0.12 : track.position === "center" ? h * 0.5 : h * 0.82;
  let bg = false;
  let bgColor = "rgba(0,0,0,0.55)";
  let uppercase = false;
  let letterSpace = 0;
  let glow = false;

  switch (template) {
    case "netflix":
      fontSize = Math.round(15 * scale);
      fontWeight = "500";
      strokeWidth = 3 * scale;
      break;
    case "tiktok-bold":
      fontSize = Math.round(22 * scale);
      fontWeight = "900";
      uppercase = true;
      stroke = "#000";
      strokeWidth = 6 * scale;
      yBase = h * 0.48;
      break;
    case "karaoke":
      fontSize = Math.round(20 * scale);
      fontWeight = "800";
      strokeWidth = 5 * scale;
      break;
    case "cinematic":
      fontSize = Math.round(14 * scale);
      fontWeight = "400";
      fontFamily = "Georgia, serif";
      letterSpace = 2;
      strokeWidth = 2 * scale;
      yBase = h * 0.88;
      break;
    case "minimal":
      fontSize = Math.round(12 * scale);
      fontWeight = "400";
      strokeWidth = 0;
      fill = "rgba(255,255,255,0.9)";
      bg = true;
      bgColor = "rgba(0,0,0,0.35)";
      break;
    case "youtube-classic":
      fontSize = Math.round(17 * scale);
      fill = "#ffff00";
      stroke = "#000";
      strokeWidth = 4 * scale;
      fontWeight = "700";
      break;
    case "neon-glow":
      fontSize = Math.round(18 * scale);
      fill = "#67e8f9";
      stroke = "#a78bfa";
      strokeWidth = 2 * scale;
      glow = true;
      fontWeight = "800";
      break;
    case "typewriter":
      fontSize = Math.round(15 * scale);
      fontFamily = "ui-monospace, monospace";
      fontWeight = "500";
      bg = true;
      break;
    case "instagram-clean":
      fontSize = Math.round(15 * scale);
      fontWeight = "600";
      bg = true;
      bgColor = "rgba(0,0,0,0.45)";
      strokeWidth = 0;
      break;
    case "drama-impact":
      fontSize = Math.round(26 * scale);
      fontWeight = "900";
      uppercase = true;
      yBase = h * 0.5;
      strokeWidth = 7 * scale;
      break;
  }

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  if (letterSpace) (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${letterSpace}px`;

  const lineH = fontSize * 1.35;
  const blockH = lines.length * lineH + (bg ? 16 * scale : 0);
  const maxW = Math.max(...lines.map((l) => ctx.measureText(uppercase ? l.toUpperCase() : l).width));

  if (bg) {
    const padX = 14 * scale;
    const padY = 8 * scale;
    const bx = w / 2 - maxW / 2 - padX;
    const by = yBase - blockH / 2 - padY / 2;
    ctx.fillStyle = bgColor;
    roundRect(ctx, bx, by, maxW + padX * 2, blockH + padY, 8 * scale);
    ctx.fill();
  }

  lines.forEach((raw, i) => {
    const line = uppercase ? raw.toUpperCase() : raw;
    const y = yBase - ((lines.length - 1) * lineH) / 2 + i * lineH;

    if (glow) {
      ctx.shadowColor = fill;
      ctx.shadowBlur = 18 * scale;
    }

    if (template === "karaoke") {
      // progressive fill
      const prog = Math.min(1, Math.max(0, karaokeProgress || (timeSec - cue.startSec) / Math.max(0.1, cue.endSec - cue.startSec)));
      const cut = Math.floor(line.length * prog);
      const done = line.slice(0, cut);
      const rest = line.slice(cut);
      if (strokeWidth > 0) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = stroke;
        ctx.lineJoin = "round";
        ctx.strokeText(line, w / 2, y);
      }
      const fullW = ctx.measureText(line).width;
      ctx.fillStyle = "#22d3ee";
      ctx.fillText(done, w / 2 - fullW / 2 + ctx.measureText(done).width / 2, y);
      ctx.fillStyle = "#ffffff";
      // draw rest offset — simpler: full white then cyan overlay via clip
      ctx.fillText(line, w / 2, y);
      ctx.save();
      ctx.beginPath();
      ctx.rect(w / 2 - fullW / 2, y - lineH / 2, fullW * prog, lineH);
      ctx.clip();
      ctx.fillStyle = "#22d3ee";
      ctx.fillText(line, w / 2, y);
      ctx.restore();
      void rest;
      return;
    }

    if (strokeWidth > 0) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = stroke;
      ctx.lineJoin = "round";
      ctx.strokeText(line, w / 2, y);
    }
    ctx.fillStyle = fill;
    ctx.fillText(line, w / 2, y);
    ctx.shadowBlur = 0;
  });

  // Speaker label
  if (cue.speaker && (template === "netflix" || template === "cinematic")) {
    ctx.font = `600 ${Math.round(11 * scale)}px system-ui`;
    ctx.fillStyle = "rgba(160,200,255,0.9)";
    ctx.fillText(cue.speaker.toUpperCase(), w / 2, yBase - blockH / 2 - 14 * scale);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function defaultSubtitleTrack(): SubtitleTrack {
  return {
    language: "en",
    languageLabel: "English",
    templateId: "netflix",
    emojisEnabled: false,
    cues: [],
    fontScale: 1,
    position: "bottom",
    maxCharsPerLine: 42,
  };
}

/** Re-time cues if scene durations change */
export function rebuildFromScenes(
  track: SubtitleTrack,
  scenes: Scene[],
  characters: Character[],
  platform?: Platform
): SubtitleTrack {
  return buildSubtitles({
    scenes,
    characters,
    language: track.language,
    templateId: track.templateId,
    emojisEnabled: track.emojisEnabled,
    fontScale: track.fontScale,
    platform,
  });
}

void estimateDuration;
