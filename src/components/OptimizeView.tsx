"use client";

import { useApp } from "@/lib/store";
import { PLAYBOOKS } from "@/lib/platform-optimizer";
import { getPlatformLabel } from "@/lib/metadata-engine";
import { Platform } from "@/lib/types";
import { Gauge, Rocket, CheckCircle2, AlertTriangle, Wand2 } from "lucide-react";

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? "bg-emerald-400" : value >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--color-text-muted)] capitalize">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="progress h-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function OptimizeView() {
  const current = useApp((s) => s.current);
  const optimizeForPlatform = useApp((s) => s.optimizeForPlatform);
  const analyzeAllPlatforms = useApp((s) => s.analyzeAllPlatforms);

  if (!current) return null;

  const platform = current.targetPlatform || "youtube-shorts";
  const analysis =
    current.platformOptimizations?.find((p) => p.platform === platform) ||
    current.platformOptimizations?.[0];
  const pb = PLAYBOOKS[platform];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Gauge className="w-6 h-6 text-emerald-400" /> Platform Growth Engine
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Every element scored & tuned for max views, watch time, and revenue
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => analyzeAllPlatforms()}>
            Analyze All
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => optimizeForPlatform(platform, true)}
          >
            <Wand2 className="w-4 h-4" /> Apply Best Practices
          </button>
        </div>
      </div>

      <div className="chip-group">
        {(Object.keys(PLAYBOOKS) as Platform[]).map((p) => {
          const sc = current.platformOptimizations?.find((x) => x.platform === p)?.score;
          return (
            <button
              key={p}
              type="button"
              className={`chip ${platform === p ? "active" : ""}`}
              onClick={() => optimizeForPlatform(p, false)}
            >
              {getPlatformLabel(p)}
              {typeof sc === "number" && (
                <span className="ml-1 opacity-70">{sc}</span>
              )}
            </button>
          );
        })}
      </div>

      {analysis && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card md:col-span-1">
            <div className="card-body text-center py-8">
              <div
                className={`text-6xl font-black mb-2 ${
                  analysis.score >= 80
                    ? "text-emerald-400"
                    : analysis.score >= 60
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {analysis.score}
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">Viral Potential Score</div>
              <div className="badge badge-accent mt-3">{getPlatformLabel(platform)}</div>
            </div>
          </div>
          <div className="card md:col-span-2">
            <div className="card-header">
              <h2 className="font-bold">Element Scores</h2>
            </div>
            <div className="card-body grid sm:grid-cols-2 gap-4">
              {Object.entries(analysis.elementScores).map(([k, v]) => (
                <ScoreBar key={k} label={k} value={v} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <h2 className="font-bold flex items-center gap-2">
              <Rocket className="w-4 h-4" /> Hook · Retention · Loop
            </h2>
          </div>
          <div className="card-body space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-[var(--color-text-muted)] mb-1">
                First {pb.hookWindowSec}s
              </div>
              <p>{analysis?.hookFirst3s}</p>
            </div>
            {analysis?.loopStrategy && (
              <div>
                <div className="text-xs uppercase text-[var(--color-text-muted)] mb-1">Loop</div>
                <p>{analysis.loopStrategy}</p>
              </div>
            )}
            <ul className="space-y-1.5">
              {(analysis?.retentionHooks || []).map((h, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-bold">Fixes to Apply</h2>
          </div>
          <div className="card-body space-y-2 text-sm">
            {(analysis?.appliedFixes || []).length === 0 && (
              <p className="text-[var(--color-text-muted)]">Looking strong — no critical fixes.</p>
            )}
            {(analysis?.appliedFixes || []).map((f, i) => (
              <div
                key={i}
                className="flex gap-2 p-2 rounded-lg bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)]"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{f}</span>
              </div>
            ))}
            <button
              className="btn btn-primary w-full mt-2"
              onClick={() => optimizeForPlatform(platform, true)}
            >
              <Wand2 className="w-4 h-4" /> Auto-fix project for {getPlatformLabel(platform)}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-bold">Audio · Captions · Visual</h2>
          </div>
          <div className="card-body space-y-3 text-sm">
            <p>
              <strong className="text-indigo-300">Voice:</strong> {analysis?.voiceAdvice}
            </p>
            <p>
              <strong className="text-cyan-300">Subtitles:</strong> {analysis?.subtitleAdvice}
            </p>
            <p>
              <strong className="text-pink-300">Visual:</strong> {analysis?.thumbnailAdvice}
            </p>
            <p>
              <strong className="text-amber-300">Hashtags:</strong> {analysis?.hashtagStrategy}
            </p>
            <p>
              <strong className="text-emerald-300">Post:</strong> {analysis?.postingCadence}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-bold">Monetization Playbook</h2>
          </div>
          <div className="card-body">
            <ul className="space-y-2 text-sm">
              {(analysis?.monetizationTips || pb.monetization).map((m, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-400 font-bold">{i + 1}.</span>
                  {m}
                </li>
              ))}
            </ul>
            <div className="mt-4 text-xs text-[var(--color-text-dim)]">
              Ideal length {pb.idealDurationSec[0]}–{pb.idealDurationSec[1]}s · Aspect{" "}
              {pb.idealAspect} · Cut pace ~{pb.cutPaceSec}s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
