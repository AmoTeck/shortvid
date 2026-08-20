"use client";

import { useApp } from "@/lib/store";
import { formatDuration, relativeTime } from "@/lib/utils";
import {
  Clapperboard,
  Trash2,
  FolderOpen,
  Plus,
  Archive,
  ArchiveRestore,
  Copy,
} from "lucide-react";

export function LibraryView() {
  const projects = useApp((s) => s.projects);
  const openProject = useApp((s) => s.openProject);
  const removeProject = useApp((s) => s.removeProject);
  const archiveProject = useApp((s) => s.archiveProject);
  const duplicateProject = useApp((s) => s.duplicateProject);
  const setTab = useApp((s) => s.setTab);
  const showArchived = useApp((s) => s.showArchived);
  const setShowArchived = useApp((s) => s.setShowArchived);
  const user = useApp((s) => s.user);

  const visible = projects.filter((p) => (showArchived ? p.archived : !p.archived));

  if (!projects.length) {
    return (
      <div className="empty-state max-w-md mx-auto mt-16 md:mt-20 px-4">
        <Clapperboard className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-dim)]" />
        <h2 className="text-xl font-bold text-white mb-2">
          {user ? `${user.displayName}'s library is empty` : "No films yet"}
        </h2>
        <p className="mb-6">Create your first story — every film is saved as an editable project.</p>
        <button className="btn btn-primary" onClick={() => setTab("create")}>
          <Plus className="w-4 h-4" /> New Story
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            {user?.displayName ? `${user.displayName}'s Library` : "Library"}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {visible.length} {showArchived ? "archived" : "active"} · {projects.length} total ·
            reopen & edit anytime
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn btn-sm ${showArchived ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? "Viewing Archive" : "Show Archive"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setTab("create")}>
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {!visible.length && (
        <div className="empty-state">
          <p>No {showArchived ? "archived" : "active"} projects.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((p) => {
          const thumb =
            p.metadata?.thumbnailVariants?.find((t) => t.dataUrl)?.dataUrl ||
            p.scenes.find((s) => s.thumbnailDataUrl)?.thumbnailDataUrl;
          const dur = p.scenes.reduce((s, sc) => s + sc.durationSec, 0);
          return (
            <div key={p.id} className="card group">
              <div
                className="aspect-video bg-[var(--color-bg)] relative cursor-pointer overflow-hidden"
                onClick={() => openProject(p.id)}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Clapperboard className="w-10 h-10 text-[var(--color-text-dim)]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 flex gap-1 flex-wrap">
                  <span className="badge badge-accent">{p.status}</span>
                  {p.archived && <span className="badge">archived</span>}
                  <span className="badge">v{p.version || 1}</span>
                </div>
              </div>
              <div className="card-body">
                <h3 className="font-bold truncate mb-1">{p.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-3">
                  {p.logline}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-dim)] mb-3 flex-wrap">
                  <span>{p.style}</span>
                  <span>·</span>
                  <span>{p.scenes.length} scenes</span>
                  <span>·</span>
                  <span>{formatDuration(dur)}</span>
                  <span>·</span>
                  <span>{relativeTime(p.updatedAt)}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn btn-secondary btn-sm flex-1"
                    onClick={() => openProject(p.id)}
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Open
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    title="Duplicate"
                    onClick={() => duplicateProject(p.id)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    title={p.archived ? "Restore" : "Archive"}
                    onClick={() => archiveProject(p.id, !p.archived)}
                  >
                    {p.archived ? (
                      <ArchiveRestore className="w-3.5 h-3.5" />
                    ) : (
                      <Archive className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (confirm(`Delete "${p.title}" permanently?`)) removeProject(p.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
