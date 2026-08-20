/**
 * Professional multi-language voice-over engine.
 * Uses Web SpeechSynthesis (offline, $0) + optional free TTS audio blobs
 * mixed into renders via Web Audio API.
 */

import { Emotion, VoiceLine, VoicePersona, VoiceSettings, Scene, Character } from "./types";
import { uid } from "./utils";

export const VOICE_LANGUAGES: { code: string; label: string; tts: string }[] = [
  { code: "en-US", label: "English (US)", tts: "en" },
  { code: "en-GB", label: "English (UK)", tts: "en-GB" },
  { code: "ar-SA", label: "العربية", tts: "ar" },
  { code: "fr-FR", label: "Français", tts: "fr" },
  { code: "es-ES", label: "Español", tts: "es" },
  { code: "de-DE", label: "Deutsch", tts: "de" },
  { code: "it-IT", label: "Italiano", tts: "it" },
  { code: "pt-BR", label: "Português", tts: "pt" },
  { code: "ja-JP", label: "日本語", tts: "ja" },
  { code: "ko-KR", label: "한국어", tts: "ko" },
  { code: "zh-CN", label: "中文", tts: "zh-CN" },
  { code: "hi-IN", label: "हिन्दी", tts: "hi" },
  { code: "ru-RU", label: "Русский", tts: "ru" },
  { code: "tr-TR", label: "Türkçe", tts: "tr" },
  { code: "nl-NL", label: "Nederlands", tts: "nl" },
  { code: "pl-PL", label: "Polski", tts: "pl" },
  { code: "sv-SE", label: "Svenska", tts: "sv" },
  { code: "id-ID", label: "Indonesia", tts: "id" },
  { code: "th-TH", label: "ไทย", tts: "th" },
  { code: "vi-VN", label: "Tiếng Việt", tts: "vi" },
];

export const VOICE_PERSONAS: {
  id: VoicePersona;
  label: string;
  rate: number;
  pitch: number;
  volume: number;
  desc: string;
}[] = [
  { id: "narrator-warm", label: "Warm Narrator", rate: 0.95, pitch: 1.0, volume: 1, desc: "Intimate storytelling" },
  { id: "narrator-epic", label: "Epic Narrator", rate: 0.88, pitch: 0.85, volume: 1, desc: "Trailer / saga energy" },
  { id: "narrator-dark", label: "Dark Narrator", rate: 0.85, pitch: 0.75, volume: 0.95, desc: "Thriller / noir" },
  { id: "narrator-bright", label: "Bright Narrator", rate: 1.05, pitch: 1.15, volume: 1, desc: "Upbeat / comedy" },
  { id: "character-soft", label: "Soft Character", rate: 0.98, pitch: 1.2, volume: 0.9, desc: "Gentle dialogue" },
  { id: "character-intense", label: "Intense Character", rate: 1.1, pitch: 0.9, volume: 1, desc: "Conflict / climax" },
  { id: "documentary", label: "Documentary", rate: 1.0, pitch: 1.0, volume: 1, desc: "Clear & neutral" },
  { id: "trailer", label: "Trailer VO", rate: 0.82, pitch: 0.7, volume: 1, desc: "Deep cinematic drops" },
  { id: "whisper", label: "ASMR Whisper", rate: 0.9, pitch: 1.05, volume: 0.7, desc: "Close-mic intimacy" },
  { id: "broadcast", label: "Broadcast", rate: 1.08, pitch: 1.0, volume: 1, desc: "News / authority" },
];

export function defaultVoiceSettings(lang = "en-US"): VoiceSettings {
  const persona = VOICE_PERSONAS[0];
  return {
    enabled: true,
    language: lang,
    voiceURI: "",
    persona: persona.id,
    rate: persona.rate,
    pitch: persona.pitch,
    volume: persona.volume,
    pauseBetweenSentencesMs: 280,
    emphasis: 0.45,
    stabilizeRate: true,
    autoMatchCharacter: true,
  };
}

export function listBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

