/**
 * Deep per-platform optimization — every element tuned for max views,
 * watch time, and monetization using current platform best practices.
 */

import {
  Platform,
  PlatformOptimization,
  StoryProject,
  SubtitleTemplateId,
  VoicePersona,
  AspectRatio,
} from "./types";
import { buildSubtitles } from "./subtitle-engine";
import { VOICE_PERSONAS } from "./voice-engine";

export interface PlatformPlaybook {
  platform: Platform;
  label: string;
  idealAspect: AspectRatio;
  idealDurationSec: [number, number];
  hookWindowSec: number;
  subtitleTemplate: SubtitleTemplateId;
  voicePersona: VoicePersona;
  voiceRate: number;
  captionsRequired: boolean;
  emojiBoost: boolean;
  cutPaceSec: number;
  maxTitleLen: number;
  algorithm: string[];
  retention: string[];
  monetization: string[];
  audioTips: string[];
  visualTips: string[];
  posting: string[];
}

export const PLAYBOOKS: Record<Platform, PlatformPlaybook> = {
  youtube: {
    platform: "youtube",
    label: "YouTube Long-form",
    idealAspect: "16:9",
    idealDurationSec: [180, 900],
    hookWindowSec: 15,
    subtitleTemplate: "youtube-classic",
    voicePersona: "narrator-warm",
    voiceRate: 0.98,
    captionsRequired: true,
    emojiBoost: false,
    cutPaceSec: 4,
    maxTitleLen: 70,
    algorithm: [
      "CTR from thumbnail+title is #1 ranking signal after click",
      "AVD (average view duration) > 50% unlocks browse/suggested",
      "Session time: end screens + cards keep viewers on platform",
      "First 15s must re-confirm the promise of the title",
    ],
    retention: [
      "Open on motion + unanswered question",
      "Pattern interrupt every 20–30s",
      "Open loops early, close late",
      "Chapters improve scrubbing & SEO",
    ],
    monetization: [
      "Mid-roll eligible >8 min — structure natural ad breaks",
      "Pin comment with affiliate/playlist",
      "End screen: subscribe + next video pair",
      "SEO title front-load primary keyword",
    ],
    audioTips: ["Clear VO -14 LUFS", "Music under -24 LUFS during speech", "Room tone continuity"],
    visualTips: ["Face in thumbnail 1/3 frame", "High contrast grade", "Text-safe margins 10%"],
    posting: ["Thu–Fri 12–4pm local", "Consistency > virality"],
  },
  "youtube-shorts": {
    platform: "youtube-shorts",
    label: "YouTube Shorts",
    idealAspect: "9:16",
    idealDurationSec: [15, 45],
    hookWindowSec: 1,
    subtitleTemplate: "tiktok-bold",
    voicePersona: "narrator-bright",
    voiceRate: 1.08,
    captionsRequired: true,
    emojiBoost: true,
    cutPaceSec: 1.8,
    maxTitleLen: 40,
    algorithm: [
      "Swipe-away rate in first 1–2s is deadly",
      "Loop completion boosts distribution",
      "Hashtags light; title keywords matter",
      "Series (Part 1/2/3) multiply subs",
    ],
    retention: [
      "Visual hook frame 0",
      "Text on screen immediately",
      "Seamless loop: last frame → first",
      "Payoff before 30s",
    ],
    monetization: ["Shorts fund + funnel to long-form", "Pin comment → full video", "Subscribe CTA spoken + text"],
    audioTips: ["Trending energy without copyright", "VO loud and punchy"],
    visualTips: ["Safe zone center 80%", "Big faces", "No tiny text"],
    posting: ["Daily if possible", "1–3x/day peak growth"],
  },
  tiktok: {
    platform: "tiktok",
    label: "TikTok",
    idealAspect: "9:16",
    idealDurationSec: [12, 45],
    hookWindowSec: 1,
    subtitleTemplate: "tiktok-bold",
    voicePersona: "narrator-bright",
    voiceRate: 1.1,
    captionsRequired: true,
    emojiBoost: true,
    cutPaceSec: 1.5,
    maxTitleLen: 80,
    algorithm: [
      "Watch % and rewatches dominate FYP",
      "Shares > likes for distribution",
      "Native sounds + original VO preferred",
      "Posting velocity trains the algorithm on your niche",
    ],
    retention: [
      "0.0s pattern interrupt",
      "Open loop in spoken first line",
      "Captions word-highlight (karaoke)",
      "Save-worthy payoff punchline",
    ],
    monetization: [
      "Series cliffhangers → follows",
      "Bio link after 1k+",
      "Spark Ads on top organic",
      "LIVE after viral spike",
    ],
    audioTips: ["Native loudness", "Skip slow intros", "Emotion in first word"],
    visualTips: ["Jump cuts", "Zoom punch-ins", "Text ≈ 30% frame height for hooks"],
    posting: ["Tue–Thu 7–9pm", "Reply to comments with video"],
  },
  "instagram-reels": {
    platform: "instagram-reels",
    label: "Instagram Reels",
    idealAspect: "9:16",
    idealDurationSec: [10, 30],
    hookWindowSec: 1.5,
    subtitleTemplate: "instagram-clean",
    voicePersona: "narrator-warm",
    voiceRate: 1.05,
    captionsRequired: true,
    emojiBoost: true,
    cutPaceSec: 2,
    maxTitleLen: 60,
    algorithm: [
      "Shares to Stories & DMs heavily weighted",
      "Saves signal quality",
      "Original audio can trend inside IG",
      "Aesthetic consistency builds profile visits",
    ],
    retention: ["Cover frame is the thumbnail", "Hook text in first frame", "Finish with CTA sticker-ready"],
    monetization: ["Bio funnel", "Collab tags", "Broadcast channels", "Bonuses/Reels play"],
    audioTips: ["Trending audio remix with original VO"],
    visualTips: ["Polished grade", "Face + product clarity", "Safe UI margins"],
    posting: ["Wed 11am / evenings", "Cross-post to Stories"],
  },
  "instagram-feed": {
    platform: "instagram-feed",
    label: "Instagram Feed",
    idealAspect: "4:5",
    idealDurationSec: [15, 60],
    hookWindowSec: 3,
    subtitleTemplate: "instagram-clean",
    voicePersona: "documentary",
    voiceRate: 1.0,
    captionsRequired: true,
    emojiBoost: false,
    cutPaceSec: 3,
    maxTitleLen: 50,
    algorithm: ["Saves & shares", "Relationship signals", "Completion rate"],
    retention: ["Carousel-mindset: each second a slide", "Caption first line = hook"],
    monetization: ["Shop tags", "Creator marketplace", "Email capture in bio"],
    audioTips: ["Subtle music", "Clear VO"],
    visualTips: ["Brand palette", "Still-worthy freeze frames"],
    posting: ["Wed–Fri mornings"],
  },
  facebook: {
    platform: "facebook",
    label: "Facebook",
    idealAspect: "1:1",
    idealDurationSec: [30, 180],
    hookWindowSec: 3,
    subtitleTemplate: "netflix",
    voicePersona: "broadcast",
    voiceRate: 1.0,
    captionsRequired: true,
    emojiBoost: false,
    cutPaceSec: 3.5,
    maxTitleLen: 60,
    algorithm: ["Watch time on platform", "Shares to groups", "Native upload > links"],
    retention: ["Captions always (90% silent autoplay)", "Emotional open", "Question CTA"],
    monetization: ["In-stream ads 1min+", "Stars / fan subscriptions", "Group community"],
    audioTips: ["Assume muted start — captions carry meaning"],
    visualTips: ["Square or 4:5 performs in feed", "Big text"],
    posting: ["1–4pm weekdays"],
  },
  twitter: {
    platform: "twitter",
    label: "X / Twitter",
    idealAspect: "16:9",
    idealDurationSec: [15, 45],
    hookWindowSec: 2,
    subtitleTemplate: "minimal",
    voicePersona: "broadcast",
    voiceRate: 1.1,
    captionsRequired: true,
    emojiBoost: false,
    cutPaceSec: 2,
    maxTitleLen: 70,
    algorithm: ["Replies & quote tweets", "Watch completion", "Follow graph"],
    retention: ["Hot take cold open", "Readable without sound"],
    monetization: ["Subscriptions", "Tip jar", "Drive to newsletter/YT"],
    audioTips: ["Punchy VO"],
    visualTips: ["High contrast still works as thumbnail"],
    posting: ["Weekday mornings"],
  },
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    idealAspect: "16:9",
    idealDurationSec: [30, 120],
    hookWindowSec: 5,
    subtitleTemplate: "netflix",
    voicePersona: "documentary",
    voiceRate: 0.98,
    captionsRequired: true,
    emojiBoost: false,
    cutPaceSec: 4,
    maxTitleLen: 80,
    algorithm: ["Dwell time", "Comments from your network", "Native document/video"],
    retention: ["Professional insight hook", "Story → lesson structure", "Soft CTA"],
    monetization: ["Lead gen", "Personal brand inbound", "Newsletters"],
    audioTips: ["Authoritative calm VO"],
    visualTips: ["Clean corporate-cinematic", "Avoid clickbait faces"],
    posting: ["Tue–Thu 8–10am"],
  },
  snapchat: {
    platform: "snapchat",
    label: "Snapchat Spotlight",
    idealAspect: "9:16",
    idealDurationSec: [8, 30],
    hookWindowSec: 1,
    subtitleTemplate: "tiktok-bold",
    voicePersona: "narrator-bright",
    voiceRate: 1.12,
    captionsRequired: true,
    emojiBoost: true,
    cutPaceSec: 1.2,
    maxTitleLen: 40,
    algorithm: ["Completion + rewatch", "Young demo native style"],
    retention: ["Raw energy", "Text stickers energy", "Fast payoff"],
    monetization: ["Spotlight payouts", "Story ads"],
    audioTips: ["Loud, youthful"],
    visualTips: ["Vertical only", "Face-forward"],
    posting: ["Evenings & weekends"],
  },
  pinterest: {
    platform: "pinterest",
    label: "Pinterest",
    idealAspect: "9:16",
    idealDurationSec: [6, 15],
    hookWindowSec: 2,
    subtitleTemplate: "minimal",
    voicePersona: "whisper",
    voiceRate: 0.95,
    captionsRequired: true,
    emojiBoost: false,
    cutPaceSec: 2.5,
    maxTitleLen: 100,
    algorithm: ["Saves & closeups", "Keyword SEO on pin title", "Seasonal relevance"],
    retention: ["Idea-first visuals", "Text overlay keywords"],
    monetization: ["Product tags", "Outbound traffic"],
    audioTips: ["Soft aesthetic audio"],
    visualTips: ["2:3 still-worthy", "Bright readable grade"],
    posting: ["Evenings, weekends"],
  },
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function analyzeProject(project: StoryProject, platform: Platform): PlatformOptimization {
  const pb = PLAYBOOKS[platform];
  const dur = project.scenes.reduce((s, sc) => s + sc.durationSec, 0);
  const fixes: string[] = [];
  const scores = { hook: 70, pacing: 70, captions: 70, audio: 70, visual: 70, cta: 65, seo: 70 };

  // Aspect
  if (project.aspectRatio !== pb.idealAspect) {
    scores.visual -= 15;
    fixes.push(`Switch aspect to ${pb.idealAspect} for ${pb.label}`);
  } else scores.visual += 8;

  // Duration
  const [dMin, dMax] = pb.idealDurationSec;
  if (dur < dMin) {
    scores.pacing -= 10;
    fixes.push(`Lengthen to ≥${dMin}s (now ${Math.round(dur)}s) for algorithm sweet spot`);
  } else if (dur > dMax) {
    scores.pacing -= 8;
    fixes.push(`Trim toward ${dMax}s max for ${pb.label} retention`);
  } else scores.pacing += 10;

  // Hook scene
  const first = project.scenes[0];
  if (first) {
    if (first.type === "establishing" && pb.hookWindowSec <= 2) {
      scores.hook -= 12;
      fixes.push("Replace calm establishing open with action/revelation hook in first 1s");
    }
    if (first.narration && first.narration.length > 120 && pb.hookWindowSec <= 2) {
      scores.hook -= 8;
      fixes.push("Shorten opening narration to one punchy sentence");
    }
    if (/[?!]|you |what if|nobody|watch/i.test(first.narration || first.title)) {
      scores.hook += 10;
    }
  }

  // Captions
  if (project.subtitles?.cues?.length) {
    scores.captions += 12;
    if (project.subtitles.templateId !== pb.subtitleTemplate) {
      scores.captions -= 5;
      fixes.push(`Use “${pb.subtitleTemplate}” subtitle template for ${pb.label}`);
    }
    if (pb.emojiBoost && !project.subtitles.emojisEnabled) {
      fixes.push("Enable AI emojis in captions — lifts save/share on short-form");
      scores.captions -= 4;
    }
  } else {
    scores.captions -= 20;
    fixes.push("Generate burned-in captions — critical for silent autoplay");
  }

  // Voice
  if (project.voice?.enabled) {
    scores.audio += 10;
    if (Math.abs(project.voice.rate - pb.voiceRate) > 0.15) {
      fixes.push(`Set VO rate near ${pb.voiceRate} for platform pacing`);
      scores.audio -= 4;
    }
    if (project.voice.persona !== pb.voicePersona) {
      fixes.push(`Try voice persona “${pb.voicePersona}” optimized for ${pb.label}`);
    }
  } else {
    scores.audio -= 15;
    fixes.push("Enable professional voice-over — audio watch time is a top signal");
  }

  // CTA / metadata
  const meta = project.metadata?.platforms?.find((p) => p.platform === platform);
  if (meta?.cta) scores.cta += 10;
  else {
    scores.cta -= 10;
    fixes.push("Add platform-native CTA + pinned comment strategy");
  }
  if (meta?.hooks?.length) scores.hook += 5;
  if ((meta?.seoKeywords?.length || 0) >= 5) scores.seo += 10;
  else fixes.push("Expand SEO keywords / hashtags for discovery");

  // Scene pace
  const avgScene = dur / Math.max(1, project.scenes.length);
  if (avgScene > pb.cutPaceSec * 2.5) {
    scores.pacing -= 10;
    fixes.push(`Average scene ${avgScene.toFixed(1)}s is slow — aim cuts near ${pb.cutPaceSec}s`);
  } else scores.pacing += 6;

  // Climax presence
  if (project.scenes.some((s) => s.type === "climax" || s.type === "revelation")) scores.hook += 5;
  else fixes.push("Add a climax/revelation beat for completion payoff");

  const vals = Object.values(scores).map((v) => clamp(v, 0, 100));
  const score = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

  const retentionHooks = [
    ...pb.retention,
    first ? `Open cold: “${(first.narration || first.title).slice(0, 80)}…”` : "Write a cold open",
  ];

  return {
    platform,
    score,
    retentionHooks,
    pacingNotes: pb.algorithm.slice(0, 3),
    hookFirst3s:
      pb.hookWindowSec <= 2
        ? "0.0s visual shock → 0.5s bold caption → 1.0s VO question"
        : "0–3s promise the title outcome, 3–15s deepen stakes",
    loopStrategy: ["tiktok", "youtube-shorts", "instagram-reels", "snapchat"].includes(platform)
      ? "Match last frame motion/energy to first frame for seamless rewatch loop"
      : undefined,
    ctaPlacement: pb.monetization[0] || "End card + spoken CTA",
    subtitleAdvice: `${pb.subtitleTemplate} template · captions ${pb.captionsRequired ? "REQUIRED" : "recommended"} · emoji ${pb.emojiBoost ? "ON" : "optional"}`,
    voiceAdvice: `Persona ${pb.voicePersona} @ rate ${pb.voiceRate} · ${pb.audioTips.join(" · ")}`,
    thumbnailAdvice: pb.visualTips.join(" · "),
    hashtagStrategy: meta?.hashtags?.slice(0, 6).join(" ") || "Mix 2 niche + 2 mid + 1 broad tags",
    postingCadence: pb.posting.join(" · "),
    monetizationTips: pb.monetization,
    elementScores: {
      hook: clamp(scores.hook, 0, 100),
      pacing: clamp(scores.pacing, 0, 100),
      captions: clamp(scores.captions, 0, 100),
      audio: clamp(scores.audio, 0, 100),
      visual: clamp(scores.visual, 0, 100),
      cta: clamp(scores.cta, 0, 100),
      seo: clamp(scores.seo, 0, 100),
    },
    appliedFixes: fixes,
  };
}

