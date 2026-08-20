export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";
export type VideoLength = "short" | "medium" | "long" | "feature";
export type SceneType =
  | "establishing"
  | "dialogue"
  | "action"
  | "emotional"
  | "montage"
  | "climax"
  | "resolution"
  | "flashback"
  | "dream"
  | "chase"
  | "revelation"
  | "transition";

export type StoryStyle =
  | "cinematic"
  | "documentary"
  | "anime"
  | "noir"
  | "fairy-tale"
  | "sci-fi"
  | "horror"
  | "comedy"
  | "drama"
  | "adventure"
  | "mystery"
  | "romance"
  | "thriller"
  | "epic"
  | "minimalist";

export type NarrativeStructure =
  | "three-act"
  | "heros-journey"
  | "kishotenketsu"
  | "in-medias-res"
  | "nonlinear"
  | "frame-story"
  | "episodic"
  | "save-the-cat";

export type Platform =
  | "youtube"
  | "youtube-shorts"
  | "tiktok"
  | "instagram-reels"
  | "instagram-feed"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "snapchat"
  | "pinterest";

export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "mentor"
  | "ally"
  | "love-interest"
  | "comic-relief"
  | "threshold-guardian"
  | "shapeshifter"
  | "herald"
  | "shadow"
  | "supporting";

export type Emotion =
  | "neutral"
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "surprised"
  | "determined"
  | "loving"
  | "confused"
  | "excited"
  | "melancholy"
  | "fierce"
  | "hopeful"
  | "desperate"
  | "triumphant";

export type CameraAngle =
  | "wide"
  | "medium"
  | "close-up"
  | "extreme-close-up"
  | "low-angle"
  | "high-angle"
  | "dutch"
  | "over-shoulder"
  | "pov"
  | "aerial"
  | "tracking"
  | "dolly-zoom";

export type LightingMood =
  | "golden-hour"
  | "blue-hour"
  | "noir"
  | "high-key"
  | "low-key"
  | "neon"
  | "candlelight"
  | "harsh-sun"
  | "overcast"
  | "moonlight"
  | "firelight"
  | "storm";

export type SubtitleTemplateId =
  | "netflix"
  | "tiktok-bold"
  | "karaoke"
  | "cinematic"
  | "minimal"
  | "youtube-classic"
  | "neon-glow"
  | "typewriter"
  | "instagram-clean"
  | "drama-impact";

export type VoicePersona =
  | "narrator-warm"
  | "narrator-epic"
  | "narrator-dark"
  | "narrator-bright"
  | "character-soft"
  | "character-intense"
  | "documentary"
  | "trailer"
  | "whisper"
  | "broadcast";

export interface CharacterAppearance {
  age: string;
  gender: string;
  height: string;
  build: string;
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  facialFeatures: string;
  clothing: string;
  accessories: string;
  distinguishingMarks: string;
  colorPalette: string[];
}

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  appearance: CharacterAppearance;
  personality: string[];
  backstory: string;
  voiceStyle: string;
  speechPattern: string;
  arc: string;
  relationships: { characterId: string; relation: string }[];
  consistencyPrompt: string;
  visualSeed: number;
  emotionOverrides: Partial<Record<Emotion, string>>;
  /** Preferred TTS voice URI or name */
  voiceId?: string;
  voicePersona?: VoicePersona;
  voiceRate?: number;
  voicePitch?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SubtitleCue {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  textWithEmoji?: string;
  speaker?: string;
  emotion?: Emotion;
}

export interface SubtitleTrack {
  language: string;
  languageLabel: string;
  templateId: SubtitleTemplateId;
  emojisEnabled: boolean;
  cues: SubtitleCue[];
  fontScale: number;
  position: "bottom" | "center" | "top";
  maxCharsPerLine: number;
}

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  voiceURI: string;
  persona: VoicePersona;
  rate: number; // 0.5 – 2
  pitch: number; // 0 – 2
  volume: number; // 0 – 1
  pauseBetweenSentencesMs: number;
  emphasis: number; // 0 – 1
  stabilizeRate: boolean;
  autoMatchCharacter: boolean;
}

export interface VoiceLine {
  id: string;
  sceneId: string;
  text: string;
  characterId?: string;
  startSec: number;
  durationSec: number;
  emotion: Emotion;
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  audioBlobKey?: string;
  status: "pending" | "ready" | "error";
}

