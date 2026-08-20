import { get, set, del, keys, createStore } from "idb-keyval";
import { StoryProject, AppSettings } from "./types";

const projectStore = createStore("storycinema-db", "projects");
const blobStore = createStore("storycinema-db", "blobs");
const settingsStore = createStore("storycinema-db", "settings");

const PROJECT_INDEX = "project-index";

function indexKey(userId?: string | null) {
  return userId ? `${PROJECT_INDEX}::${userId}` : PROJECT_INDEX;
}

export async function listProjectIds(userId?: string | null): Promise<string[]> {
  return (await get<string[]>(indexKey(userId), projectStore)) || [];
}

export async function saveProject(project: StoryProject): Promise<void> {
  await set(project.id, project, projectStore);
  const uid = project.userId || "local";
  const ids = await listProjectIds(uid);
  if (!ids.includes(project.id)) {
    ids.unshift(project.id);
    await set(indexKey(uid), ids, projectStore);
  }
  // also maintain legacy global index for migration
  const global = await listProjectIds(null);
  if (!global.includes(project.id)) {
    global.unshift(project.id);
    await set(PROJECT_INDEX, global, projectStore);
  }
}

export async function loadProject(id: string): Promise<StoryProject | null> {
  return (await get<StoryProject>(id, projectStore)) || null;
}

export async function deleteProject(id: string, userId?: string | null): Promise<void> {
  const proj = await loadProject(id);
  await del(id, projectStore);
  const uid = userId || proj?.userId;
  if (uid) {
    const ids = (await listProjectIds(uid)).filter((x) => x !== id);
    await set(indexKey(uid), ids, projectStore);
  }
  const global = (await listProjectIds(null)).filter((x) => x !== id);
  await set(PROJECT_INDEX, global, projectStore);
  const allKeys = await keys(blobStore);
  for (const k of allKeys) {
    if (String(k).startsWith(id)) await del(k, blobStore);
  }
}

export async function listProjects(userId?: string | null): Promise<StoryProject[]> {
  const ids = await listProjectIds(userId);
  // Migration: if user has no index yet, filter global by userId
  if (userId && !ids.length) {
    const global = await listProjectIds(null);
    const projects: StoryProject[] = [];
    for (const id of global) {
      const p = await loadProject(id);
      if (p && (p.userId === userId || !p.userId)) {
        projects.push(p.userId ? p : { ...p, userId });
        if (!p.userId) await saveProject({ ...p, userId });
      }
    }
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  const projects: StoryProject[] = [];
  for (const id of ids) {
    const p = await loadProject(id);
    if (p && (!userId || p.userId === userId || !p.userId)) projects.push(p);
  }
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function archiveProject(id: string, archived = true): Promise<StoryProject | null> {
  const p = await loadProject(id);
  if (!p) return null;
  const next = {
    ...p,
    archived,
    status: archived ? ("archived" as const) : p.status === "archived" ? ("scenes" as const) : p.status,
    updatedAt: Date.now(),
    version: (p.version || 1) + 1,
  };
  await saveProject(next);
  return next;
}

export async function duplicateProject(id: string, userId: string): Promise<StoryProject | null> {
  const p = await loadProject(id);
  if (!p) return null;
  const copy: StoryProject = {
    ...JSON.parse(JSON.stringify(p)),
    id: `proj_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`,
    userId,
    title: `${p.title} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    archived: false,
    status: p.status === "archived" ? "scenes" : p.status,
    renderProgress: 0,
  };
  // clear blob refs (copies don't share video bytes unless re-rendered)
  copy.scenes = copy.scenes.map((s) => ({
    ...s,
    videoBlobKey: undefined,
    status: s.status === "done" ? "ready" : s.status,
  }));
  await saveProject(copy);
  return copy;
}

export async function saveBlob(key: string, blob: Blob): Promise<void> {
  await set(key, blob, blobStore);
}

export async function loadBlob(key: string): Promise<Blob | null> {
  return (await get<Blob>(key, blobStore)) || null;
}

export async function deleteBlob(key: string): Promise<void> {
  await del(key, blobStore);
}

export async function saveSettings(s: AppSettings, userId?: string): Promise<void> {
  await set(userId ? `app::${userId}` : "app", s, settingsStore);
}

export async function loadSettings(userId?: string): Promise<AppSettings> {
  const defaults: AppSettings = {
    defaultStyle: "cinematic",
    defaultAspect: "9:16",
    defaultLanguage: "en-US",
    autoSave: true,
    quality: "standard",
    fps: 30,
    voiceEnabled: true,
    musicEnabled: true,
    subtitlesEnabled: true,
    defaultSubtitleTemplate: "netflix",
    defaultVoicePersona: "narrator-warm",
    targetPlatform: "youtube-shorts",
    emojiInSubtitles: true,
  };
  const stored = await get<AppSettings>(userId ? `app::${userId}` : "app", settingsStore);
  return { ...defaults, ...(stored || {}) };
}

export function blobKey(projectId: string, sceneId: string) {
  return `${projectId}::scene::${sceneId}`;
}

export function fullVideoKey(projectId: string) {
  return `${projectId}::full`;
}

export function voiceBlobKey(projectId: string, lineId: string) {
  return `${projectId}::voice::${lineId}`;
}