/** Apply playbook defaults onto a project (non-destructive where possible) */
export function applyPlatformOptimization(
  project: StoryProject,
  platform: Platform
): Partial<StoryProject> {
  const pb = PLAYBOOKS[platform];
  const persona = VOICE_PERSONAS.find((p) => p.id === pb.voicePersona);
  const analysis = analyzeProject(project, platform);

  const subtitles = buildSubtitles({
    scenes: project.scenes,
    characters: project.characters,
    language: project.subtitles?.language || project.language?.slice(0, 2) || "en",
    templateId: pb.subtitleTemplate,
    emojisEnabled: pb.emojiBoost || project.subtitles?.emojisEnabled || false,
    fontScale: ["tiktok", "youtube-shorts", "snapchat"].includes(platform) ? 1.15 : 1,
    platform,
  });

  // Slightly retune scene durations toward pace
  const total = project.scenes.reduce((s, sc) => s + sc.durationSec, 0);
  const [dMin, dMax] = pb.idealDurationSec;
  let scenes = project.scenes;
  if (total > 0 && (total < dMin * 0.7 || total > dMax * 1.3)) {
    const target = clamp(total, dMin, dMax);
    const scale = target / total;
    scenes = project.scenes.map((s) => ({
      ...s,
      durationSec: Math.max(2, Math.round(s.durationSec * scale * 10) / 10),
    }));
  }

  // First scene hook boost for short-form
  if (pb.hookWindowSec <= 2 && scenes[0]) {
    const s0 = scenes[0];
    if (s0.type === "establishing") {
      scenes = scenes.map((s, i) =>
        i === 0
          ? {
              ...s,
              type: "revelation" as const,
              cameraAngle: "close-up" as const,
              transition: "flash" as const,
              title: s.title.startsWith("HOOK:") ? s.title : `HOOK: ${s.title}`,
            }
          : s
      );
    }
  }

  return {
    targetPlatform: platform,
    aspectRatio: pb.idealAspect,
    scenes,
    voice: {
      ...project.voice,
      enabled: true,
      persona: pb.voicePersona,
      rate: pb.voiceRate,
      pitch: persona?.pitch ?? project.voice.pitch,
      volume: persona?.volume ?? project.voice.volume,
    },
    subtitles,
    platformOptimizations: [
      ...(project.platformOptimizations || []).filter((p) => p.platform !== platform),
      analysis,
    ],
  };
}

export function optimizeAllPlatforms(project: StoryProject): PlatformOptimization[] {
  return (Object.keys(PLAYBOOKS) as Platform[]).map((p) => analyzeProject(project, p));
}
