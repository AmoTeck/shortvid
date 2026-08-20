"use client";

import { useApp } from "@/lib/store";
import { STORY_STYLES, NARRATIVE_STRUCTURES, LENGTH_CONFIG } from "@/lib/story-engine";
import { AspectRatio, NarrativeStructure, StoryStyle, VideoLength } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { RefreshCw, Save, Play, BookOpen } from "lucide-react";

export function StoryView() {
  const current = useApp((s) => s.current);
  const updateProject = useApp((s) => s.updateProject);
  const persist = useApp((s) => s.persist);
  const regenerateAllScenes = useApp((s) => s.regenerateAllScenes);
  const generateMetadata = useApp((s) => s.generateMetadata);
  const setTab = useApp((s) => s.setTab);
  const renderAll = useApp((s) => s.renderAll);
  const rendering = useApp((s) => s.rendering);

  if (!current) return null;

  const dur = current.scenes.reduce((s, sc) => s + sc.durationSec, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span className="badge badge-accent">{current.status}</span>
            <span className="badge">{current.genre.join(", ")}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">{current.title}</h1>
          <p className="text-[var(--color-text-muted)] mt-1 max-w-2xl">{current.logline}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => persist()}>
            <Save className="w-4 h-4" /> Save
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => regenerateAllScenes()}>
            <RefreshCw className="w-4 h-4" /> Regen Scenes
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={rendering}
            onClick={() => {
              generateMetadata();
              renderAll();
              setTab("render");
            }}
          >
            <Play className="w-4 h-4" /> Render Full Film
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {[
          { label: "Scenes", value: current.scenes.length },
          { label: "Characters", value: current.characters.length },
          { label: "Duration", value: formatDuration(dur) },
          { label: "Structure", value: current.structure.replace(/-/g, " ") },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className="card-body py-3">
              <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{s.label}</div>
              <div className="text-xl font-bold capitalize">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Story Bible</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="field">
            <label>Title</label>
            <input
              value={current.title}
              onChange={(e) => updateProject({ title: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Logline</label>
            <textarea
              value={current.logline}
              onChange={(e) => updateProject({ logline: e.target.value })}
              rows={2}
            />
          </div>
          <div className="field">
            <label>Synopsis</label>
            <textarea
              value={current.synopsis}
              onChange={(e) => updateProject({ synopsis: e.target.value })}
              rows={5}
            />
          </div>

          <div className="field-grid">
            <div className="field">
              <label>Visual Style</label>
              <select
                value={current.style}
                onChange={(e) => updateProject({ style: e.target.value as StoryStyle })}
              >
                {STORY_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Narrative Structure</label>
              <select
                value={current.structure}
                onChange={(e) => updateProject({ structure: e.target.value as NarrativeStructure })}
              >
                {NARRATIVE_STRUCTURES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Aspect Ratio</label>
              <select
                value={current.aspectRatio}
                onChange={(e) => updateProject({ aspectRatio: e.target.value as AspectRatio })}
              >
                {(["9:16", "16:9", "1:1", "4:5"] as AspectRatio[]).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Target Length</label>
              <select
                value={current.targetLength}
                onChange={(e) => {
                  const tl = e.target.value as VideoLength;
                  updateProject({
                    targetLength: tl,
                    targetDurationSec: LENGTH_CONFIG[tl].duration,
                  });
                }}
              >
                {(Object.keys(LENGTH_CONFIG) as VideoLength[]).map((l) => (
                  <option key={l} value={l}>
                    {LENGTH_CONFIG[l].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Tone</label>
              <input value={current.tone} onChange={(e) => updateProject({ tone: e.target.value })} />
            </div>
            <div className="field">
              <label>Soundtrack Mood</label>
              <input
                value={current.soundtrackMood}
                onChange={(e) => updateProject({ soundtrackMood: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label>Themes (comma-separated)</label>
            <input
              value={current.themes.join(", ")}
              onChange={(e) =>
                updateProject({
                  themes: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                })
              }
            />
          </div>

          <div className="field">
            <label>Global Style Prompt — applied to every scene & character frame</label>
            <textarea
              className="prompt-box w-full"
              style={{ fontFamily: "inherit", maxHeight: "none" }}
              value={current.globalStylePrompt}
              onChange={(e) => updateProject({ globalStylePrompt: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Color Palette</h2>
        </div>
        <div className="card-body flex flex-wrap gap-3">
          {current.colorPalette.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={c}
                onChange={(e) => {
                  const next = [...current.colorPalette];
                  next[i] = e.target.value;
                  updateProject({ colorPalette: next });
                }}
                className="w-12 h-12 p-0 border-0 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-[var(--color-text-muted)]">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
