"use client";

import { useApp } from "@/lib/store";
import {
  Clapperboard,
  BookOpen,
  Users,
  Film,
  Play,
  Tags,
  Library,
  Sparkles,
  Settings,
  Mic,
  Captions,
  Gauge,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

type TabId =
  | "create"
  | "story"
  | "characters"
  | "scenes"
  | "voice"
  | "subtitles"
  | "render"
  | "metadata"
  | "optimize"
  | "library";

const NAV: { id: TabId; icon: typeof Film; label: string; needsProject?: boolean }[] = [
  { id: "create", icon: Sparkles, label: "Create" },
  { id: "library", icon: Library, label: "Library" },
  { id: "story", icon: BookOpen, label: "Story", needsProject: true },
  { id: "characters", icon: Users, label: "Cast", needsProject: true },
  { id: "scenes", icon: Film, label: "Scenes", needsProject: true },
  { id: "voice", icon: Mic, label: "Voice", needsProject: true },
  { id: "subtitles", icon: Captions, label: "Subs", needsProject: true },
  { id: "optimize", icon: Gauge, label: "Grow", needsProject: true },
  { id: "render", icon: Play, label: "Render", needsProject: true },
  { id: "metadata", icon: Tags, label: "Meta", needsProject: true },
];

export function Sidebar({ onSettings }: { onSettings: () => void }) {
  const tab = useApp((s) => s.activeTab);
  const setTab = useApp((s) => s.setTab);
  const current = useApp((s) => s.current);
  const user = useApp((s) => s.user);
  const logout = useApp((s) => s.logout);
  const [open, setOpen] = useState(false);

  const NavButtons = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {NAV.map((item) => {
        const disabled = item.needsProject && !current;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            title={item.label}
            disabled={disabled}
            className={`${mobile ? "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left" : "nav-btn"} ${
              tab === item.id ? (mobile ? "bg-[rgba(108,140,255,0.2)] text-white" : "active") : ""
            } ${disabled ? "opacity-30" : ""} ${mobile ? "text-sm font-semibold text-[var(--color-text-muted)]" : ""}`}
            onClick={() => {
              if (!disabled) {
                setTab(item.id);
                setOpen(false);
              }
            }}
          >
            <Icon className={mobile ? "w-5 h-5" : "w-5 h-5"} />
            {mobile && <span>{item.label}</span>}
          </button>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar hidden md:flex">
        <div className="mb-4 flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <NavButtons />
        </nav>

        {user && (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white mb-2"
            style={{ background: user.avatarColor }}
            title={user.displayName}
          >
            {user.displayName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <button title="Settings" className="nav-btn" onClick={onSettings}>
          <Settings className="w-5 h-5" />
        </button>
        <button title="Logout" className="nav-btn" onClick={() => logout()}>
          <LogOut className="w-5 h-5" />
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 border-b border-[var(--color-border)] bg-[rgba(7,8,13,0.92)] backdrop-blur-md flex items-center px-3 gap-3">
        <button className="btn btn-ghost btn-icon" onClick={() => setOpen(true)} aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <Clapperboard className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">
              {current?.title || "StoryCinema"}
            </div>
            {user && (
              <div className="text-[10px] text-[var(--color-text-dim)] truncate">
                @{user.username}
              </div>
            )}
          </div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onSettings}>
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute left-0 top-0 bottom-0 w-[80%] max-w-xs bg-[var(--color-bg-elevated)] border-r border-[var(--color-border)] p-4 flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold">Menu</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {user && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: user.avatarColor }}
                >
                  {user.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{user.displayName}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">@{user.username}</div>
                </div>
              </div>
            )}
            <nav className="flex flex-col gap-1 flex-1">
              <NavButtons mobile />
            </nav>
            <button
              className="btn btn-secondary w-full mt-4"
              onClick={() => {
                logout();
                setOpen(false);
              }}
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Mobile bottom nav — key actions */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border)] bg-[rgba(7,8,13,0.95)] backdrop-blur-md safe-bottom">
        <div className="flex justify-around items-center h-16 px-1">
          {(
            [
              { id: "create" as TabId, icon: Sparkles, label: "New" },
              { id: "library" as TabId, icon: Library, label: "Library" },
              { id: "scenes" as TabId, icon: Film, label: "Scenes", needs: true },
              { id: "voice" as TabId, icon: Mic, label: "Voice", needs: true },
              { id: "render" as TabId, icon: Play, label: "Render", needs: true },
            ] as const
          ).map((item) => {
            const disabled = "needs" in item && item.needs && !current;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                disabled={disabled}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] ${
                  tab === item.id ? "text-indigo-300" : "text-[var(--color-text-dim)]"
                } ${disabled ? "opacity-30" : ""}`}
                onClick={() => !disabled && setTab(item.id)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
