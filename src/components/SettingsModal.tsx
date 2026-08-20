"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { STORY_STYLES } from "@/lib/story-engine";
import { AspectRatio, StoryStyle, Platform, SubtitleTemplateId, VoicePersona } from "@/lib/types";
import { SUBTITLE_TEMPLATES } from "@/lib/subtitle-engine";
import { VOICE_PERSONAS, VOICE_LANGUAGES } from "@/lib/voice-engine";
import { getAllPlatforms, getPlatformLabel } from "@/lib/metadata-engine";
import { changePassword } from "@/lib/auth";
import { X } from "lucide-react";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const user = useApp((s) => s.user);
  const showToast = useApp((s) => s.showToast);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");

  if (!open) return null;

  const changePw = async () => {
    if (!user) return;
    const res = await changePassword(user.id, oldPass, newPass);
    if (!res.ok) showToast(res.error || "Failed", "error");
    else {
      showToast("Password updated", "success");
      setOldPass("");
      setNewPass("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="card w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header sticky top-0 bg-[var(--color-bg-card)] z-10">
          <h2 className="font-bold text-lg">Settings</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="card-body space-y-4">
          {user && (
            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <div className="text-sm font-semibold">{user.displayName}</div>
              <div className="text-xs text-[var(--color-text-muted)]">@{user.username}</div>
            </div>
          )}

          <div className="field">
            <label>Default Style</label>
            <select
              value={settings.defaultStyle}
              onChange={(e) => updateSettings({ defaultStyle: e.target.value as StoryStyle })}
            >
              {STORY_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Default Aspect</label>
            <select
              value={settings.defaultAspect}
              onChange={(e) =>
                updateSettings({ defaultAspect: e.target.value as AspectRatio })
              }
            >
              {(["9:16", "16:9", "1:1", "4:5"] as AspectRatio[]).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Default Target Platform</label>
            <select
              value={settings.targetPlatform}
              onChange={(e) =>
                updateSettings({ targetPlatform: e.target.value as Platform })
              }
            >
              {getAllPlatforms().map((p) => (
                <option key={p} value={p}>
                  {getPlatformLabel(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Default Language</label>
            <select
              value={settings.defaultLanguage}
              onChange={(e) => updateSettings({ defaultLanguage: e.target.value })}
            >
              {VOICE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Default Subtitle Template</label>
            <select
              value={settings.defaultSubtitleTemplate}
              onChange={(e) =>
                updateSettings({
                  defaultSubtitleTemplate: e.target.value as SubtitleTemplateId,
                })
              }
            >
              {SUBTITLE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Default Voice Persona</label>
            <select
              value={settings.defaultVoicePersona}
              onChange={(e) =>
                updateSettings({ defaultVoicePersona: e.target.value as VoicePersona })
              }
            >
              {VOICE_PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Render Quality</label>
            <select
              value={settings.quality}
              onChange={(e) =>
                updateSettings({ quality: e.target.value as typeof settings.quality })
              }
            >
              <option value="draft">Draft</option>
              <option value="standard">Standard</option>
              <option value="cinematic">Cinematic</option>
              <option value="imax">IMAX</option>
            </select>
          </div>
          <div className="field">
            <label>FPS</label>
            <select
              value={settings.fps}
              onChange={(e) => updateSettings({ fps: Number(e.target.value) as 24 | 30 | 60 })}
            >
              <option value={24}>24 fps</option>
              <option value={30}>30 fps</option>
              <option value={60}>60 fps</option>
            </select>
          </div>

          <div className="space-y-2">
            {(
              [
                ["autoSave", "Auto-save projects"],
                ["voiceEnabled", "Voice-over enabled by default"],
                ["musicEnabled", "Background score in renders"],
                ["subtitlesEnabled", "Burn subtitles into video"],
                ["emojiInSubtitles", "AI emojis in subtitles"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer !normal-case !tracking-normal !text-sm !font-medium !text-[var(--color-text)]"
              >
                <input
                  type="checkbox"
                  checked={!!settings[key]}
                  onChange={(e) => updateSettings({ [key]: e.target.checked })}
                  className="w-4 h-4"
                />
                {label}
              </label>
            ))}
          </div>

          {user && (
            <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
              <div className="text-sm font-semibold">Change password</div>
              <input
                type="password"
                placeholder="Current password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
              />
              <input
                type="password"
                placeholder="New password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <button className="btn btn-secondary btn-sm w-full" onClick={changePw}>
                Update password
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] leading-relaxed">
            <strong className="text-[var(--color-text)]">StoryCinema v2.0</strong>
            <br />
            100% free · Multi-user local accounts · Voice · Subs · Growth engine
            <br />
            Mobile-ready · Projects archived per user in IndexedDB
          </div>
        </div>
      </div>
    </div>
  );
}
