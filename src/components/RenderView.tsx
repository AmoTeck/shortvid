"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { formatDuration, downloadBlob } from "@/lib/utils";
import { loadBlob, blobKey, fullVideoKey } from "@/lib/storage";
import {
  Play,
  Square,
  Download,
  Film,
  Clapperboard,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export function RenderView() {
  const current = useApp((s) => s.current);
  const rendering = useApp((s) => s.rendering);
  const renderProgress = useApp((s) => s.renderProgress);
  const renderMessage = useApp((s) => s.renderMessage);
  const renderAll = useApp((s) => s.renderAll);
  const renderScene = useApp((s) => s.renderScene);
  const cancelRender = useApp((s) => s.cancelRender);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const previewUrls = useApp((s) => s.previewUrls);
  const generateThumbnails = useApp((s) => s.generateThumbnails);

  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [sceneUrls, setSceneUrls] = useState<Record<string, string>>({});
  const [activeVideo, setActiveVideo] = useState<"full" | string>("full");

  const sceneStatusKey = current?.scenes.map((s) => `${s.id}:${s.status}`).join("|") || "";

  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    const urls: string[] = [];
    const projectId = current.id;
    const scenes = current.scenes;

    (async () => {
      const full = await loadBlob(fullVideoKey(projectId));
      if (cancelled) return;
      if (full) {
        const u = URL.createObjectURL(full);
        urls.push(u);
        setFullUrl(u);
      } else setFullUrl(null);

      const map: Record<string, string> = {};
      for (const s of scenes) {
        if (s.status === "done") {
          const b = await loadBlob(s.videoBlobKey || blobKey(projectId, s.id));
          if (b) {
            const u = URL.createObjectURL(b);
            urls.push(u);
            map[s.id] = u;
          }
        }
      }
      if (!cancelled) setSceneUrls(map);
    })();

    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.status, sceneStatusKey]);

  if (!current) return null;

  const totalDur = current.scenes.reduce((s, sc) => s + sc.durationSec, 0);
  const doneCount = current.scenes.filter((s) => s.status === "done").length;
  const currentSrc =
    activeVideo === "full" ? fullUrl : sceneUrls[activeVideo] || null;

  const downloadCurrent = async () => {
    if (activeVideo === "full") {
      const b = await loadBlob(fullVideoKey(current.id));
      if (b) downloadBlob(b, `${current.title.replace(/\s+/g, "_")}_full.webm`);
    } else {
      const scene = current.scenes.find((s) => s.id === activeVideo);
      const b = await loadBlob(scene?.videoBlobKey || blobKey(current.id, activeVideo));
      if (b) downloadBlob(b, `${current.title.replace(/\s+/g, "_")}_${scene?.title || "scene"}.webm`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Render Studio</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Living motion video · {doneCount}/{current.scenes.length} scenes done ·{" "}
            {formatDuration(totalDur)} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!rendering ? (
            <button className="btn btn-primary" onClick={() => renderAll()}>
              <Play className="w-4 h-4" /> Render Full Film
            </button>
          ) : (
            <button className="btn btn-danger" onClick={() => cancelRender()}>
              <Square className="w-4 h-4" /> Cancel
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => generateThumbnails()}>
            <Clapperboard className="w-4 h-4" /> Gen Thumbnails
          </button>
          {currentSrc && (
            <button className="btn btn-success" onClick={downloadCurrent}>
              <Download className="w-4 h-4" /> Download
            </button>
          )}
        </div>
      </div>

      {/* Quality settings */}
      <div className="card">
        <div className="card-body py-3 flex flex-wrap gap-4 items-end">
          <div className="field" style={{ minWidth: 140 }}>
            <label>Quality</label>
            <select
              value={settings.quality}
              onChange={(e) =>
                updateSettings({
                  quality: e.target.value as typeof settings.quality,
                })
              }
              disabled={rendering}
            >
              <option value="draft">Draft (fast)</option>
              <option value="standard">Standard</option>
              <option value="cinematic">Cinematic</option>
              <option value="imax">IMAX (heavy)</option>
            </select>
          </div>
          <div className="field" style={{ minWidth: 100 }}>
            <label>FPS</label>
            <select
              value={settings.fps}
              onChange={(e) => updateSettings({ fps: Number(e.target.value) as 24 | 30 | 60 })}
              disabled={rendering}
            >
              <option value={24}>24</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] pb-2">
            Aspect {current.aspectRatio} · Style {current.style} · All rendering is local — $0 cost
          </div>
        </div>
      </div>

      {rendering && (
        <div className="card border-[var(--color-accent)]!">
          <div className="card-body space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <div className="flex-1">
                <div className="font-semibold text-sm">{renderMessage || "Rendering…"}</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {Math.round(renderProgress * 100)}%
                </div>
              </div>
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${renderProgress * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Player */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-bold">
              {activeVideo === "full"
                ? "Full Film"
                : current.scenes.find((s) => s.id === activeVideo)?.title || "Scene"}
            </h2>
          </div>
          <div className="card-body">
            <div
              className="video-frame mx-auto"
              style={{
                aspectRatio: current.aspectRatio.replace(":", "/"),
                width: "100%",
                maxWidth: current.aspectRatio === "16:9" ? 800 : 400,
              }}
            >
              {currentSrc ? (
                <video key={currentSrc} src={currentSrc} controls autoPlay={false} playsInline />
              ) : (
                <div className="text-center p-8 text-[var(--color-text-muted)]">
                  <Film className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {rendering
                      ? "Rendering in progress…"
                      : "No video yet. Hit “Render Full Film” or render a scene."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scene playlist */}
        <div className="space-y-2">
          <button
            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
              activeVideo === "full"
                ? "border-[var(--color-accent)] bg-[rgba(108,140,255,0.1)]"
                : "border-[var(--color-border)] bg-[var(--color-bg-card)]"
            }`}
            onClick={() => setActiveVideo("full")}
          >
            <Clapperboard className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Full Film</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {fullUrl ? "Ready to play" : "Not rendered"}
              </div>
            </div>
            {fullUrl && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {current.scenes.map((s, i) => {
            const thumb = previewUrls[s.id] || s.thumbnailDataUrl;
            const ready = !!sceneUrls[s.id];
            return (
              <div
                key={s.id}
                className={`rounded-xl border overflow-hidden ${
                  activeVideo === s.id
                    ? "border-[var(--color-accent)]"
                    : "border-[var(--color-border)]"
                } bg-[var(--color-bg-card)]`}
              >
                <button
                  className="w-full text-left flex gap-2 p-2"
                  onClick={() => setActiveVideo(s.id)}
                >
                  <div className="w-14 h-20 bg-black rounded-lg overflow-hidden shrink-0">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="text-xs text-[var(--color-text-dim)]">Scene {i + 1}</div>
                    <div className="font-semibold text-sm truncate">{s.title}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {formatDuration(s.durationSec)} · {s.status}
                    </div>
                  </div>
                  {ready && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-2 shrink-0" />}
                </button>
                {s.status !== "done" && (
                  <div className="px-2 pb-2">
                    <button
                      className="btn btn-secondary btn-sm w-full"
                      disabled={rendering}
                      onClick={() => renderScene(s.id)}
                    >
                      <Play className="w-3 h-3" /> Render
                    </button>
                  </div>
                )}
                {ready && (
                  <div className="px-2 pb-2">
                    <button
                      className="btn btn-ghost btn-sm w-full"
                      onClick={async () => {
                        const b = await loadBlob(s.videoBlobKey || blobKey(current.id, s.id));
                        if (b)
                          downloadBlob(
                            b,
                            `${current.title.replace(/\s+/g, "_")}_s${i + 1}.webm`
                          );
                      }}
                    >
                      <Download className="w-3 h-3" /> Download scene
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
