"use client";

import { useApp } from "@/lib/store";
import {
  SUBTITLE_TEMPLATES,
  SUBTITLE_LANGUAGES,
  enhanceWithEmoji,
} from "@/lib/subtitle-engine";
import { SubtitleTemplateId } from "@/lib/types";
import { formatDuration, downloadBlob } from "@/lib/utils";
import { Captions, Download, RefreshCw, Sparkles } from "lucide-react";
import { LivePreview } from "./LivePreview";

export function SubtitlesView() {
  const current = useApp((s) => s.current);
  const updateSubtitles = useApp((s) => s.updateSubtitles);
  const rebuildSubtitles = useApp((s) => s.rebuildSubtitles);
  const exportSubtitles = useApp((s) => s.exportSubtitles);
  const selectedSceneId = useApp((s) => s.selectedSceneId);

  if (!current) return null;
  const sub = current.subtitles;
  const scene =
    current.scenes.find((s) => s.id === selectedSceneId) || current.scenes[0];

  const download = (fmt: "srt" | "vtt") => {
    const text = exportSubtitles(fmt);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `${current.title.replace(/\s+/g, "_")}.${fmt}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Captions className="w-6 h-6 text-cyan-400" /> Subtitles Studio
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            10 pro templates · multi-language · optional AI emojis · SRT/VTT export
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => rebuildSubtitles()}>
            <RefreshCw className="w-4 h-4" /> Rebuild
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => download("srt")}>
            <Download className="w-4 h-4" /> SRT
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => download("vtt")}>
            <Download className="w-4 h-4" /> VTT
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="card">
            <div className="card-body space-y-4">
              <div className="field">
                <label>Language</label>
                <select
                  value={sub.language}
                  onChange={(e) => {
                    updateSubtitles({ language: e.target.value });
                    rebuildSubtitles({ language: e.target.value });
                  }}
                >
                  {SUBTITLE_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Template</label>
                <div className="chip-group">
                  {SUBTITLE_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`chip ${sub.templateId === t.id ? "active" : ""}`}
                      onClick={() => {
                        updateSubtitles({ templateId: t.id });
                        rebuildSubtitles({ templateId: t.id as SubtitleTemplateId });
                      }}
                      title={t.desc}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer !normal-case !tracking-normal !text-sm !font-semibold !text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={sub.emojisEnabled}
                  onChange={(e) => {
                    updateSubtitles({ emojisEnabled: e.target.checked });
                    rebuildSubtitles({ emojisEnabled: e.target.checked });
                  }}
                />
                <Sparkles className="w-4 h-4 text-amber-300" />
                AI emojis from text meaning (optional)
              </label>

              <div className="field">
                <label>Font scale: {sub.fontScale.toFixed(2)}</label>
                <input
                  type="range"
                  min={0.7}
                  max={1.6}
                  step={0.05}
                  value={sub.fontScale}
                  onChange={(e) => updateSubtitles({ fontScale: Number(e.target.value) })}
                />
              </div>

              <div className="field">
                <label>Position</label>
                <select
                  value={sub.position}
                  onChange={(e) =>
                    updateSubtitles({
                      position: e.target.value as "bottom" | "center" | "top",
                    })
                  }
                >
                  <option value="bottom">Bottom</option>
                  <option value="center">Center (short-form)</option>
                  <option value="top">Top</option>
                </select>
              </div>
            </div>
          </div>

          {scene && (
            <div
              className="rounded-xl overflow-hidden bg-black border border-[var(--color-border)] relative mx-auto"
              style={{
                aspectRatio: current.aspectRatio.replace(":", "/"),
                maxWidth: 360,
                width: "100%",
              }}
            >
              <LivePreview
                scene={scene}
                characters={current.characters}
                style={current.style}
                aspectRatio={current.aspectRatio}
              />
              {/* Overlay hint — full burn-in happens on render */}
              <div className="absolute bottom-4 left-2 right-2 text-center pointer-events-none">
                <span className="inline-block px-2 py-1 rounded bg-black/60 text-white text-xs font-semibold">
                  {sub.emojisEnabled
                    ? enhanceWithEmoji(scene.narration.slice(0, 60) || scene.title)
                    : (scene.narration || scene.title).slice(0, 60)}
                </span>
              </div>
              <span className="absolute top-2 left-2 badge badge-accent text-[10px]">
                LIVE · {sub.templateId}
              </span>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-bold">Cues ({sub.cues.length})</h2>
          </div>
          <div className="card-body space-y-2 max-h-[70vh] overflow-y-auto">
            {!sub.cues.length && (
              <div className="empty-state py-8">
                <button className="btn btn-primary" onClick={() => rebuildSubtitles()}>
                  Generate Subtitles
                </button>
              </div>
            )}
            {sub.cues.map((c, i) => (
              <div
                key={c.id}
                className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
              >
                <div className="flex justify-between text-[11px] text-[var(--color-text-dim)] mb-1">
                  <span>
                    #{i + 1} · {formatDuration(c.startSec)} → {formatDuration(c.endSec)}
                  </span>
                  {c.speaker && <span className="text-indigo-300">{c.speaker}</span>}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-snug">
                  {sub.emojisEnabled && c.textWithEmoji ? c.textWithEmoji : c.text}
                </div>
                <textarea
                  className="mt-2 text-sm"
                  rows={2}
                  value={sub.emojisEnabled && c.textWithEmoji ? c.textWithEmoji : c.text}
                  onChange={(e) => {
                    const cues = sub.cues.map((x) =>
                      x.id === c.id
                        ? sub.emojisEnabled
                          ? { ...x, textWithEmoji: e.target.value, text: e.target.value }
                          : { ...x, text: e.target.value }
                        : x
                    );
                    updateSubtitles({ cues });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
