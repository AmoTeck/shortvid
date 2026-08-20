"use client";

import { useApp } from "@/lib/store";
import { CHARACTER_ROLES, EMOTIONS } from "@/lib/story-engine";
import { CharacterRole, Emotion } from "@/lib/types";
import { Plus, RefreshCw, Trash2, User, Copy, Check } from "lucide-react";
import { useState } from "react";

export function CharactersView() {
  const current = useApp((s) => s.current);
  const selectedId = useApp((s) => s.selectedCharacterId);
  const selectCharacter = useApp((s) => s.selectCharacter);
  const addCharacter = useApp((s) => s.addCharacter);
  const updateCharacter = useApp((s) => s.updateCharacter);
  const removeCharacter = useApp((s) => s.removeCharacter);
  const rebuildCharPrompt = useApp((s) => s.rebuildCharPrompt);
  const [copied, setCopied] = useState(false);
  const [newRole, setNewRole] = useState<CharacterRole>("supporting");

  if (!current) return null;
  const selected = current.characters.find((c) => c.id === selectedId) || current.characters[0];

  const copyPrompt = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.consistencyPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Characters</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Identity-locked across every scene — edit appearance, personality, or consistency prompt
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as CharacterRole)}
            className="w-auto"
          >
            {CHARACTER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/-/g, " ")}
              </option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => addCharacter(newRole)}>
            <Plus className="w-4 h-4" /> Add Character
          </button>
        </div>
      </div>

      <div className="split">
        {/* List */}
        <div className="space-y-2">
          {current.characters.map((c) => {
            const initials = c.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2);
            const active = selected?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => selectCharacter(c.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  active
                    ? "border-[var(--color-accent)] bg-[rgba(108,140,255,0.1)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div className="avatar-ring w-11 h-11 shrink-0">
                  <div
                    className="avatar-inner text-sm"
                    style={{
                      background: `linear-gradient(135deg, ${c.appearance.colorPalette[0] || "#333"}, ${c.appearance.colorPalette[1] || "#666"})`,
                      color: "#fff",
                    }}
                  >
                    {initials}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)] capitalize">
                    {c.role.replace(/-/g, " ")}
                  </div>
                </div>
              </button>
            );
          })}
          {!current.characters.length && (
            <div className="empty-state">
              <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No characters yet
            </div>
          )}
        </div>

        {/* Editor */}
        {selected && (
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="font-bold text-lg">{selected.name}</h2>
                <span className="badge capitalize">{selected.role.replace(/-/g, " ")}</span>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => rebuildCharPrompt(selected.id)}>
                  <RefreshCw className="w-3.5 h-3.5" /> Rebuild Prompt
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (confirm(`Remove ${selected.name}?`)) removeCharacter(selected.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="card-body space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto">
              <div className="field-grid">
                <div className="field">
                  <label>Name</label>
                  <input
                    value={selected.name}
                    onChange={(e) => updateCharacter(selected.id, { name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Role</label>
                  <select
                    value={selected.role}
                    onChange={(e) =>
                      updateCharacter(selected.id, { role: e.target.value as CharacterRole })
                    }
                  >
                    {CHARACTER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/-/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Personality (comma-separated)</label>
                <input
                  value={selected.personality.join(", ")}
                  onChange={(e) =>
                    updateCharacter(selected.id, {
                      personality: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="field">
                <label>Backstory</label>
                <textarea
                  value={selected.backstory}
                  onChange={(e) => updateCharacter(selected.id, { backstory: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="field">
                <label>Character Arc</label>
                <textarea
                  value={selected.arc}
                  onChange={(e) => updateCharacter(selected.id, { arc: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="field-grid">
                <div className="field">
                  <label>Voice Style</label>
                  <input
                    value={selected.voiceStyle}
                    onChange={(e) => updateCharacter(selected.id, { voiceStyle: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Speech Pattern</label>
                  <input
                    value={selected.speechPattern}
                    onChange={(e) => updateCharacter(selected.id, { speechPattern: e.target.value })}
                  />
                </div>
              </div>

              <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--color-text-muted)] pt-2">
                Appearance — locked identity
              </h3>
              <div className="field-grid">
                {(
                  [
                    ["age", "Age"],
                    ["gender", "Gender"],
                    ["height", "Height"],
                    ["build", "Build"],
                    ["skinTone", "Skin Tone"],
                    ["hairColor", "Hair Color"],
                    ["hairStyle", "Hair Style"],
                    ["eyeColor", "Eye Color"],
                    ["facialFeatures", "Facial Features"],
                    ["clothing", "Clothing"],
                    ["accessories", "Accessories"],
                    ["distinguishingMarks", "Distinguishing Marks"],
                  ] as const
                ).map(([key, label]) => (
                  <div className="field" key={key}>
                    <label>{label}</label>
                    <input
                      value={selected.appearance[key]}
                      onChange={(e) =>
                        updateCharacter(selected.id, {
                          appearance: { ...selected.appearance, [key]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="field">
                <label>Color Palette</label>
                <div className="flex gap-2 flex-wrap">
                  {selected.appearance.colorPalette.map((c, i) => (
                    <input
                      key={i}
                      type="color"
                      value={c}
                      onChange={(e) => {
                        const palette = [...selected.appearance.colorPalette];
                        palette[i] = e.target.value;
                        updateCharacter(selected.id, {
                          appearance: { ...selected.appearance, colorPalette: palette },
                        });
                      }}
                      className="w-10 h-10 p-0 border-0 rounded-lg cursor-pointer"
                    />
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="flex items-center justify-between mb-1">
                  <label className="!mb-0">Consistency Prompt (edit freely)</label>
                  <button className="btn btn-ghost btn-sm" onClick={copyPrompt}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <textarea
                  className="prompt-box w-full"
                  style={{ fontFamily: "ui-monospace, monospace", maxHeight: "none" }}
                  value={selected.consistencyPrompt}
                  onChange={(e) =>
                    updateCharacter(selected.id, { consistencyPrompt: e.target.value })
                  }
                  rows={6}
                />
              </div>

              <div className="field">
                <label>Emotion Prompt Overrides (optional per emotion)</label>
                <div className="space-y-2">
                  {EMOTIONS.slice(0, 8).map((em: Emotion) => (
                    <div key={em} className="flex gap-2 items-center">
                      <span className="text-xs w-24 capitalize text-[var(--color-text-muted)]">{em}</span>
                      <input
                        value={selected.emotionOverrides[em] || ""}
                        placeholder={`How ${selected.name} looks when ${em}…`}
                        onChange={(e) =>
                          updateCharacter(selected.id, {
                            emotionOverrides: {
                              ...selected.emotionOverrides,
                              [em]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