export interface Scene {
  id: string;
  order: number;
  title: string;
  type: SceneType;
  narration: string;
  dialogue: { characterId: string; line: string; emotion: Emotion }[];
  characterIds: string[];
  setting: string;
  timeOfDay: string;
  weather: string;
  cameraAngle: CameraAngle;
  lighting: LightingMood;
  mood: string;
  action: string;
  visualPrompt: string;
  durationSec: number;
  transition: "cut" | "fade" | "dissolve" | "wipe" | "zoom" | "flash";
  musicCue: string;
  soundEffects: string[];
  colorGrade: string;
  status: "draft" | "ready" | "rendering" | "done" | "error";
  videoBlobKey?: string;
  thumbnailDataUrl?: string;
  voiceLines?: VoiceLine[];
  /** Local timeline offset in full film */
  timelineStartSec?: number;
}

export interface PlatformOptimization {
  platform: Platform;
  score: number; // 0-100 viral potential
  retentionHooks: string[];
  pacingNotes: string[];
  hookFirst3s: string;
  loopStrategy?: string;
  ctaPlacement: string;
  subtitleAdvice: string;
  voiceAdvice: string;
  thumbnailAdvice: string;
  hashtagStrategy: string;
  postingCadence: string;
  monetizationTips: string[];
  elementScores: {
    hook: number;
    pacing: number;
    captions: number;
    audio: number;
    visual: number;
    cta: number;
    seo: number;
  };
  appliedFixes: string[];
}

export interface StoryProject {
  id: string;
  userId: string;
  title: string;
  logline: string;
  synopsis: string;
  genre: string[];
  style: StoryStyle;
  structure: NarrativeStructure;
  aspectRatio: AspectRatio;
  targetLength: VideoLength;
  targetDurationSec: number;
  language: string;
  tone: string;
  themes: string[];
  characters: Character[];
  scenes: Scene[];
  globalStylePrompt: string;
  soundtrackMood: string;
  colorPalette: string[];
  status: "idea" | "outlined" | "scripted" | "characters" | "scenes" | "rendering" | "complete" | "archived";
  archived: boolean;
  version: number;
  targetPlatform: Platform;
  createdAt: number;
  updatedAt: number;
  metadata: ProjectMetadata;
  renderProgress: number;
  voice: VoiceSettings;
  subtitles: SubtitleTrack;
  subtitleTracks: SubtitleTrack[];
  voiceLines: VoiceLine[];
  platformOptimizations: PlatformOptimization[];
  notes?: string;
}

export interface PlatformMetadata {
  platform: Platform;
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  thumbnailPrompt: string;
  thumbnailDataUrl?: string;
  cta: string;
  bestPostTime: string;
  hooks: string[];
  seoKeywords: string[];
  chapterMarkers?: { time: string; title: string }[];
  altText: string;
  pinnedComment?: string;
  endScreen?: string;
  optimization?: PlatformOptimization;
}

export interface ProjectMetadata {
  masterTitle: string;
  masterDescription: string;
  masterTags: string[];
  platforms: PlatformMetadata[];
  thumbnailVariants: { id: string; label: string; dataUrl?: string; prompt: string }[];
  generatedAt?: number;
}

export interface AppSettings {
  defaultStyle: StoryStyle;
  defaultAspect: AspectRatio;
  defaultLanguage: string;
  autoSave: boolean;
  quality: "draft" | "standard" | "cinematic" | "imax";
  fps: 24 | 30 | 60;
  voiceEnabled: boolean;
  musicEnabled: boolean;
  subtitlesEnabled: boolean;
  defaultSubtitleTemplate: SubtitleTemplateId;
  defaultVoicePersona: VoicePersona;
  targetPlatform: Platform;
  emojiInSubtitles: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  email: string;
  /** SHA-256 hex of password + salt */
  passwordHash: string;
  salt: string;
  avatarColor: string;
  createdAt: number;
  lastLoginAt: number;
  preferences: Partial<AppSettings>;
}

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  token: string;
  expiresAt: number;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  type: "story" | "scene" | "character" | "metadata" | "full-render" | "thumbnail" | "voice" | "subtitles";
  status: "queued" | "running" | "done" | "error";
  progress: number;
  message: string;
  startedAt: number;
  finishedAt?: number;
  error?: string;
}