export function voicesForLanguage(lang: string): SpeechSynthesisVoice[] {
  const all = listBrowserVoices();
  const base = lang.split("-")[0].toLowerCase();
  const matched = all.filter(
    (v) =>
      v.lang.toLowerCase() === lang.toLowerCase() ||
      v.lang.toLowerCase().startsWith(base)
  );
  return matched.length ? matched : all;
}

export function pickBestVoice(lang: string, preferURI?: string): SpeechSynthesisVoice | null {
  const voices = listBrowserVoices();
  if (!voices.length) return null;
  if (preferURI) {
    const exact = voices.find((v) => v.voiceURI === preferURI || v.name === preferURI);
    if (exact) return exact;
  }
  const forLang = voicesForLanguage(lang);
  // Prefer local / premium-sounding names
  const ranked = [...forLang].sort((a, b) => {
    const score = (v: SpeechSynthesisVoice) => {
      let s = 0;
      if (v.localService) s += 3;
      const n = v.name.toLowerCase();
      if (/natural|neural|premium|enhanced|google|microsoft|samantha|daniel|aria|zira/.test(n)) s += 4;
      if (/compact|eloquence/.test(n)) s -= 2;
      return s;
    };
    return score(b) - score(a);
  });
  return ranked[0] || voices[0];
}

function emotionMods(emotion: Emotion): { rate: number; pitch: number; volume: number } {
  switch (emotion) {
    case "happy":
    case "excited":
    case "triumphant":
      return { rate: 1.08, pitch: 1.12, volume: 1 };
    case "sad":
    case "melancholy":
      return { rate: 0.88, pitch: 0.9, volume: 0.9 };
    case "angry":
    case "fierce":
      return { rate: 1.12, pitch: 0.85, volume: 1 };
    case "fearful":
    case "desperate":
      return { rate: 1.15, pitch: 1.2, volume: 0.95 };
    case "loving":
      return { rate: 0.92, pitch: 1.05, volume: 0.88 };
    case "determined":
    case "hopeful":
      return { rate: 0.95, pitch: 0.95, volume: 1 };
    case "surprised":
      return { rate: 1.1, pitch: 1.25, volume: 1 };
    default:
      return { rate: 1, pitch: 1, volume: 1 };
  }
}

export function applyPersona(settings: VoiceSettings): VoiceSettings {
  const p = VOICE_PERSONAS.find((x) => x.id === settings.persona);
  if (!p) return settings;
  return {
    ...settings,
    rate: settings.rate || p.rate,
    pitch: settings.pitch || p.pitch,
    volume: settings.volume || p.volume,
  };
}

/** Speak text with full professional controls. Returns estimated duration sec. */
export function speakText(
  text: string,
  opts: {
    language?: string;
    voiceURI?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    emotion?: Emotion;
    onEnd?: () => void;
    onBoundary?: (charIndex: number) => void;
  } = {}
): { cancel: () => void; estimatedSec: number } {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    opts.onEnd?.();
    return { cancel: () => {}, estimatedSec: estimateDuration(text, opts.rate || 1) };
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const lang = opts.language || "en-US";
  u.lang = lang;
  const voice = pickBestVoice(lang, opts.voiceURI);
  if (voice) u.voice = voice;
  const emo = emotionMods(opts.emotion || "neutral");
  u.rate = Math.max(0.5, Math.min(2, (opts.rate ?? 1) * emo.rate));
  u.pitch = Math.max(0, Math.min(2, (opts.pitch ?? 1) * emo.pitch));
  u.volume = Math.max(0, Math.min(1, (opts.volume ?? 1) * emo.volume));
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  if (opts.onBoundary) {
    u.onboundary = (e) => {
      if (typeof e.charIndex === "number") opts.onBoundary!(e.charIndex);
    };
  }
  window.speechSynthesis.speak(u);
  return {
    cancel: () => window.speechSynthesis.cancel(),
    estimatedSec: estimateDuration(text, u.rate),
  };
}

