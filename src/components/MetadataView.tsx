"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { getPlatformLabel, getAllPlatforms } from "@/lib/metadata-engine";
import { Platform } from "@/lib/types";
import { downloadDataUrl } from "@/lib/utils";
import {
  RefreshCw,
  Copy,
  Check,
  Tags,
  Download,
  Sparkles,
  Clock,
  Hash,
  Type,
  AlignLeft,
} from "lucide-react";

export function MetadataView() {
  const current = useApp((s) => s.current);
  const generateMetadata = useApp((s) => s.generateMetadata);
  const regeneratePlatform = useApp((s) => s.regeneratePlatform);
  const updatePlatformMeta = useApp((s) => s.updatePlatformMeta);
  const updateMetadata = useApp((s) => s.updateMetadata);
  const generateThumbnails = useApp((s) => s.generateThumbnails);
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [copied, setCopied] = useState<string | null>(null);

  if (!current) return null;

  const meta = current.metadata;
  const platforms = meta.platforms.length
    ? meta.platforms
    : [];
  const active = platforms.find((p) => p.platform === platform);

  const ensureMeta = () => {
    if (!platforms.length) generateMetadata();
  };

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const CopyBtn = ({ k, text }: { k: string; text: string }) => (
    <button className="btn btn-ghost btn-sm" onClick={() => copy(k, text)}>
      {copied === k ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tags className="w-6 h-6 text-indigo-400" />
            Platform Metadata
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Professional titles, descriptions, hashtags, hooks & thumbnails — tuned per platform for max reach
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => generateMetadata()}>
            <Sparkles className="w-4 h-4" /> Generate All
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => generateThumbnails()}>
            <Download className="w-4 h-4" /> Thumbnails
          </button>
        </div>
      </div>

      {/* Master */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Master Metadata</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="field">
            <label className="flex items-center gap-1">
              <Type className="w-3 h-3" /> Master Title
            </label>
            <div className="flex gap-2">
              <input
                value={meta.masterTitle}
                onChange={(e) => updateMetadata({ masterTitle: e.target.value })}
              />
              <CopyBtn k="mt" text={meta.masterTitle} />
            </div>
          </div>
          <div className="field">
            <label className="flex items-center gap-1">
              <AlignLeft className="w-3 h-3" /> Master Description
            </label>
            <div className="flex gap-2 items-start">
              <textarea
                value={meta.masterDescription}
                onChange={(e) => updateMetadata({ masterDescription: e.target.value })}
                rows={4}
              />
              <CopyBtn k="md" text={meta.masterDescription} />
            </div>
          </div>
          <div className="field">
            <label className="flex items-center gap-1">
              <Hash className="w-3 h-3" /> Master Tags
            </label>
            <div className="flex gap-2">
              <input
                value={meta.masterTags.join(", ")}
                onChange={(e) =>
                  updateMetadata({
                    masterTags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
              <CopyBtn k="mtags" text={meta.masterTags.join(", ")} />
            </div>
          </div>
        </div>
      </div>

      {/* Platform picker */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Per-Platform Optimization</h2>
          {active && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => regeneratePlatform(platform)}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate {getPlatformLabel(platform)}
            </button>
          )}
        </div>
        <div className="card-body space-y-5">
          {!platforms.length ? (
            <div className="empty-state py-8">
              <p className="mb-4">No platform metadata yet.</p>
              <button className="btn btn-primary" onClick={ensureMeta}>
                <Sparkles className="w-4 h-4" /> Generate Now
              </button>
            </div>
          ) : (
            <>
              <div className="chip-group">
                {getAllPlatforms().map((p) => {
                  const has = platforms.some((x) => x.platform === p);
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`chip ${platform === p ? "active" : ""} ${!has ? "opacity-40" : ""}`}
                      onClick={() => {
                        if (!has) {
                          generateMetadata();
                        }
                        setPlatform(p);
                      }}
                    >
                      {getPlatformLabel(p)}
                    </button>
                  );
                })}
              </div>

              {active && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="card !bg-[var(--color-bg-elevated)]">
                      <div className="card-body py-3">
                        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Best Post Time
                        </div>
                        <div className="font-semibold text-sm mt-1">{active.bestPostTime}</div>
                      </div>
                    </div>
                    <div className="card !bg-[var(--color-bg-elevated)] md:col-span-2">
                      <div className="card-body py-3">
                        <div className="text-xs text-[var(--color-text-muted)]">CTA</div>
                        <div className="font-semibold text-sm mt-1">{active.cta}</div>
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label>Title</label>
                    <div className="flex gap-2">
                      <input
                        value={active.title}
                        onChange={(e) =>
                          updatePlatformMeta(platform, { title: e.target.value })
                        }
                      />
                      <CopyBtn k="pt" text={active.title} />
                    </div>
                  </div>

                  <div className="field">
                    <label>Description</label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={active.description}
                        onChange={(e) =>
                          updatePlatformMeta(platform, { description: e.target.value })
                        }
                        rows={10}
                      />
                      <CopyBtn k="pd" text={active.description} />
                    </div>
                  </div>

                  <div className="field">
                    <label>Hashtags</label>
                    <div className="flex gap-2">
                      <input
                        value={active.hashtags.join(" ")}
                        onChange={(e) =>
                          updatePlatformMeta(platform, {
                            hashtags: e.target.value.split(/\s+/).filter(Boolean),
                          })
                        }
                      />
                      <CopyBtn k="ph" text={active.hashtags.join(" ")} />
                    </div>
                  </div>

                  <div className="field">
                    <label>Tags</label>
                    <div className="flex gap-2">
                      <input
                        value={active.tags.join(", ")}
                        onChange={(e) =>
                          updatePlatformMeta(platform, {
                            tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                          })
                        }
                      />
                      <CopyBtn k="ptags" text={active.tags.join(", ")} />
                    </div>
                  </div>

                  <div className="field">
                    <label>SEO Keywords</label>
                    <div className="flex gap-2">
                      <input
                        value={active.seoKeywords.join(", ")}
                        onChange={(e) =>
                          updatePlatformMeta(platform, {
                            seoKeywords: e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                      <CopyBtn k="seo" text={active.seoKeywords.join(", ")} />
                    </div>
                  </div>

                  <div className="field">
                    <label>Hooks (A/B test these)</label>
                    <div className="space-y-2">
                      {active.hooks.map((h, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={h}
                            onChange={(e) => {
                              const hooks = [...active.hooks];
                              hooks[i] = e.target.value;
                              updatePlatformMeta(platform, { hooks });
                            }}
                          />
                          <CopyBtn k={`hook${i}`} text={h} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label>Alt Text</label>
                    <div className="flex gap-2">
                      <input
                        value={active.altText}
                        onChange={(e) =>
                          updatePlatformMeta(platform, { altText: e.target.value })
                        }
                      />
                      <CopyBtn k="alt" text={active.altText} />
                    </div>
                  </div>

                  {active.pinnedComment !== undefined && (
                    <div className="field">
                      <label>Pinned Comment</label>
                      <div className="flex gap-2">
                        <input
                          value={active.pinnedComment || ""}
                          onChange={(e) =>
                            updatePlatformMeta(platform, { pinnedComment: e.target.value })
                          }
                        />
                        <CopyBtn k="pin" text={active.pinnedComment || ""} />
                      </div>
                    </div>
                  )}

                  {active.chapterMarkers && active.chapterMarkers.length > 0 && (
                    <div className="field">
                      <label>Chapter Markers (YouTube)</label>
                      <div className="prompt-box">
                        {active.chapterMarkers.map((c) => `${c.time} ${c.title}`).join("\n")}
                      </div>
                      <button
                        className="btn btn-secondary btn-sm mt-2"
                        onClick={() =>
                          copy(
                            "ch",
                            active.chapterMarkers!.map((c) => `${c.time} ${c.title}`).join("\n")
                          )
                        }
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Chapters
                      </button>
                    </div>
                  )}

                  <div className="field">
                    <label>Thumbnail Prompt</label>
                    <textarea
                      className="prompt-box w-full"
                      style={{ fontFamily: "ui-monospace, monospace", maxHeight: "none" }}
                      value={active.thumbnailPrompt}
                      onChange={(e) =>
                        updatePlatformMeta(platform, { thumbnailPrompt: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Thumbnail Variants</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => generateThumbnails()}>
            <RefreshCw className="w-3.5 h-3.5" /> Generate
          </button>
        </div>
        <div className="card-body">
          <div className="grid sm:grid-cols-2 gap-4">
            {meta.thumbnailVariants.map((v) => (
              <div key={v.id} className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <div className="aspect-video bg-black">
                  {v.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.dataUrl} alt={v.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-dim)]">
                      Not generated
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="font-semibold text-sm">{v.label}</div>
                  <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{v.prompt}</p>
                  {v.dataUrl && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        downloadDataUrl(v.dataUrl!, `${current.title}_${v.label}.jpg`)
                      }
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!meta.thumbnailVariants.length && (
              <p className="text-sm text-[var(--color-text-muted)] col-span-2">
                Generate metadata first, then create thumbnails.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
