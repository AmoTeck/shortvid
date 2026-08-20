"use client";

import { create } from "zustand";
import {
  StoryProject,
  Character,
  Scene,
  AppSettings,
  ProjectMetadata,
  Platform,
  StoryStyle,
  NarrativeStructure,
  AspectRatio,
  VideoLength,
  SceneType,
  CharacterRole,
  AuthSession,
  UserAccount,
  VoiceSettings,
  SubtitleTrack,
  SubtitleTemplateId,
} from "./types";
import {
  createStoryFromTitle,
  generateCharacter,
  generateScenes,
  rebuildCharacterPrompt,
  regenerateScenePrompt,
} from "./story-engine";
import { generateAllMetadata, regenerateSinglePlatform } from "./metadata-engine";
import {
  saveProject,
  loadProject,
  listProjects,
  deleteProject as delProject,
  saveBlob,
  loadBlob,
  blobKey,
  fullVideoKey,
  loadSettings,
  saveSettings,
  archiveProject as archiveProj,
  duplicateProject as dupProject,
} from "./storage";
import {
  renderFullVideo,
  renderSceneVideo,
  renderThumbnail,
  previewFrameToDataUrl,
} from "./visual-engine";
import { now, uid } from "./utils";
import {
  getSession,
  loginUser,
  logoutUser,
  registerUser,
  ensureDefaultUser,
  getUserById,
} from "./auth";
import {
  buildVoiceLines,
  defaultVoiceSettings,
  ensureVoicesLoaded,
  playVoiceTimeline,
  speakText,
  stopSpeaking,
} from "./voice-engine";
import {
  buildSubtitles,
  defaultSubtitleTrack,
  exportSrt,
  exportVtt,
} from "./subtitle-engine";
import {
  analyzeProject,
  applyPlatformOptimization,
  optimizeAllPlatforms,
} from "./platform-optimizer";

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

interface AppState {
  ready: boolean;
  user: UserAccount | null;
  session: AuthSession | null;
  projects: StoryProject[];
  current: StoryProject | null;
  settings: AppSettings;
  rendering: boolean;
  renderProgress: number;
  renderMessage: string;
  abortController: AbortController | null;
  activeTab: TabId;
  selectedSceneId: string | null;
  selectedCharacterId: string | null;
  toast: { id: string; message: string; type: "info" | "success" | "error" } | null;
  previewUrls: Record<string, string>;
  showArchived: boolean;
  authMode: "login" | "register" | null;
  voicePlaying: boolean;

  init: () => Promise<void>;
  setTab: (t: TabId) => void;
  showToast: (message: string, type?: "info" | "success" | "error") => void;
  clearToast: () => void;
  setAuthMode: (m: "login" | "register" | null) => void;

