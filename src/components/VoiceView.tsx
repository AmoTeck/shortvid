"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import {
  VOICE_LANGUAGES,
  VOICE_PERSONAS,
  ensureVoicesLoaded,
  voicesForLanguage,
} from "@/lib/voice-engine";
import { VoicePersona } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { Mic, Play, Square, RefreshCw, Volume2 } from "lucide-react";

export function VoiceView() {
  const current = useApp((s) => s.current);
  const updateVoice = useApp((s) => s.updateVoice);
  const rebuildVoiceLines = useApp((s) => s.rebuildVoiceLines);
  const previewVoice = useApp((s) => s.previewVoice);
  const stopVoice = useApp((s) => s.stopVoice);
  const previewLine = useApp((s) => s.previewLine);
  const voicePlaying = useApp((s) => s.voicePlaying);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    ensureVoicesLoaded().then(setVoices);
    const id = window.setInterval(() => {
      const v = window.speechSynthesis?.getVoices() || [];
      if (v.length) setVoices(v);
    }, 500);
    return () => clearInterval(id);
  }, []);

  if (!current) return null;
  const v = current.voice;
  const langVoices = voicesForLanguage(v.language).length
    ? voicesForLanguage(v.language)
    : voices;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Mic className="w-6 h-6 text-indigo-400" /> Professional Voice-Over
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Multi-language · persona control · emotion-aware · $0 (browser + free TTS)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => rebuildVoiceLines()}>
            <RefreshCw className="w-4 h-4" /> Rebuild Timeline
          </button>
          {!voicePlaying ? (
            <button className="btn btn-primary btn-sm" onClick={() => previewVoice()}>
              <Play className="w-4 h-4" /> Preview All
            </button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={() => stopVoice()}>
              <Square className="w-4 h-4" /> Stop
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body space-y-4">
          <label className="flex items-center gap-3 !normal-case !tracking-normal !text-sm !font-semibold !text-[var(--color-text)] cursor-pointer">
            <input
              type="checkbox"
              checked={v.enabled}
              onChange={(e) => updateVoice({ enabled: e.target.checked })}
              className="w-4 h-4"
            />
            Enable voice-over in renders
          </label>

          <div className="field-grid">
            <div className="field">
              <label>Language</label>
              <select
                value={v.language}
                onChange={(e) => updateVoice({ language: e.target.value, voiceURI: "" })}
              >
                {VOICE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>System Voice ({langVoices.length} available)</label>
              <select
                value={v.voiceURI}
                onChange={(e) => updateVoice({ voiceURI: e.target.value })}
              >
                <option value="">Auto (best match)</option>
                {langVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang}){voice.localService ? " · local" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Persona</label>
              <select
                value={v.persona}
                onChange={(e) => {
                  const persona = e.target.value as VoicePersona;
                  const p = VOICE_PERSONAS.find((x) => x.id === persona);
                  updateVoice({
                    persona,
                    rate: p?.rate ?? v.rate,
                    pitch: p?.pitch ?? v.pitch,
                    volume: p?.volume ?? v.volume,
                  });
                }}
              >
                {VOICE_PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {(
              [
                ["rate", "Rate", 0.5, 2, 0.01],
                ["pitch", "Pitch", 0, 2, 0.01],
                ["volume", "Volume", 0, 1, 0.01],
                ["emphasis", "Emphasis", 0, 1, 0.01],
              ] as const
            ).map(([key, label, min, max, step]) => (
              <div className="field" key={key}>
                <label>
                  {label}: <span className="text-indigo-300">{Number(v[key]).toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={v[key]}
                  onChange={(e) => updateVoice({ [key]: Number(e.target.value) })}
                />
              </div>
            ))}
            <div className="field">
              <label>Pause between lines (ms): {v.pauseBetweenSentencesMs}</label>
              <input
                type="range"
                min={0}
                max={1200}
                step={20}
                value={v.pauseBetweenSentencesMs}
                onChange={(e) =>
                  updateVoice({ pauseBetweenSentencesMs: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={v.stabilizeRate}
                onChange={(e) => updateVoice({ stabilizeRate: e.target.checked })}
              />
              Stabilize rate
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={v.autoMatchCharacter}
                onChange={(e) => updateVoice({ autoMatchCharacter: e.target.checked })}
              />
              Auto-match character voices
            </label>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              previewLine(
                current.scenes[0]?.narration ||
                  "This is a professional StoryCinema voice-over sample."
              )
            }
          >
            <Volume2 className="w-4 h-4" /> Test current settings
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Voice Timeline ({current.voiceLines.length} lines)</h2>
        </div>
        <div className="card-body space-y-2 max-h-[50vh] overflow-y-auto">
          {!current.voiceLines.length && (
            <div className="empty-state py-6">
              <p className="mb-3">No voice lines yet.</p>
              <button className="btn btn-primary btn-sm" onClick={() => rebuildVoiceLines()}>
                Build from scenes
              </button>
            </div>
          )}
          {current.voiceLines.map((line, i) => (
            <div
              key={line.id}
              className="flex gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
            >
              <div className="text-xs text-[var(--color-text-dim)] w-14 shrink-0 pt-1">
                {formatDuration(line.startSec)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-[var(--color-text-muted)] mb-0.5">
                  #{i + 1} · {line.emotion} · {formatDuration(line.durationSec)}
                </div>
                <div className="text-sm leading-snug">{line.text}</div>
              </div>
              <button
                className="btn btn-ghost btn-sm shrink-0"
                onClick={() => previewLine(line.text)}
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