export function estimateDuration(text: string, rate = 1): number {
  // ~14 chars/sec at rate 1 for natural speech
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const base = Math.max(1.2, (words / 2.4) * (1 / Math.max(0.5, rate)));
  return base + 0.25;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** Build voice lines timeline from project scenes */
export function buildVoiceLines(
  scenes: Scene[],
  characters: Character[],
  voice: VoiceSettings
): VoiceLine[] {
  const lines: VoiceLine[] = [];
  let t = 0;
  for (const scene of scenes) {
    const sceneStart = t;
    const pieces: { text: string; characterId?: string; emotion: Emotion }[] = [];
    if (scene.narration?.trim()) {
      pieces.push({ text: scene.narration.trim(), emotion: "neutral" });
    }
    for (const d of scene.dialogue || []) {
      const ch = characters.find((c) => c.id === d.characterId);
      pieces.push({
        text: ch ? `${ch.name}: ${d.line}` : d.line,
        characterId: d.characterId,
        emotion: d.emotion,
      });
    }
    if (!pieces.length) {
      t += scene.durationSec;
      continue;
    }
    const totalText = pieces.map((p) => p.text).join(" ");
    const totalEst = estimateDuration(totalText, voice.rate);
    const scale = scene.durationSec / Math.max(totalEst, 0.1);
    let local = 0;
    for (const p of pieces) {
      const dur = estimateDuration(p.text, voice.rate) * Math.min(1.4, Math.max(0.5, scale));
      const ch = p.characterId ? characters.find((c) => c.id === p.characterId) : undefined;
      lines.push({
        id: uid("vo"),
        sceneId: scene.id,
        text: p.text,
        characterId: p.characterId,
        startSec: sceneStart + local,
        durationSec: Math.max(0.8, dur),
        emotion: p.emotion,
        voiceURI: ch?.voiceId || voice.voiceURI,
        rate: (ch?.voiceRate ?? voice.rate) * emotionMods(p.emotion).rate,
        pitch: (ch?.voicePitch ?? voice.pitch) * emotionMods(p.emotion).pitch,
        volume: voice.volume,
        status: "ready",
      });
      local += dur + voice.pauseBetweenSentencesMs / 1000;
    }
    t += scene.durationSec;
  }
  return lines;
}

/** Speak a sequence of voice lines with timing (preview mode) */
export async function playVoiceTimeline(
  lines: VoiceLine[],
  voice: VoiceSettings,
  opts?: { signal?: AbortSignal; onLine?: (line: VoiceLine, i: number) => void }
): Promise<void> {
  stopSpeaking();
  for (let i = 0; i < lines.length; i++) {
    if (opts?.signal?.aborted) break;
    const line = lines[i];
    opts?.onLine?.(line, i);
    await new Promise<void>((resolve) => {
      if (opts?.signal?.aborted) return resolve();
      speakText(line.text, {
        language: voice.language,
        voiceURI: line.voiceURI || voice.voiceURI,
        rate: line.rate ?? voice.rate,
        pitch: line.pitch ?? voice.pitch,
        volume: line.volume ?? voice.volume,
        emotion: line.emotion,
        onEnd: () => resolve(),
      });
      // safety timeout
      setTimeout(resolve, (line.durationSec + 2) * 1000);
    });
    if (voice.pauseBetweenSentencesMs > 0) {
      await new Promise((r) => setTimeout(r, voice.pauseBetweenSentencesMs));
    }
  }
}

/**
 * Build a procedural cinematic music + VO click bed as AudioBuffer
 * mixed for MediaRecorder. Real speech is layered live when possible.
 */
export async function createSoundtrackBuffer(
  durationSec: number,
  mood: string,
  sampleRate = 44100
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(durationSec * sampleRate), sampleRate);
  const now = 0;

  // Ambient pad
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  gain.gain.value = 0.04;

  const dark = /dark|noir|horror|tense|thriller/i.test(mood);
  const epic = /epic|triumphant|adventure|hopeful/i.test(mood);
  osc1.type = "sine";
  osc2.type = "triangle";
  osc1.frequency.value = dark ? 55 : epic ? 82 : 65;
  osc2.frequency.value = dark ? 82.5 : epic ? 123 : 98;
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc1.start(now);
  osc2.start(now);
  gain.gain.setValueAtTime(0, 0);
  gain.gain.linearRampToValueAtTime(0.05, 1.5);
  gain.gain.setValueAtTime(0.05, Math.max(0, durationSec - 2));
  gain.gain.linearRampToValueAtTime(0, durationSec);
  osc1.stop(durationSec);
  osc2.stop(durationSec);

  // Soft pulse
  const pulse = ctx.createOscillator();
  const pg = ctx.createGain();
  pulse.frequency.value = dark ? 1.8 : 2.4;
  pulse.type = "sine";
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.15;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain);
  lfoGain.connect(pg.gain);
  pulse.connect(pg);
  pg.gain.value = 0.02;
  pg.connect(ctx.destination);
  pulse.start(0);
  lfo.start(0);
  pulse.stop(durationSec);
  lfo.stop(durationSec);

  return ctx.startRendering();
}

