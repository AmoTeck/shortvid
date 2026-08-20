import {
  Platform,
  PlatformMetadata,
  ProjectMetadata,
  StoryProject,
} from "./types";
import { pick, pickN, uid, now, slugify } from "./utils";

const PLATFORM_SPECS: Record<
  Platform,
  {
    label: string;
    titleMax: number;
    descMax: number;
    tagMax: number;
    hashtagStyle: "heavy" | "moderate" | "light" | "none";
    tone: string;
    ctaPool: string[];
    bestTimes: string[];
    algoTips: string[];
  }
> = {
  youtube: {
    label: "YouTube",
    titleMax: 100,
    descMax: 5000,
    tagMax: 15,
    hashtagStyle: "light",
    tone: "search-optimized, curiosity-driven, keyword-rich",
    ctaPool: [
      "Subscribe and hit the bell for more cinematic stories",
      "If this moved you, like & subscribe — new stories every week",
      "Comment your theory below — I read every one",
      "Watch the full playlist for the complete saga",
    ],
    bestTimes: ["Thu 2–4 PM", "Fri 12–3 PM", "Sat 9–11 AM"],
    algoTips: ["front-load keywords in title", "first 15s hook", "chapters for retention", "end screen + cards"],
  },
  "youtube-shorts": {
    label: "YouTube Shorts",
    titleMax: 100,
    descMax: 100,
    tagMax: 5,
    hashtagStyle: "moderate",
    tone: "punchy, loop-worthy, trend-aware",
    ctaPool: [
      "Follow for part 2 🔥",
      "Loop it. Then tell me the ending you wanted.",
      "Part 2 drops tomorrow — follow so you don't miss it",
    ],
    bestTimes: ["Mon–Fri 12–3 PM", "Sun 9–11 AM"],
    algoTips: ["hook in 1 second", "text on screen", "loop seamlessly", "trending audio energy"],
  },
  tiktok: {
    label: "TikTok",
    titleMax: 150,
    descMax: 2200,
    tagMax: 5,
    hashtagStyle: "heavy",
    tone: "native, conversational, scroll-stopping",
    ctaPool: [
      "Duet this with your reaction 👀",
      "Part 2 if this hits 10K ❤️",
      "Save this for later. Trust me.",
      "Stitch your theory — I'll feature the best ones",
    ],
    bestTimes: ["Tue–Thu 7–9 PM", "Fri 5–7 PM"],
    algoTips: ["native vertical", "captions always on", "pattern interrupt at 0:01", "series format"],
  },
  "instagram-reels": {
    label: "Instagram Reels",
    titleMax: 90,
    descMax: 2200,
    tagMax: 10,
    hashtagStyle: "heavy",
    tone: "aesthetic, aspirational, shareable",
    ctaPool: [
      "Save & share with someone who needs this story",
      "Follow for daily cinematic drops",
      "Which character are you? Comment below 👇",
    ],
    bestTimes: ["Mon–Fri 11 AM–1 PM", "Wed 7–9 PM"],
    algoTips: ["cover frame matters", "trending audio", "keyword in caption first line", "share to Stories"],
  },
  "instagram-feed": {
    label: "Instagram Feed",
    titleMax: 60,
    descMax: 2200,
    tagMax: 20,
    hashtagStyle: "heavy",
    tone: "polished, brandable, carousel-friendly",
    ctaPool: [
      "Link in bio for the full film",
      "Double-tap if this hit different",
      "Tag a friend who lives for stories like this",
    ],
    bestTimes: ["Wed 11 AM", "Fri 10–11 AM"],
    algoTips: ["strong first line", "alt text for reach", "location tag", "collaborate tags"],
  },
  facebook: {
    label: "Facebook",
    titleMax: 80,
    descMax: 500,
    tagMax: 5,
    hashtagStyle: "light",
    tone: "community, emotional, share-worthy",
    ctaPool: [
      "Share this with someone who needs to see it",
      "What would YOU have done? Tell us below",
      "Follow our page for more original films",
    ],
    bestTimes: ["Wed–Fri 1–4 PM"],
    algoTips: ["native upload", "ask a question", "emotional hook first", "subtitle always"],
  },
  twitter: {
    label: "X / Twitter",
    titleMax: 70,
    descMax: 280,
    tagMax: 3,
    hashtagStyle: "light",
    tone: "sharp, quotable, conversation-starting",
    ctaPool: [
      "Reply with your favorite frame",
      "RT if this wrecked you",
      "Quote-tweet your theory",
    ],
    bestTimes: ["Wed 9 AM", "Fri 12 PM"],
    algoTips: ["hook in first line", "thread for depth", "visual thumbnail", "engage replies fast"],
  },
  linkedin: {
    label: "LinkedIn",
    titleMax: 100,
    descMax: 1300,
    tagMax: 5,
    hashtagStyle: "moderate",
    tone: "professional insight, storytelling craft, leadership lessons",
    ctaPool: [
      "What's a story lesson you've applied at work? Comment below.",
      "Follow for more on narrative craft and creative leadership",
      "Repost if storytelling drives your brand",
    ],
    bestTimes: ["Tue–Thu 8–10 AM"],
    algoTips: ["document > promote", "personal voice", "3–5 hashtags", "native video"],
  },
  snapchat: {
    label: "Snapchat",
    titleMax: 40,
    descMax: 80,
    tagMax: 3,
    hashtagStyle: "none",
    tone: "raw, youthful, ephemeral energy",
    ctaPool: ["Swipe up for full story", "Add to your story", "Spotlight this"],
    bestTimes: ["Thu–Sat 7–10 PM"],
    algoTips: ["fast cuts", "text overlays", "vertical only", "Spotlight length"],
  },
  pinterest: {
    label: "Pinterest",
    titleMax: 100,
    descMax: 500,
    tagMax: 10,
    hashtagStyle: "none",
    tone: "keyword-rich, inspirational, evergreen search",
    ctaPool: [
      "Pin this for your next watchlist",
      "Save for story inspiration",
      "Click through for the full cinematic experience",
    ],
    bestTimes: ["Sat 8–11 PM", "Sun afternoons"],
    algoTips: ["vertical 2:3 pin", "keyword title", "seasonal relevance", "rich description"],
  },
};

