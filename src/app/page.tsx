"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";
import { CreateView } from "@/components/CreateView";
import { LibraryView } from "@/components/LibraryView";
import { StoryView } from "@/components/StoryView";
import { CharactersView } from "@/components/CharactersView";
import { ScenesView } from "@/components/ScenesView";
import { RenderView } from "@/components/RenderView";
import { MetadataView } from "@/components/MetadataView";
import { SettingsModal } from "@/components/SettingsModal";
import { AuthModal } from "@/components/AuthModal";
import { VoiceView } from "@/components/VoiceView";
import { SubtitlesView } from "@/components/SubtitlesView";
import { OptimizeView } from "@/components/OptimizeView";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const ready = useApp((s) => s.ready);
  const init = useApp((s) => s.init);
  const tab = useApp((s) => s.activeTab);
  const current = useApp((s) => s.current);
  const session = useApp((s) => s.session);
  const rendering = useApp((s) => s.rendering);
  const renderProgress = useApp((s) => s.renderProgress);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading StoryCinema…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {session && <Sidebar onSettings={() => setSettingsOpen(true)} />}

      <main
        className={`flex-1 min-w-0 min-h-screen overflow-x-hidden ${
          session ? "pt-14 pb-20 md:pt-0 md:pb-0" : ""
        }`}
      >
        {session && current && tab !== "create" && tab !== "library" && (
          <div className="sticky top-14 md:top-0 z-20 border-b border-[var(--color-border)] bg-[rgba(7,8,13,0.85)] backdrop-blur-md px-3 md:px-6 py-2 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate text-sm md:text-base">{current.title}</div>
              <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                {current.style} · {current.scenes.length} scenes · v{current.version || 1}
                {current.archived ? " · archived" : ""}
              </div>
            </div>
            {rendering && (
              <div className="flex items-center gap-2 min-w-[100px]">
                <div className="progress flex-1 w-16 md:w-24">
                  <div className="progress-bar" style={{ width: `${renderProgress * 100}%` }} />
                </div>
                <span className="text-xs text-indigo-300">{Math.round(renderProgress * 100)}%</span>
              </div>
            )}
            <span className="badge badge-accent hidden sm:inline-flex">{current.status}</span>
          </div>
        )}

        {session && (
          <>
            {tab === "create" && <CreateView />}
            {tab === "library" && <LibraryView />}
            {tab === "story" && <StoryView />}
            {tab === "characters" && <CharactersView />}
            {tab === "scenes" && <ScenesView />}
            {tab === "voice" && <VoiceView />}
            {tab === "subtitles" && <SubtitlesView />}
            {tab === "optimize" && <OptimizeView />}
            {tab === "render" && <RenderView />}
            {tab === "metadata" && <MetadataView />}
          </>
        )}
      </main>

      <AuthModal />
      <Toast />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