  login: (username: string, password: string) => Promise<boolean>;
  register: (opts: {
    username: string;
    password: string;
    displayName?: string;
    email?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;

  createFromTitle: (opts: {
    title: string;
    style?: StoryStyle;
    structure?: NarrativeStructure;
    aspectRatio?: AspectRatio;
    targetLength?: VideoLength;
    genreHint?: string;
    globalStylePrompt?: string;
    targetPlatform?: Platform;
    language?: string;
  }) => Promise<StoryProject>;
  openProject: (id: string) => Promise<void>;
  closeProject: () => void;
  removeProject: (id: string) => Promise<void>;
  archiveProject: (id: string, archived?: boolean) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  persist: () => Promise<void>;
  updateProject: (patch: Partial<StoryProject>) => void;
  setShowArchived: (v: boolean) => void;
  refreshProjects: () => Promise<void>;

  addCharacter: (role?: CharacterRole) => void;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
  rebuildCharPrompt: (id: string) => void;
  selectCharacter: (id: string | null) => void;

  addScene: (type?: SceneType) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  removeScene: (id: string) => void;
  reorderScenes: (from: number, to: number) => void;
  rebuildScenePrompt: (id: string) => void;
  selectScene: (id: string | null) => void;
  regenerateAllScenes: () => void;

  updateVoice: (patch: Partial<VoiceSettings>) => void;
  rebuildVoiceLines: () => void;
  previewVoice: () => Promise<void>;
  stopVoice: () => void;
  previewLine: (text: string) => void;

  updateSubtitles: (patch: Partial<SubtitleTrack>) => void;
  rebuildSubtitles: (opts?: {
    language?: string;
    templateId?: SubtitleTemplateId;
    emojisEnabled?: boolean;
  }) => void;
  exportSubtitles: (fmt: "srt" | "vtt") => string;

  optimizeForPlatform: (platform: Platform, apply?: boolean) => void;
  analyzeAllPlatforms: () => void;

  generateMetadata: (platforms?: Platform[]) => void;
  updateMetadata: (patch: Partial<ProjectMetadata>) => void;
  regeneratePlatform: (platform: Platform) => void;
  updatePlatformMeta: (platform: Platform, patch: Record<string, unknown>) => void;
  generateThumbnails: () => void;

  renderScene: (sceneId: string) => Promise<void>;
  renderAll: () => Promise<void>;
  cancelRender: () => void;
  getSceneVideoUrl: (sceneId: string) => Promise<string | null>;
  getFullVideoUrl: () => Promise<string | null>;
  refreshScenePreview: (sceneId: string) => void;

  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

function migrateProject(p: StoryProject, userId: string): StoryProject {
  return {
    ...p,
    userId: p.userId || userId,
    archived: p.archived ?? false,
    version: p.version ?? 1,
    targetPlatform: p.targetPlatform || "youtube-shorts",
    voice: p.voice || defaultVoiceSettings(p.language || "en-US"),
    subtitles: p.subtitles || defaultSubtitleTrack(),
    subtitleTracks: p.subtitleTracks || [],
    voiceLines: p.voiceLines || [],
    platformOptimizations: p.platformOptimizations || [],
  };
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  user: null,
  session: null,
  projects: [],
  current: null,
  settings: {
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
  },
  rendering: false,
  renderProgress: 0,
  renderMessage: "",
  abortController: null,
  activeTab: "create",
  selectedSceneId: null,
  selectedCharacterId: null,
  toast: null,
  previewUrls: {},
  showArchived: false,
  authMode: null,
  voicePlaying: false,

  init: async () => {
    await ensureDefaultUser();
    await ensureVoicesLoaded();
    const session = await getSession();
    let user: UserAccount | null = null;
    if (session) user = await getUserById(session.userId);
    const settings = await loadSettings(user?.id);
    const projects = user
      ? (await listProjects(user.id)).map((p) => migrateProject(p, user!.id))
      : [];
    set({
      ready: true,
      session,
      user,
      settings,
      projects,
      authMode: session ? null : "login",
      activeTab: session ? "create" : "create",
    });
  },

  setTab: (t) => set({ activeTab: t }),
  setAuthMode: (m) => set({ authMode: m }),
  setShowArchived: (v) => set({ showArchived: v }),

  showToast: (message, type = "info") => {
    const id = uid("toast");
    set({ toast: { id, message, type } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 3500);
  },
  clearToast: () => set({ toast: null }),

  login: async (username, password) => {
    const res = await loginUser(username, password);
    if (!res.ok) {
      get().showToast(res.error, "error");
      return false;
    }
    const settings = await loadSettings(res.user.id);
    const projects = (await listProjects(res.user.id)).map((p) =>
      migrateProject(p, res.user.id)
    );
    set({
      session: res.session,
      user: res.user,
      settings,
      projects,
      authMode: null,
      current: null,
      activeTab: "library",
    });
    get().showToast(`Welcome back, ${res.user.displayName}!`, "success");
    return true;
  },

  register: async (opts) => {
    const res = await registerUser(opts);
    if (!res.ok) {
      get().showToast(res.error, "error");
      return false;
    }
    return get().login(opts.username, opts.password);
  },

  logout: async () => {
    await logoutUser();
    set({
      session: null,
      user: null,
      projects: [],
      current: null,
      authMode: "login",
      activeTab: "create",
    });
  },

  refreshProjects: async () => {
    const user = get().user;
    if (!user) return;
    const projects = (await listProjects(user.id)).map((p) => migrateProject(p, user.id));
    set({ projects });
  },

  createFromTitle: async (opts) => {
    const user = get().user;
    if (!user) {
      get().showToast("Please log in first", "error");
      set({ authMode: "login" });
      throw new Error("Not authenticated");
    }
    const settings = get().settings;
    const project = createStoryFromTitle({
      title: opts.title,
      style: opts.style || settings.defaultStyle,
      structure: opts.structure || "three-act",
      aspectRatio: opts.aspectRatio || settings.defaultAspect,
      targetLength: opts.targetLength || "short",
      genreHint: opts.genreHint,
      globalStylePrompt: opts.globalStylePrompt,
      language: opts.language || settings.defaultLanguage,
      userId: user.id,
      targetPlatform: opts.targetPlatform || settings.targetPlatform,
    });

    project.voice = {
      ...defaultVoiceSettings(project.language),
      enabled: settings.voiceEnabled,
      persona: settings.defaultVoicePersona,
    };
    project.subtitles = buildSubtitles({
      scenes: project.scenes,
      characters: project.characters,
      language: (opts.language || settings.defaultLanguage).slice(0, 2),
      templateId: settings.defaultSubtitleTemplate,
      emojisEnabled: settings.emojiInSubtitles,
      platform: project.targetPlatform,
    });
    project.voiceLines = buildVoiceLines(project.scenes, project.characters, project.voice);
    project.metadata = generateAllMetadata(project);
    project.platformOptimizations = [analyzeProject(project, project.targetPlatform)];
    project.status = "scenes";
    await saveProject(project);

    const previews: Record<string, string> = {};
    for (const sc of project.scenes) {
      try {
        previews[sc.id] = previewFrameToDataUrl(
          sc,
          project.characters,
          project.style,
          project.aspectRatio
        );
      } catch {
        /* */
      }
    }

    const projects = await listProjects(user.id);
    set({
      current: project,
      projects,
      activeTab: "story",
      previewUrls: { ...get().previewUrls, ...previews },
      selectedSceneId: project.scenes[0]?.id || null,
      selectedCharacterId: project.characters[0]?.id || null,
    });
    get().showToast(`"${project.title}" archived as project — ready to edit`, "success");
    return project;
  },

  openProject: async (id) => {
    const p0 = await loadProject(id);
    if (!p0) {
      get().showToast("Project not found", "error");
      return;
    }
    const p = migrateProject(p0, get().user?.id || p0.userId || "local");
    const previews: Record<string, string> = { ...get().previewUrls };
    for (const sc of p.scenes) {
      if (!previews[sc.id]) {
        try {
          previews[sc.id] = previewFrameToDataUrl(sc, p.characters, p.style, p.aspectRatio);
        } catch {
          /* */
        }
      }
    }
    set({
      current: p,
      activeTab: "story",
      previewUrls: previews,
      selectedSceneId: p.scenes[0]?.id || null,
      selectedCharacterId: p.characters[0]?.id || null,
    });
  },

  closeProject: () => set({ current: null, activeTab: "library" }),

  removeProject: async (id) => {
    await delProject(id, get().user?.id);
    await get().refreshProjects();
    const cur = get().current;
    set({
      current: cur?.id === id ? null : cur,
      activeTab: cur?.id === id ? "library" : get().activeTab,
    });
    get().showToast("Project deleted", "info");
  },

  archiveProject: async (id, archived = true) => {
    await archiveProj(id, archived);
    await get().refreshProjects();
    if (get().current?.id === id) {
      const p = await loadProject(id);
      if (p) set({ current: migrateProject(p, get().user?.id || p.userId) });
    }
    get().showToast(archived ? "Project archived" : "Project restored", "success");
  },

  duplicateProject: async (id) => {
    const user = get().user;
    if (!user) return;
    const copy = await dupProject(id, user.id);
    if (copy) {
      await get().refreshProjects();
      get().showToast("Project duplicated", "success");
    }
  },

  persist: async () => {
    const cur = get().current;
    if (!cur) return;
    cur.updatedAt = now();
    cur.version = (cur.version || 1) + 1;
    await saveProject(cur);
    await get().refreshProjects();
    set({ current: { ...cur } });
  },

  updateProject: (patch) => {
    const cur = get().current;
    if (!cur) return;
    const next = { ...cur, ...patch, updatedAt: now() };
    set({ current: next });
    if (get().settings.autoSave) {
      saveProject(next).then(() => get().refreshProjects());
    }
  },

  addCharacter: (role = "supporting") => {
    const cur = get().current;
    if (!cur) return;
    const c = generateCharacter(role, cur.title, cur.characters.length, cur.genre[0] || "adventure");
    get().updateProject({ characters: [...cur.characters, c] });
    set({ selectedCharacterId: c.id, activeTab: "characters" });
    get().showToast(`Character ${c.name} added`, "success");
  },

  updateCharacter: (id, patch) => {
    const cur = get().current;
    if (!cur) return;
    const characters = cur.characters.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, ...patch, updatedAt: now() };
      if (
        (patch.appearance || patch.name || patch.role) &&
        patch.consistencyPrompt === undefined
      ) {
        next.consistencyPrompt = rebuildCharacterPrompt(next);
      }
      return next;
    });
    const scenes = cur.scenes.map((s) => {
      if (!s.characterIds.includes(id)) return s;
      return {
        ...s,
        visualPrompt: regenerateScenePrompt(s, characters, cur.style, cur.globalStylePrompt),
      };
    });
    get().updateProject({ characters, scenes });
  },

  removeCharacter: (id) => {
    const cur = get().current;
    if (!cur) return;
    const characters = cur.characters.filter((c) => c.id !== id);
    const scenes = cur.scenes.map((s) => ({
      ...s,
      characterIds: s.characterIds.filter((x) => x !== id),
      dialogue: s.dialogue.filter((d) => d.characterId !== id),
    }));
    get().updateProject({ characters, scenes });
    if (get().selectedCharacterId === id) set({ selectedCharacterId: characters[0]?.id || null });
  },

  rebuildCharPrompt: (id) => {
    const cur = get().current;
    if (!cur) return;
    const characters = cur.characters.map((c) =>
      c.id === id ? { ...c, consistencyPrompt: rebuildCharacterPrompt(c), updatedAt: now() } : c
    );
    get().updateProject({ characters });
    get().showToast("Character consistency prompt rebuilt", "success");
  },

  selectCharacter: (id) => set({ selectedCharacterId: id }),

  addScene: (type = "dialogue") => {
    const cur = get().current;
    if (!cur) return;
    const order = cur.scenes.length;
    const protag = cur.characters.find((c) => c.role === "protagonist");
    const partial = {
      order,
      title: `Scene ${order + 1}`,
      type,
      narration: "A new moment unfolds.",
      dialogue: [] as Scene["dialogue"],
      characterIds: protag ? [protag.id] : [],
      setting: "undefined space",
      timeOfDay: "dusk",
      weather: "clear",
      cameraAngle: "medium" as const,
      lighting: "golden-hour" as const,
      mood: "hopeful",
      action: "Characters hold the frame with quiet intensity",
      durationSec: 8,
      transition: "cut" as const,
      musicCue: "low pulsing drone",
      soundEffects: ["wind through trees"],
      colorGrade: "teal & orange blockbuster",
    };
    const scene: Scene = {
      id: uid("scene"),
      ...partial,
      visualPrompt: regenerateScenePrompt(
        partial as Scene,
        cur.characters,
        cur.style,
        cur.globalStylePrompt
      ),
      status: "ready",
    };
    get().updateProject({ scenes: [...cur.scenes, scene] });
    set({ selectedSceneId: scene.id, activeTab: "scenes" });
    get().refreshScenePreview(scene.id);
    get().rebuildVoiceLines();
    get().rebuildSubtitles();
  },

  updateScene: (id, patch) => {
    const cur = get().current;
    if (!cur) return;
    const scenes = cur.scenes.map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, ...patch };
      if (
        (patch.setting ||
          patch.action ||
          patch.cameraAngle ||
          patch.lighting ||
          patch.characterIds ||
          patch.type ||
          patch.mood) &&
        !patch.visualPrompt
      ) {
        next.visualPrompt = regenerateScenePrompt(
          next,
          cur.characters,
          cur.style,
          cur.globalStylePrompt
        );
      }
      return next;
    });
    get().updateProject({ scenes });
    get().refreshScenePreview(id);
  },

  removeScene: (id) => {
    const cur = get().current;
    if (!cur) return;
    const scenes = cur.scenes.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }));
    get().updateProject({ scenes });
    if (get().selectedSceneId === id) set({ selectedSceneId: scenes[0]?.id || null });
  },

  reorderScenes: (from, to) => {
    const cur = get().current;
    if (!cur) return;
    const scenes = [...cur.scenes];
    const [item] = scenes.splice(from, 1);
    scenes.splice(to, 0, item);
    get().updateProject({ scenes: scenes.map((s, i) => ({ ...s, order: i })) });
  },

  rebuildScenePrompt: (id) => {
    const cur = get().current;
    if (!cur) return;
    const scenes = cur.scenes.map((s) =>
      s.id === id
        ? {
            ...s,
            visualPrompt: regenerateScenePrompt(s, cur.characters, cur.style, cur.globalStylePrompt),
          }
        : s
    );
    get().updateProject({ scenes });
    get().refreshScenePreview(id);
    get().showToast("Scene prompt rebuilt", "success");
  },

  selectScene: (id) => set({ selectedSceneId: id }),

  regenerateAllScenes: () => {
    const cur = get().current;
    if (!cur) return;
    const scenes = generateScenes(
      cur.title,
      cur.genre[0] || "adventure",
      cur.structure,
      cur.style,
      cur.characters,
      cur.targetDurationSec,
      cur.globalStylePrompt,
      cur.scenes.length
    );
    get().updateProject({ scenes, status: "scenes" });
    const previews: Record<string, string> = {};
    for (const sc of scenes) {
      try {
        previews[sc.id] = previewFrameToDataUrl(sc, cur.characters, cur.style, cur.aspectRatio);
      } catch {
        /* */
      }
    }
    set({
      previewUrls: { ...get().previewUrls, ...previews },
      selectedSceneId: scenes[0]?.id || null,
    });
    get().rebuildVoiceLines();
    get().rebuildSubtitles();
    get().showToast("All scenes regenerated", "success");
  },

  updateVoice: (patch) => {
    const cur = get().current;
    if (!cur) return;
    const voice = { ...cur.voice, ...patch };
    get().updateProject({ voice });
  },

  rebuildVoiceLines: () => {
    const cur = get().current;
    if (!cur) return;
    const voiceLines = buildVoiceLines(cur.scenes, cur.characters, cur.voice);
    get().updateProject({ voiceLines });
    get().showToast(`Voice timeline: ${voiceLines.length} lines`, "success");
  },

  previewVoice: async () => {
    const cur = get().current;
    if (!cur) return;
    let lines = cur.voiceLines;
    if (!lines.length) {
      lines = buildVoiceLines(cur.scenes, cur.characters, cur.voice);
      get().updateProject({ voiceLines: lines });
    }
    set({ voicePlaying: true });
    try {
      await playVoiceTimeline(lines, cur.voice);
    } finally {
      set({ voicePlaying: false });
    }
  },

  stopVoice: () => {
    stopSpeaking();
    set({ voicePlaying: false });
  },

  previewLine: (text) => {
    const cur = get().current;
    const v = cur?.voice || defaultVoiceSettings();
    speakText(text, {
      language: v.language,
      voiceURI: v.voiceURI,
      rate: v.rate,
      pitch: v.pitch,
      volume: v.volume,
    });
  },

  updateSubtitles: (patch) => {
    const cur = get().current;
    if (!cur) return;
    get().updateProject({ subtitles: { ...cur.subtitles, ...patch } });
  },

  rebuildSubtitles: (opts) => {
    const cur = get().current;
    if (!cur) return;
    const subtitles = buildSubtitles({
      scenes: cur.scenes,
      characters: cur.characters,
      language: opts?.language ?? cur.subtitles.language,
      templateId: opts?.templateId ?? cur.subtitles.templateId,
      emojisEnabled: opts?.emojisEnabled ?? cur.subtitles.emojisEnabled,
      fontScale: cur.subtitles.fontScale,
      platform: cur.targetPlatform,
    });
    get().updateProject({ subtitles });
    get().showToast(`Subtitles rebuilt · ${subtitles.cues.length} cues`, "success");
  },

  exportSubtitles: (fmt) => {
    const cur = get().current;
    if (!cur) return "";
    return fmt === "srt"
      ? exportSrt(cur.subtitles, cur.subtitles.emojisEnabled)
      : exportVtt(cur.subtitles, cur.subtitles.emojisEnabled);
  },

  optimizeForPlatform: (platform, apply = false) => {
    const cur = get().current;
    if (!cur) return;
    if (apply) {
      const patch = applyPlatformOptimization(cur, platform);
      const next = { ...cur, ...patch } as StoryProject;
      next.voiceLines = buildVoiceLines(next.scenes, next.characters, next.voice);
      next.platformOptimizations = [
        ...(cur.platformOptimizations || []).filter((p) => p.platform !== platform),
        analyzeProject(next, platform),
      ];
      get().updateProject(next);
      get().showToast(`Applied ${platform} optimization pack`, "success");
    } else {
      const analysis = analyzeProject(cur, platform);
      get().updateProject({
        platformOptimizations: [
          ...(cur.platformOptimizations || []).filter((p) => p.platform !== platform),
          analysis,
        ],
        targetPlatform: platform,
      });
      get().showToast(`${platform} score: ${analysis.score}/100`, "info");
    }
  },

  analyzeAllPlatforms: () => {
    const cur = get().current;
    if (!cur) return;
    const all = optimizeAllPlatforms(cur);
    get().updateProject({ platformOptimizations: all });
    get().showToast("All platforms analyzed", "success");
  },

  generateMetadata: (platforms) => {
    const cur = get().current;
    if (!cur) return;
    const metadata = generateAllMetadata(cur, platforms);
    // attach optimizations
    metadata.platforms = metadata.platforms.map((pm) => ({
      ...pm,
      optimization: analyzeProject(cur, pm.platform),
    }));
    get().updateProject({ metadata });
    get().showToast("Platform metadata generated", "success");
  },

  updateMetadata: (patch) => {
    const cur = get().current;
    if (!cur) return;
    get().updateProject({ metadata: { ...cur.metadata, ...patch } });
  },

  regeneratePlatform: (platform) => {
    const cur = get().current;
    if (!cur) return;
    const fresh = {
      ...regenerateSinglePlatform(cur, platform),
      optimization: analyzeProject(cur, platform),
    };
    const platforms = cur.metadata.platforms.filter((p) => p.platform !== platform);
    platforms.push(fresh);
    get().updateProject({ metadata: { ...cur.metadata, platforms } });
    get().showToast(`${platform} metadata regenerated`, "success");
  },

  updatePlatformMeta: (platform, patch) => {
    const cur = get().current;
    if (!cur) return;
    const platforms = cur.metadata.platforms.map((p) =>
      p.platform === platform ? { ...p, ...patch } : p
    );
    get().updateProject({ metadata: { ...cur.metadata, platforms } });
  },

  generateThumbnails: () => {
    const cur = get().current;
    if (!cur) return;
    const canvas = document.createElement("canvas");
    const variants = cur.metadata.thumbnailVariants.map((v, i) => {
      try {
        return { ...v, dataUrl: renderThumbnail(canvas, cur, i) };
      } catch {
        return v;
      }
    });
    const scenes = cur.scenes.map((s) => {
      try {
        return {
          ...s,
          thumbnailDataUrl: previewFrameToDataUrl(s, cur.characters, cur.style, cur.aspectRatio),
        };
      } catch {
        return s;
      }
    });
    get().updateProject({ metadata: { ...cur.metadata, thumbnailVariants: variants }, scenes });
    get().showToast("Thumbnails generated", "success");
  },

  renderScene: async (sceneId) => {
    const cur = get().current;
    if (!cur || get().rendering) return;
    const scene = cur.scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    const ac = new AbortController();
    set({ rendering: true, renderProgress: 0, renderMessage: "Starting…", abortController: ac });
    get().updateProject({
      scenes: cur.scenes.map((s) => (s.id === sceneId ? { ...s, status: "rendering" } : s)),
    });

    try {
      if (!cur.voiceLines.length) get().rebuildVoiceLines();
      if (!cur.subtitles.cues.length) get().rebuildSubtitles();
      const fresh = get().current!;
      let offset = 0;
      for (const s of fresh.scenes) {
        if (s.id === sceneId) break;
        offset += s.durationSec;
      }
      const blob = await renderSceneVideo(scene, {
        aspectRatio: fresh.aspectRatio,
        style: fresh.style,
        characters: fresh.characters,
        quality: get().settings.quality,
        fps: get().settings.fps,
        subtitles: fresh.subtitles,
        burnSubtitles: get().settings.subtitlesEnabled,
        voice: fresh.voice,
        voiceLines: fresh.voiceLines,
        soundtrackMood: fresh.soundtrackMood,
        musicEnabled: get().settings.musicEnabled,
        timelineOffset: offset,
        signal: ac.signal,
        onProgress: (p, msg) => set({ renderProgress: p, renderMessage: msg }),
      });
      const key = blobKey(fresh.id, sceneId);
      await saveBlob(key, blob);
      const thumb = previewFrameToDataUrl(scene, fresh.characters, fresh.style, fresh.aspectRatio);
      const scenes = get().current!.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, status: "done" as const, videoBlobKey: key, thumbnailDataUrl: thumb }
          : s
      );
      get().updateProject({ scenes });
      await get().persist();
      get().showToast(`Scene "${scene.title}" rendered`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Render failed";
      if (msg !== "Aborted") get().showToast(msg, "error");
      get().updateProject({
        scenes: get().current!.scenes.map((s) =>
          s.id === sceneId ? { ...s, status: "error" as const } : s
        ),
      });
    } finally {
      set({ rendering: false, abortController: null, renderMessage: "" });
    }
  },

  renderAll: async () => {
    const cur = get().current;
    if (!cur || get().rendering) return;
    const ac = new AbortController();
    set({
      rendering: true,
      renderProgress: 0,
      renderMessage: "Starting full render…",
      abortController: ac,
    });
    get().updateProject({ status: "rendering", renderProgress: 0 });

    try {
      if (!cur.voiceLines.length) get().rebuildVoiceLines();
      if (!cur.subtitles.cues.length) get().rebuildSubtitles();

      const n = cur.scenes.length;
      for (let i = 0; i < n; i++) {
        if (ac.signal.aborted) throw new Error("Aborted");
        const scene = get().current!.scenes[i];
        set({ renderMessage: `Scene ${i + 1}/${n}: ${scene.title}` });
        let offset = 0;
        for (let j = 0; j < i; j++) offset += get().current!.scenes[j].durationSec;
        const blob = await renderSceneVideo(scene, {
          aspectRatio: get().current!.aspectRatio,
          style: get().current!.style,
          characters: get().current!.characters,
          quality: get().settings.quality,
          fps: get().settings.fps,
          subtitles: get().current!.subtitles,
          burnSubtitles: get().settings.subtitlesEnabled,
          voice: get().current!.voice,
          voiceLines: get().current!.voiceLines,
          soundtrackMood: get().current!.soundtrackMood,
          musicEnabled: get().settings.musicEnabled,
          timelineOffset: offset,
          signal: ac.signal,
          onProgress: (p, msg) =>
            set({ renderProgress: (i + p) / (n + 1), renderMessage: msg }),
        });
        const key = blobKey(cur.id, scene.id);
        await saveBlob(key, blob);
        const thumb = previewFrameToDataUrl(
          scene,
          get().current!.characters,
          get().current!.style,
          get().current!.aspectRatio
        );
        get().updateProject({
          scenes: get().current!.scenes.map((s) =>
            s.id === scene.id
              ? { ...s, status: "done" as const, videoBlobKey: key, thumbnailDataUrl: thumb }
              : s
          ),
        });
      }

      set({ renderMessage: "Assembling final film with VO + subs…" });
      const full = await renderFullVideo({
        scenes: get().current!.scenes,
        characters: get().current!.characters,
        style: get().current!.style,
        aspectRatio: get().current!.aspectRatio,
        quality: get().settings.quality,
        fps: get().settings.fps,
        subtitles: get().current!.subtitles,
        burnSubtitles: get().settings.subtitlesEnabled,
        voice: get().current!.voice,
        voiceLines: get().current!.voiceLines,
        soundtrackMood: get().current!.soundtrackMood,
        musicEnabled: get().settings.musicEnabled,
        signal: ac.signal,
        onProgress: (p, msg) =>
          set({
            renderProgress: n / (n + 1) + p / (n + 1),
            renderMessage: msg,
          }),
      });
      await saveBlob(fullVideoKey(cur.id), full);
      get().generateThumbnails();
      if (!get().current!.metadata.platforms.length) get().generateMetadata();
      get().updateProject({ status: "complete", renderProgress: 1 });
      await get().persist();
      set({ renderProgress: 1, activeTab: "render" });
      get().showToast("Full film rendered with voice + subtitles!", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Render failed";
      if (msg !== "Aborted") get().showToast(msg, "error");
      get().updateProject({ status: "scenes" });
    } finally {
      set({ rendering: false, abortController: null });
    }
  },

  cancelRender: () => {
    get().abortController?.abort();
    stopSpeaking();
    set({ rendering: false, abortController: null, renderMessage: "Cancelled" });
  },

  getSceneVideoUrl: async (sceneId) => {
    const cur = get().current;
    if (!cur) return null;
    const scene = cur.scenes.find((s) => s.id === sceneId);
    const blob = await loadBlob(scene?.videoBlobKey || blobKey(cur.id, sceneId));
    return blob ? URL.createObjectURL(blob) : null;
  },

  getFullVideoUrl: async () => {
    const cur = get().current;
    if (!cur) return null;
    const blob = await loadBlob(fullVideoKey(cur.id));
    return blob ? URL.createObjectURL(blob) : null;
  },

  refreshScenePreview: (sceneId) => {
    const cur = get().current;
    if (!cur) return;
    const scene = cur.scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    try {
      const url = previewFrameToDataUrl(scene, cur.characters, cur.style, cur.aspectRatio);
      set({ previewUrls: { ...get().previewUrls, [sceneId]: url } });
    } catch {
      /* */
    }
  },

  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await saveSettings(settings, get().user?.id);
  },
}));