/** Play an AudioBuffer through a MediaStreamDestination for recording */
export function bufferToStream(
  buffer: AudioBuffer,
  audioCtx: AudioContext
): { stream: MediaStream; stop: () => void; source: AudioBufferSourceNode } {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const dest = audioCtx.createMediaStreamDestination();
  const gain = audioCtx.createGain();
  gain.gain.value = 1;
  source.connect(gain);
  gain.connect(dest);
  gain.connect(audioCtx.destination); // optional monitor
  source.start(0);
  return {
    stream: dest.stream,
    source,
    stop: () => {
      try {
        source.stop();
      } catch {
        /* */
      }
    },
  };
}

/**
 * Schedule SpeechSynthesis lines roughly in sync while a render runs.
 * Best-effort — browsers don't expose TTS PCM, so this is for live monitor +
 * timing validation. Burned-in subtitles carry the words into the file.
 */
export function scheduleLiveVO(
  lines: VoiceLine[],
  voice: VoiceSettings,
  startWallMs: number,
  signal?: AbortSignal
) {
  const timers: number[] = [];
  for (const line of lines) {
    const delay = Math.max(0, line.startSec * 1000 - (performance.now() - startWallMs));
    const id = window.setTimeout(() => {
      if (signal?.aborted) return;
      speakText(line.text, {
        language: voice.language,
        voiceURI: line.voiceURI || voice.voiceURI,
        rate: line.rate ?? voice.rate,
        pitch: line.pitch ?? voice.pitch,
        volume: line.volume ?? voice.volume,
        emotion: line.emotion,
      });
    }, delay);
    timers.push(id);
  }
  return () => {
    timers.forEach(clearTimeout);
    stopSpeaking();
  };
}

/** Load voices (Chrome needs onvoiceschanged) */
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.onvoiceschanged = done;
    setTimeout(done, 500);
  });
}

/**
 * Fetch free multi-language TTS audio (MP3) via our API proxy.
 * Falls back to null if unavailable — SpeechSynthesis still works.
 */
export async function fetchTtsBlob(
  text: string,
  langCode: string
): Promise<Blob | null> {
  try {
    const chunks = splitForTts(text, 180);
    const parts: Blob[] = [];
    for (const chunk of chunks) {
      const url = `/api/tts?text=${encodeURIComponent(chunk)}&lang=${encodeURIComponent(langCode)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      parts.push(await res.blob());
    }
    if (!parts.length) return null;
    return new Blob(parts, { type: "audio/mpeg" });
  } catch {
    return null;
  }
}

function splitForTts(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [text];
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + s).length > maxLen && buf) {
      out.push(buf.trim());
      buf = s;
    } else buf += (buf ? " " : "") + s;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export async function blobToAudioBuffer(blob: Blob, ctx: AudioContext): Promise<AudioBuffer> {
  const arr = await blob.arrayBuffer();
  return ctx.decodeAudioData(arr.slice(0));
}
