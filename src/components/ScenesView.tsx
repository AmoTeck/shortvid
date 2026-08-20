"use client";

import { useApp } from "@/lib/store";
import { SCENE_TYPES, EMOTIONS } from "@/lib/story-engine";
import {
  SceneType,
  CameraAngle,
  LightingMood,
  Emotion,
} from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import {
  Plus,
  RefreshCw,
  Trash2,
  Film,
  Play,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { LivePreview } from "./LivePreview";

const CAMERAS: CameraAngle[] = [
  "wide", "medium", "close-up", "extreme-close-up", "low-angle", "high-angle",
  "dutch", "over-shoulder", "pov", "aerial", "tracking", "dolly-zoom",
];
const LIGHTS: LightingMood[] = [
  "golden-hour", "blue-hour", "noir", "high-key", "low-key", "neon",
  "candlelight", "harsh-sun", "overcast", "moonlight", "firelight", "storm",
];
const TRANSITIONS = ["cut", "fade", "dissolve", "wipe", "zoom", "flash"] as const;

export function ScenesView() {
  const current = useApp((s) => s.current);
  const selectedId = useApp((s) => s.selectedSceneId);
  const selectScene = useApp((s) => s.selectScene);
  const addScene = useApp((s) => s.addScene);
  const updateScene = useApp((s) => s.updateScene);
  const removeScene = useApp((s) => s.removeScene);
  const reorderScenes = useApp((s) => s.reorderScenes);
  const rebuildScenePrompt = useApp((s) => s.rebuildScenePrompt);
  const renderScene = useApp((s) => s.renderScene);
  const rendering = useApp((s) => s.rendering);
  const previewUrls = useApp((s) => s.previewUrls);
  const [newType, setNewType] = useState<SceneType>("dialogue");
  const [copied, setCopied] = useState(false);

  if (!current) return null;
  const selected = current.scenes.find((s) => s.id === selectedId) || current.scenes[0];

  const copyPrompt = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.visualPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Scenes</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {current.scenes.length} scenes · edit type, prompts, camera, dialogue · render each separately
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as SceneType)}
            className="w-auto"
          >
            {SCENE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => addScene(newType)}>
            <Plus className="w-4 h-4" /> Add Scene
          </button>
        </div>
      </div>

      <div className="split" style={{ gridTemplateColumns: "300px 1fr" }}>
        {/* Scene list */}
        <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
          {current.scenes.map((s, idx) => {
            const active = selected?.id === s.id;
            const thumb = previewUrls[s.id] || s.thumbnailDataUrl;
            return (
              <div
                key={s.id}
                className={`scene-card ${active ? "selected" : ""}`}
                onClick={() => selectScene(s.id)}
              >
                <div className="flex gap-0">
                  <div className="w-20 h-28 bg-black shrink-0 relative">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-5 h-5 text-[var(--color-text-dim)]" />
                      </div>
                    )}
                    <span className="absolute top-1 left-1 badge text-[10px] !px-1.5 !py-0">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="p-2.5 flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{s.title}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)] capitalize mt-0.5">
                      {s.type} · {formatDuration(s.durationSec)}
                    </div>
                    <div className="mt-1.5">
                      <span
                        className={`badge text-[10px] ${
                          s.status === "done"
                            ? "badge-success"
                            : s.status === "rendering"
                              ? "badge-warning"
                              : s.status === "error"
                                ? "badge-danger"
                                : ""
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Editor */}
        {selected && (
          <div className="card">
            <div className="card-header flex-wrap">
              <div>
                <h2 className="font-bold">{selected.title}</h2>
                <span className="badge capitalize">{selected.type}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  title="Move up"
                  disabled={selected.order === 0}
                  onClick={() => reorderScenes(selected.order, selected.order - 1)}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  title="Move down"
                  disabled={selected.order >= current.scenes.length - 1}
                  onClick={() => reorderScenes(selected.order, selected.order + 1)}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => rebuildScenePrompt(selected.id)}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Rebuild Prompt
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={rendering}
                  onClick={() => renderScene(selected.id)}
                >
                  <Play className="w-3.5 h-3.5" /> Render Scene
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (confirm("Delete this scene?")) removeScene(selected.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="card-body space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className="rounded-xl overflow-hidden bg-black border border-[var(--color-border)] relative"
                  style={{
                    aspectRatio: current.aspectRatio.replace(":", "/"),
                    maxHeight: 360,
                  }}
                >
                  <LivePreview
                    scene={selected}
                    characters={current.characters}
                    style={current.style}
                    aspectRatio={current.aspectRatio}
                  />
                  <span className="absolute top-2 left-2 badge badge-accent text-[10px]">
                    LIVE
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="field">
                    <label>Scene Title</label>
                    <input
                      value={selected.title}
                      onChange={(e) => updateScene(selected.id, { title: e.target.value })}
                    />
                  </div>
                  <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div className="field">
                      <label>Type</label>
                      <select
                        value={selected.type}
                        onChange={(e) =>
                          updateScene(selected.id, { type: e.target.value as SceneType })
                        }
                      >
                        {SCENE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Duration (sec)</label>
                      <input
                        type="number"
                        min={2}
                        max={120}
                        value={selected.durationSec}
                        onChange={(e) =>
                          updateScene(selected.id, {
                            durationSec: Math.max(2, Number(e.target.value) || 2),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Characters in Scene</label>
                    <div className="chip-group">
                      {current.characters.map((c) => {
                        const on = selected.characterIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            className={`chip ${on ? "active" : ""}`}
                            onClick={() => {
                              const ids = on
                                ? selected.characterIds.filter((x) => x !== c.id)
                                : [...selected.characterIds, c.id];
                              updateScene(selected.id, { characterIds: ids });
                            }}
                          >
                            {c.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="field">
                <label>Narration</label>
                <textarea
                  value={selected.narration}
                  onChange={(e) => updateScene(selected.id, { narration: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="field">
                <label>Action / Blocking</label>
                <textarea
                  value={selected.action}
                  onChange={(e) => updateScene(selected.id, { action: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="field-grid">
                <div className="field">
                  <label>Setting</label>
                  <input
                    value={selected.setting}
                    onChange={(e) => updateScene(selected.id, { setting: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Time of Day</label>
                  <input
                    value={selected.timeOfDay}
                    onChange={(e) => updateScene(selected.id, { timeOfDay: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Weather</label>
                  <input
                    value={selected.weather}
                    onChange={(e) => updateScene(selected.id, { weather: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Mood</label>
                  <input
                    value={selected.mood}
                    onChange={(e) => updateScene(selected.id, { mood: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Camera Angle</label>
                  <select
                    value={selected.cameraAngle}
                    onChange={(e) =>
                      updateScene(selected.id, { cameraAngle: e.target.value as CameraAngle })
                    }
                  >
                    {CAMERAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Lighting</label>
                  <select
                    value={selected.lighting}
                    onChange={(e) =>
                      updateScene(selected.id, { lighting: e.target.value as LightingMood })
                    }
                  >
                    {LIGHTS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Transition</label>
                  <select
                    value={selected.transition}
                    onChange={(e) =>
                      updateScene(selected.id, {
                        transition: e.target.value as (typeof TRANSITIONS)[number],
                      })
                    }
                  >
                    {TRANSITIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Color Grade</label>
                  <input
                    value={selected.colorGrade}
                    onChange={(e) => updateScene(selected.id, { colorGrade: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Music Cue</label>
                  <input
                    value={selected.musicCue}
                    onChange={(e) => updateScene(selected.id, { musicCue: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Sound Effects (comma-separated)</label>
                  <input
                    value={selected.soundEffects.join(", ")}
                    onChange={(e) =>
                      updateScene(selected.id, {
                        soundEffects: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>

              {/* Dialogue editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="!mb-0">Dialogue</label>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const charId = selected.characterIds[0] || current.characters[0]?.id;
                      if (!charId) return;
                      updateScene(selected.id, {
                        dialogue: [
                          ...selected.dialogue,
                          { characterId: charId, line: "New line…", emotion: "neutral" },
                        ],
                      });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Line
                  </button>
                </div>
                <div className="space-y-2">
                  {selected.dialogue.map((d, i) => (
                    <div key={i} className="flex gap-2 items-start flex-wrap md:flex-nowrap">
                      <select
                        className="w-auto min-w-[120px]"
                        value={d.characterId}
                        onChange={(e) => {
                          const dialogue = [...selected.dialogue];
                          dialogue[i] = { ...d, characterId: e.target.value };
                          updateScene(selected.id, { dialogue });
                        }}
                      >
                        {current.characters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-auto"
                        value={d.emotion}
                        onChange={(e) => {
                          const dialogue = [...selected.dialogue];
                          dialogue[i] = { ...d, emotion: e.target.value as Emotion };
                          updateScene(selected.id, { dialogue });
                        }}
                      >
                        {EMOTIONS.map((em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        ))}
                      </select>
                      <input
                        className="flex-1"
                        value={d.line}
                        onChange={(e) => {
                          const dialogue = [...selected.dialogue];
                          dialogue[i] = { ...d, line: e.target.value };
                          updateScene(selected.id, { dialogue });
                        }}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          updateScene(selected.id, {
                            dialogue: selected.dialogue.filter((_, j) => j !== i),
                          });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {!selected.dialogue.length && (
                    <p className="text-xs text-[var(--color-text-dim)]">No dialogue lines yet.</p>
                  )}
                </div>
              </div>

              <div className="field">
                <div className="flex items-center justify-between mb-1">
                  <label className="!mb-0">Visual Prompt (full control)</label>
                  <button className="btn btn-ghost btn-sm" onClick={copyPrompt}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <textarea
                  className="prompt-box w-full"
                  style={{ fontFamily: "ui-monospace, monospace", maxHeight: "none" }}
                  value={selected.visualPrompt}
                  onChange={(e) => updateScene(selected.id, { visualPrompt: e.target.value })}
                  rows={8}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