const HOOK_TEMPLATES = [
  (t: string, g: string) => `What if ${t} was never just a ${g} story?`,
  (t: string) => `The ending of "${t}" will haunt you.`,
  (t: string) => `Nobody expected "${t}" to go this far.`,
  (t: string, g: string) => `A ${g} masterpiece in under a few minutes: ${t}`,
  (t: string) => `Watch "${t}" before it disappears from your FYP.`,
  (t: string) => `"${t}" — the story everyone will be talking about.`,
  (t: string, _g: string, theme: string) => `This is what ${theme} actually looks like. (${t})`,
  (t: string) => `I made "${t}" with zero budget. The result shocked me.`,
];

const TAG_POOL_GENERIC = [
  "shortfilm", "cinematic", "storytelling", "original", "drama", "filmmaking",
  "aiart", "visualstory", "mustwatch", "emotional", "epic", "viral",
  "movie", "film", "director", "screenwriting", "characterdriven",
];

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function buildHashtags(project: StoryProject, style: "heavy" | "moderate" | "light" | "none"): string[] {
  if (style === "none") return [];
  const base = [
    project.genre[0],
    project.style,
    ...project.themes.slice(0, 2),
    "storycinema",
    "shortfilm",
  ].map((t) => t.replace(/\s+/g, "").toLowerCase());
  const extra = pickN(TAG_POOL_GENERIC, style === "heavy" ? 8 : style === "moderate" ? 4 : 2);
  const all = [...new Set([...base, ...extra])].map((h) => (h.startsWith("#") ? h : `#${h}`));
  if (style === "heavy") return all.slice(0, 12);
  if (style === "moderate") return all.slice(0, 6);
  return all.slice(0, 3);
}

function buildTitle(project: StoryProject, platform: Platform, variant = 0): string {
  const spec = PLATFORM_SPECS[platform];
  const g = project.genre[0] || "story";
  const theme = project.themes[0] || "destiny";
  const variants = [
    `${project.title} | ${g.charAt(0).toUpperCase() + g.slice(1)} Short Film`,
    `${project.title} — A Story About ${theme}`,
    `You Won't Forget "${project.title}"`,
    `${project.title} (${project.style} ${g})`,
    `WATCH: ${project.title} 🎬`,
    `${project.title} | Full Story`,
  ];
  return truncate(variants[variant % variants.length], spec.titleMax);
}

function buildDescription(project: StoryProject, platform: Platform): string {
  const spec = PLATFORM_SPECS[platform];
  const chars = project.characters
    .slice(0, 4)
    .map((c) => `• ${c.name} (${c.role})`)
    .join("\n");
  const scenesPreview = project.scenes
    .slice(0, 5)
    .map((s, i) => `${i + 1}. ${s.title}`)
    .join("\n");

  const blocks = [
    project.logline,
    "",
    project.synopsis.slice(0, 400),
    "",
    "———",
    "CAST",
    chars,
    "",
    "CHAPTERS",
    scenesPreview,
    "",
    `Style: ${project.style} · Structure: ${project.structure} · Tone: ${project.tone}`,
    `Themes: ${project.themes.join(" · ")}`,
    "",
    pick(spec.ctaPool),
    "",
    buildHashtags(project, spec.hashtagStyle).join(" "),
  ];

  return truncate(blocks.join("\n"), spec.descMax);
}

function buildChapters(project: StoryProject): { time: string; title: string }[] {
  let t = 0;
  return project.scenes.map((s) => {
    const m = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    const marker = { time: `${m}:${String(sec).padStart(2, "0")}`, title: s.title };
    t += s.durationSec;
    return marker;
  });
}

export function generatePlatformMetadata(project: StoryProject, platform: Platform): PlatformMetadata {
  const spec = PLATFORM_SPECS[platform];
  const theme = project.themes[0] || "fate";
  const hooks = HOOK_TEMPLATES.slice(0, 4).map((fn, i) =>
    fn(project.title, project.genre[0] || "story", theme + (i ? "" : ""))
  );

  const tags = [
    project.genre[0],
    project.style,
    ...project.themes,
    ...pickN(TAG_POOL_GENERIC, 5),
    ...project.characters.slice(0, 2).map((c) => c.name.split(" ")[0]),
  ]
    .map((t) => t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim())
    .filter(Boolean)
    .slice(0, spec.tagMax);

  const seo = [
    `${project.title} short film`,
    `${project.genre[0]} story`,
    `${project.style} video`,
    ...project.themes.map((t) => `${t} film`),
    "original short film",
    "cinematic storytelling",
  ];

  return {
    platform,
    title: buildTitle(project, platform),
    description: buildDescription(project, platform),
    tags,
    hashtags: buildHashtags(project, spec.hashtagStyle),
    thumbnailPrompt: buildThumbnailPrompt(project, platform),
    cta: pick(spec.ctaPool),
    bestPostTime: pick(spec.bestTimes),
    hooks,
    seoKeywords: seo,
    chapterMarkers: platform === "youtube" ? buildChapters(project) : undefined,
    altText: `${project.title} — ${project.logline.slice(0, 120)}`,
    pinnedComment:
      platform === "youtube" || platform === "tiktok"
        ? `What did you think of the ending? 👇 Full story credits in description. #${slugify(project.title)}`
        : undefined,
    endScreen: platform === "youtube" ? "Subscribe · Watch next · Playlist" : undefined,
  };
}

export function buildThumbnailPrompt(project: StoryProject, platform?: Platform): string {
  const protag = project.characters.find((c) => c.role === "protagonist");
  const face = protag
    ? `${protag.name}: ${protag.consistencyPrompt}`
    : "a compelling central figure";
  const platformNote =
    platform === "youtube" || platform === "youtube-shorts"
      ? "high contrast face, emotional expression, room for bold title text on side, YouTube thumbnail composition"
      : platform === "tiktok" || platform === "instagram-reels"
        ? "vertical 9:16, face in upper third, bold emotion, mobile-first crop"
        : "cinematic key art poster composition";

  return [
    `Premium thumbnail key art for "${project.title}".`,
    STYLE_PROMPTS_SAFE(project),
    `Central subject: ${face}.`,
    `Mood: ${project.tone}. Genre: ${project.genre.join("/")}.`,
    `Themes visualized: ${project.themes.join(", ")}.`,
    platformNote,
    "Ultra sharp, emotional eyes looking at camera or intense off-camera gaze, dramatic lighting, no cluttered text baked in, masterpiece.",
  ].join(" ");
}

function STYLE_PROMPTS_SAFE(project: StoryProject) {
  return `Style: ${project.style}. Color palette: ${project.colorPalette.join(", ")}.`;
}

export function generateAllMetadata(project: StoryProject, platforms?: Platform[]): ProjectMetadata {
  const list: Platform[] = platforms || [
    "youtube",
    "youtube-shorts",
    "tiktok",
    "instagram-reels",
    "instagram-feed",
    "facebook",
    "twitter",
    "linkedin",
  ];

  const platformMeta = list.map((p) => generatePlatformMetadata(project, p));

  const thumbVariants = [
    {
      id: uid("thumb"),
      label: "Emotional Close-up",
      prompt: buildThumbnailPrompt(project, "youtube") + " Extreme emotional close-up, tear-catching light.",
    },
    {
      id: uid("thumb"),
      label: "Epic Wide",
      prompt: buildThumbnailPrompt(project, "youtube") + " Epic wide establishing with tiny hero silhouette.",
    },
    {
      id: uid("thumb"),
      label: "Mystery Dark",
      prompt: buildThumbnailPrompt(project, "tiktok") + " Half-shadowed face, neon rim light, mystery.",
    },
    {
      id: uid("thumb"),
      label: "Action Peak",
      prompt: buildThumbnailPrompt(project, "youtube") + " Peak action freeze-frame, motion blur, intensity.",
    },
  ];

  return {
    masterTitle: project.title,
    masterDescription: `${project.logline}\n\n${project.synopsis}`,
    masterTags: [
      ...project.genre,
      project.style,
      ...project.themes,
      "short film",
      "storycinema",
      ...project.characters.slice(0, 3).map((c) => c.name),
    ],
    platforms: platformMeta,
    thumbnailVariants: thumbVariants,
    generatedAt: now(),
  };
}

export function regenerateSinglePlatform(project: StoryProject, platform: Platform): PlatformMetadata {
  return generatePlatformMetadata(project, platform);
}

export function getPlatformLabel(p: Platform) {
  return PLATFORM_SPECS[p]?.label || p;
}

export function getAllPlatforms(): Platform[] {
  return Object.keys(PLATFORM_SPECS) as Platform[];
}

export { PLATFORM_SPECS };
