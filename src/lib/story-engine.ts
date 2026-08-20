import {
  AspectRatio,
  Character,
  CharacterAppearance,
  CharacterRole,
  Emotion,
  NarrativeStructure,
  Scene,
  SceneType,
  StoryProject,
  StoryStyle,
  VideoLength,
  CameraAngle,
  LightingMood,
} from "./types";
import { hashString, pick, pickN, seededRandom, uid, now } from "./utils";

/* ───────── Knowledge bases (fully offline) ───────── */

const GENRE_BANK: Record<string, { themes: string[]; tones: string[]; settings: string[]; conflicts: string[] }> = {
  adventure: {
    themes: ["courage", "discovery", "friendship", "freedom", "sacrifice"],
    tones: ["thrilling", "wondrous", "bold", "hopeful"],
    settings: ["ancient ruins", "uncharted jungle", "stormy seas", "mountain pass", "lost city"],
    conflicts: ["race against time", "rival expedition", "nature's fury", "cursed artifact"],
  },
  mystery: {
    themes: ["truth", "deception", "justice", "identity", "paranoia"],
    tones: ["suspenseful", "cerebral", "dark", "intriguing"],
    settings: ["foggy alley", "locked manor", "rainy city", "abandoned station", "museum after hours"],
    conflicts: ["unsolved murder", "missing person", "false identity", "conspiracy"],
  },
  romance: {
    themes: ["love", "vulnerability", "second chances", "destiny", "trust"],
    tones: ["tender", "bittersweet", "passionate", "warm"],
    settings: ["rain-soaked café", "rooftop at dusk", "train station", "autumn park", "moonlit beach"],
    conflicts: ["distance", "misunderstanding", "rival suitor", "family opposition"],
  },
  "sci-fi": {
    themes: ["humanity", "progress", "isolation", "ethics", "wonder"],
    tones: ["awe-inspiring", "cold", "philosophical", "urgent"],
    settings: ["orbital station", "neon megacity", "desert planet", "AI core chamber", "cryo bay"],
    conflicts: ["rogue AI", "first contact", "time paradox", "resource collapse"],
  },
  horror: {
    themes: ["fear", "survival", "the unknown", "guilt", "madness"],
    tones: ["dread-filled", "claustrophobic", "unsettling", "visceral"],
    settings: ["fog-choked forest", "abandoned hospital", "creaking cabin", "underground tunnels", "empty highway"],
    conflicts: ["entity in the dark", "haunting past", "body horror", "cult ritual"],
  },
  comedy: {
    themes: ["absurdity", "friendship", "failure", "reinvention", "community"],
    tones: ["witty", "slapstick", "heartfelt", "chaotic"],
    settings: ["busy office", "road trip van", "wedding venue", "small-town diner", "stage backstage"],
    conflicts: ["disastrous plan", "mistaken identity", "impossible deadline", "family reunion"],
  },
  drama: {
    themes: ["redemption", "family", "ambition", "loss", "forgiveness"],
    tones: ["intimate", "raw", "melancholic", "powerful"],
    settings: ["family kitchen", "courtroom corridor", "hospital waiting room", "empty stadium", "childhood home"],
    conflicts: ["moral dilemma", "broken relationship", "secret revealed", "life-changing choice"],
  },
  thriller: {
    themes: ["paranoia", "power", "escape", "betrayal", "control"],
    tones: ["tense", "kinetic", "cold", "relentless"],
    settings: ["crowded subway", "glass skyscraper", "border checkpoint", "safe house", "night market"],
    conflicts: ["being hunted", "ticking clock", "double agent", "framed for crime"],
  },
  fantasy: {
    themes: ["destiny", "magic", "balance", "legacy", "courage"],
    tones: ["mythic", "lyrical", "epic", "enchanted"],
    settings: ["crystal spire", "enchanted forest", "dragon's lair", "floating isles", "ancient library"],
    conflicts: ["dark prophecy", "stolen crown", "broken seal", "war of realms"],
  },
  epic: {
    themes: ["legacy", "honor", "war", "unity", "sacrifice"],
    tones: ["grand", "solemn", "heroic", "sweeping"],
    settings: ["battlefield dawn", "throne room", "mountain citadel", "fleet of ships", "coronation hall"],
    conflicts: ["empire vs rebels", "last stand", "betrayal of allies", "forbidden power"],
  },
};

const NAME_POOLS = {
  first: [
    "Aria", "Kai", "Lena", "Orion", "Maya", "Theo", "Nova", "Elias", "Sora", "Riven",
    "Zara", "Cassian", "Ivy", "Dax", "Freya", "Jasper", "Nyx", "Rowan", "Lyra", "Silas",
    "Amara", "Caleb", "Vera", "Felix", "Iris", "Nolan", "Sage", "Atlas", "Luna", "Ember",
    "Kira", "Finn", "Ayla", "Reed", "Mira", "Juno", "Asher", "Vera", "Cole", "Eden",
  ],
  last: [
    "Vale", "Cross", "Hart", "Storm", "Quinn", "Drake", "Frost", "Blake", "Shaw", "Reed",
    "Wolfe", "Kane", "Hayes", "Sloan", "Pike", "Vance", "Cole", "Grey", "North", "West",
    "Ashford", "Blackwood", "Rivers", "Stone", "Mercer", "Thorne", "Wilder", "Crow",
  ],
};

const APPEARANCE_TRAITS = {
  age: ["early 20s", "mid 20s", "early 30s", "mid 30s", "late 30s", "teen", "ageless"],
  gender: ["female", "male", "androgynous"],
  height: ["petite", "average height", "tall", "imposing"],
  build: ["lean", "athletic", "slender", "sturdy", "graceful", "broad-shouldered"],
  skinTone: ["porcelain", "fair", "warm olive", "golden tan", "deep bronze", "rich ebony", "sun-kissed"],
  hairColor: ["jet black", "chestnut brown", "golden blonde", "auburn", "silver-white", "ash brown", "copper red", "midnight blue-black"],
  hairStyle: ["shoulder-length waves", "short cropped", "long straight", "tight braids", "messy bun", "undercut with long top", "wild curls", "sleek bob"],
  eyeColor: ["stormy grey", "emerald green", "amber gold", "deep brown", "ice blue", "hazel", "violet-tinged"],
  facial: [
    "sharp cheekbones and a determined jaw",
    "soft rounded features with a warm smile",
    "angular face with an intense gaze",
    "gentle freckles across the bridge of the nose",
    "a thin scar along the left eyebrow",
    "expressive brows and full lips",
  ],
  clothing: [
    "weathered leather jacket over a simple tunic",
    "tailored dark coat with silver clasps",
    "flowing travel cloak and practical boots",
    "modern streetwear with a distinctive scarf",
    "armor fragments layered over civilian clothes",
    "elegant high-collar coat in deep indigo",
    "utility vest with many pockets and gloves",
    "soft linen shirt and a worn satchel strap",
  ],
  accessories: [
    "a glowing pendant",
    "fingerless gloves",
    "a brass pocket watch",
    "thin wire-frame glasses",
    "a single silver earring",
    "a braided leather wristband",
    "an ornate ring on the right hand",
    "none notable",
  ],
  marks: [
    "a small constellation tattoo on the wrist",
    "faint burn scars on the knuckles",
    "a birthmark shaped like a crescent",
    "none",
    "a faded tribal mark on the collarbone",
  ],
};

const PERSONALITY_TRAITS = [
  "brave", "witty", "stoic", "compassionate", "cunning", "impulsive", "loyal", "sarcastic",
  "curious", "reserved", "charismatic", "haunted", "optimistic", "pragmatic", "rebellious",
  "nurturing", "ambitious", "melancholic", "playful", "ruthless", "idealistic", "skeptical",
];

const VOICE_STYLES = [
  "warm baritone with measured cadence",
  "soft alto, slightly breathy",
  "crisp tenor, rapid when excited",
  "deep resonant voice, slow and deliberate",
  "bright youthful tone with energy",
  "raspy from years of shouting orders",
  "melodic and calm, almost hypnotic",
  "sharp and clipped, military precision",
];

const SPEECH_PATTERNS = [
  "speaks in short decisive sentences",
  "uses metaphors from nature",
  "often asks rhetorical questions",
  "trails off when emotional",
  "quotes old proverbs",
  "dry one-liners under pressure",
  "over-explains when nervous",
  "rarely uses contractions",
];

const CAMERA_BY_TYPE: Record<SceneType, CameraAngle[]> = {
  establishing: ["wide", "aerial", "high-angle"],
  dialogue: ["medium", "over-shoulder", "close-up"],
  action: ["tracking", "low-angle", "dutch", "wide"],
  emotional: ["close-up", "extreme-close-up", "medium"],
  montage: ["wide", "medium", "tracking"],
  climax: ["low-angle", "dutch", "dolly-zoom", "close-up"],
  resolution: ["wide", "medium", "high-angle"],
  flashback: ["medium", "close-up", "dutch"],
  dream: ["dutch", "pov", "aerial", "dolly-zoom"],
  chase: ["tracking", "pov", "low-angle", "wide"],
  revelation: ["close-up", "extreme-close-up", "dolly-zoom"],
  transition: ["wide", "aerial", "high-angle"],
};

const LIGHTING_BY_MOOD: Record<string, LightingMood[]> = {
  hopeful: ["golden-hour", "high-key", "overcast"],
  tense: ["low-key", "noir", "harsh-sun", "neon"],
  romantic: ["golden-hour", "candlelight", "blue-hour", "moonlight"],
  mysterious: ["noir", "moonlight", "low-key", "neon"],
  epic: ["golden-hour", "harsh-sun", "storm", "firelight"],
  sad: ["blue-hour", "overcast", "moonlight"],
  action: ["harsh-sun", "neon", "storm", "firelight"],
  wonder: ["golden-hour", "neon", "moonlight", "blue-hour"],
  default: ["golden-hour", "high-key", "overcast", "blue-hour"],
};

const STRUCTURE_BEATS: Record<NarrativeStructure, { name: string; weight: number; type: SceneType }[]> = {
  "three-act": [
    { name: "Opening Image", weight: 0.06, type: "establishing" },
    { name: "Ordinary World", weight: 0.08, type: "dialogue" },
    { name: "Inciting Incident", weight: 0.1, type: "revelation" },
    { name: "First Plot Point", weight: 0.1, type: "action" },
    { name: "Rising Action", weight: 0.12, type: "montage" },
    { name: "Midpoint Twist", weight: 0.1, type: "revelation" },
    { name: "Complications", weight: 0.12, type: "action" },
    { name: "Dark Night", weight: 0.1, type: "emotional" },
    { name: "Climax", weight: 0.12, type: "climax" },
    { name: "Resolution", weight: 0.1, type: "resolution" },
  ],
  "heros-journey": [
    { name: "Ordinary World", weight: 0.08, type: "establishing" },
    { name: "Call to Adventure", weight: 0.08, type: "revelation" },
    { name: "Refusal of the Call", weight: 0.07, type: "emotional" },
    { name: "Meeting the Mentor", weight: 0.08, type: "dialogue" },
    { name: "Crossing the Threshold", weight: 0.1, type: "action" },
    { name: "Tests & Allies", weight: 0.12, type: "montage" },
    { name: "Approach", weight: 0.08, type: "transition" },
    { name: "Ordeal", weight: 0.12, type: "climax" },
    { name: "Reward", weight: 0.08, type: "revelation" },
    { name: "The Road Back", weight: 0.08, type: "chase" },
    { name: "Resurrection", weight: 0.06, type: "climax" },
    { name: "Return with Elixir", weight: 0.05, type: "resolution" },
  ],
  kishotenketsu: [
    { name: "Ki — Introduction", weight: 0.2, type: "establishing" },
    { name: "Shō — Development", weight: 0.25, type: "dialogue" },
    { name: "Ten — Twist", weight: 0.3, type: "revelation" },
    { name: "Ketsu — Conclusion", weight: 0.25, type: "resolution" },
  ],
  "in-medias-res": [
    { name: "Mid-Crisis Hook", weight: 0.12, type: "action" },
    { name: "Flashback Origin", weight: 0.15, type: "flashback" },
    { name: "Present Escalation", weight: 0.15, type: "dialogue" },
    { name: "Deeper Past", weight: 0.12, type: "flashback" },
    { name: "Convergence", weight: 0.15, type: "revelation" },
    { name: "Climax", weight: 0.16, type: "climax" },
    { name: "Aftermath", weight: 0.15, type: "resolution" },
  ],
  nonlinear: [
    { name: "Fragment A — Future", weight: 0.12, type: "establishing" },
    { name: "Fragment B — Past", weight: 0.14, type: "flashback" },
    { name: "Fragment C — Present", weight: 0.14, type: "dialogue" },
    { name: "Fragment D — Memory", weight: 0.12, type: "dream" },
    { name: "Convergence", weight: 0.16, type: "revelation" },
    { name: "Climax Collapse", weight: 0.16, type: "climax" },
    { name: "Reordered Truth", weight: 0.16, type: "resolution" },
  ],
  "frame-story": [
    { name: "Frame Open", weight: 0.1, type: "establishing" },
    { name: "Inner Tale Begins", weight: 0.15, type: "dialogue" },
    { name: "Inner Rising", weight: 0.2, type: "action" },
    { name: "Inner Climax", weight: 0.2, type: "climax" },
    { name: "Return to Frame", weight: 0.15, type: "emotional" },
    { name: "Frame Resolution", weight: 0.2, type: "resolution" },
  ],
  episodic: [
    { name: "Cold Open", weight: 0.1, type: "establishing" },
    { name: "Episode Hook", weight: 0.15, type: "revelation" },
    { name: "B-Story", weight: 0.15, type: "dialogue" },
    { name: "A-Story Peak", weight: 0.2, type: "action" },
    { name: "Twist", weight: 0.15, type: "revelation" },
    { name: "Tag / Button", weight: 0.25, type: "resolution" },
  ],
  "save-the-cat": [
    { name: "Opening Image", weight: 0.05, type: "establishing" },
    { name: "Theme Stated", weight: 0.05, type: "dialogue" },
    { name: "Set-Up", weight: 0.08, type: "montage" },
    { name: "Catalyst", weight: 0.08, type: "revelation" },
    { name: "Debate", weight: 0.08, type: "emotional" },
    { name: "Break into Two", weight: 0.08, type: "action" },
    { name: "B Story", weight: 0.08, type: "dialogue" },
    { name: "Fun and Games", weight: 0.12, type: "montage" },
    { name: "Midpoint", weight: 0.08, type: "revelation" },
    { name: "Bad Guys Close In", weight: 0.1, type: "action" },
    { name: "All Is Lost", weight: 0.07, type: "emotional" },
    { name: "Dark Night of the Soul", weight: 0.05, type: "emotional" },
    { name: "Break into Three", weight: 0.04, type: "action" },
    { name: "Finale", weight: 0.1, type: "climax" },
    { name: "Final Image", weight: 0.04, type: "resolution" },
  ],
};

const STYLE_PROMPTS: Record<StoryStyle, string> = {
  cinematic: "cinematic film still, anamorphic lens flare, shallow depth of field, 35mm film grain, color graded like a prestige drama, volumetric lighting",
  documentary: "documentary photography, natural light, handheld camera feel, authentic textures, observational framing, real-world grit",
  anime: "high-quality anime key visual, Studio Ghibli meets Makoto Shinkai, vibrant cel shading, expressive eyes, detailed backgrounds, dramatic sky",
  noir: "film noir aesthetic, high contrast black and deep shadow, venetian blind light, rain-slicked streets, cigarette smoke haze, 1940s mood",
  "fairy-tale": "enchanted storybook illustration brought to life, soft glowing particles, magical atmosphere, rich jewel tones, dreamlike composition",
  "sci-fi": "futuristic sci-fi concept art, sleek tech surfaces, holographic UI glow, atmospheric haze, epic scale architecture, cool teal and magenta",
  horror: "horror cinema still, oppressive shadows, unsettling negative space, desaturated cold palette with blood-red accents, dread-inducing composition",
  comedy: "bright comedic framing, expressive body language, clean colorful production design, sitcom-quality lighting with playful energy",
  drama: "intimate dramatic portrait lighting, emotional authenticity, muted earth tones, subtle film grain, character-driven composition",
  adventure: "sweeping adventure epic, vast landscapes, golden hour hero lighting, dynamic poses, National Geographic meets blockbuster",
  mystery: "moody mystery thriller still, fog and half-light, enigmatic framing, cool desaturated blues, clues hidden in the frame",
  romance: "romantic cinema still, soft bokeh, warm candlelight tones, intimate two-shot framing, gentle lens bloom, emotional closeness",
  thriller: "kinetic thriller still, dutch angles, neon reflections, high contrast, sweaty tension, Michael Mann meets modern prestige",
  epic: "epic historical/fantasy still, IMAX-scale composition, god rays through clouds, army-level production design, majestic color grade",
  minimalist: "minimalist art film still, negative space, restrained palette, precise geometric framing, quiet emotional power",
};

const LENGTH_CONFIG: Record<VideoLength, { scenes: number; duration: number; label: string }> = {
  short: { scenes: 5, duration: 45, label: "Short (30–60s)" },
  medium: { scenes: 8, duration: 120, label: "Medium (1–3 min)" },
  long: { scenes: 12, duration: 480, label: "Long (5–10 min)" },
  feature: { scenes: 18, duration: 900, label: "Featurette (10–15 min)" },
};

const TRANSITIONS: Scene["transition"][] = ["cut", "fade", "dissolve", "wipe", "zoom", "flash"];

const COLOR_GRADES = [
  "teal & orange blockbuster",
  "bleach bypass gritty",
  "warm amber nostalgia",
  "cold cyan thriller",
  "pastel dreamy",
  "high contrast noir",
  "muted earthy drama",
  "neon cyberpunk",
  "golden epic",
  "desaturated war",
];

const MUSIC_CUES = [
  "low pulsing drone",
  "swelling orchestral strings",
  "intimate piano motif",
  "driving electronic beat",
  "melancholy cello solo",
  "triumphant brass fanfare",
  "tense ticking percussion",
  "ethereal choir pads",
  "acoustic guitar warmth",
  "silence with ambient wind",
];

const SFX_POOL = [
  "distant thunder",
  "footsteps on gravel",
  "city ambience",
  "wind through trees",
  "door creak",
  "heartbeat",
  "crowd murmur",
  "rain on glass",
  "sword unsheathe",
  "spaceship hum",
  "birds taking flight",
  "clock ticking",
  "fire crackle",
  "ocean waves",
];

/* ───────── Helpers ───────── */

function detectGenre(title: string, hint?: string): string {
  const t = `${title} ${hint || ""}`.toLowerCase();
  const map: [string, string[]][] = [
    ["horror", ["horror", "ghost", "haunted", "zombie", "demon", "nightmare", "terror"]],
    ["sci-fi", ["space", "robot", "ai", "future", "alien", "cyber", "mars", "quantum", "sci-fi", "scifi"]],
    ["romance", ["love", "romance", "heart", "wedding", "kiss", "crush", "valentine"]],
    ["mystery", ["mystery", "detective", "murder", "clue", "whodunit", "secret", "investigate"]],
    ["comedy", ["comedy", "funny", "laugh", "hilarious", "prank", "sitcom"]],
    ["thriller", ["thriller", "chase", "spy", "assassin", "heist", "escape", "ticking"]],
    ["fantasy", ["magic", "dragon", "wizard", "elf", "sword", "quest", "kingdom", "fantasy"]],
    ["adventure", ["adventure", "journey", "explore", "treasure", "voyage", "expedition"]],
    ["epic", ["war", "empire", "legend", "hero", "battle", "throne", "dynasty", "epic"]],
    ["drama", ["family", "loss", "redemption", "court", "illness", "drama", "father", "mother"]],
  ];
  for (const [g, keys] of map) {
    if (keys.some((k) => t.includes(k))) return g;
  }
  return "adventure";
}

function expandTitle(title: string, genre: string): { logline: string; synopsis: string; themes: string[]; tone: string } {
  const bank = GENRE_BANK[genre] || GENRE_BANK.adventure;
  const theme = pick(bank.themes);
  const theme2 = pick(bank.themes.filter((x) => x !== theme));
  const tone = pick(bank.tones);
  const setting = pick(bank.settings);
  const conflict = pick(bank.conflicts);
  const seed = hashString(title + genre);
  const rng = seededRandom(seed);

  const protags = ["a reluctant hero", "an unlikely pair", "a brilliant outsider", "a fallen guardian", "a curious wanderer"];
  const stakes = [
    "before time runs out",
    "or lose everything they love",
    "to rewrite destiny itself",
    "while the world watches",
    "against impossible odds",
  ];

  const protag = protags[Math.floor(rng() * protags.length)];
  const stake = stakes[Math.floor(rng() * stakes.length)];

  const logline = `When ${conflict} shatters the calm of ${setting}, ${protag} must confront ${theme} ${stake}.`;

  const synopsis = [
    `"${title}" is a ${tone} ${genre} story centered on ${theme} and ${theme2}.`,
    `Set against the backdrop of ${setting}, the narrative follows characters forced into ${conflict}.`,
    `As secrets surface and alliances shift, every choice tightens the emotional stakes.`,
    `Through cinematic storytelling, the film explores what it means to face the unknown — and what remains when the dust settles.`,
    `The journey moves from quiet beginnings to a powerful climax, leaving audiences with a lasting emotional imprint.`,
  ].join(" ");

  return { logline, synopsis, themes: [theme, theme2, pick(bank.themes)], tone };
}

function makeAppearance(seed: number): CharacterAppearance {
  const rng = seededRandom(seed);
  const pickFrom = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const palette = pickN(
    ["#1a1a2e", "#e94560", "#0f3460", "#16213e", "#e2d1c3", "#c9a227", "#2d6a4f", "#7b2cbf", "#f4a261", "#264653"],
    3
  );
  return {
    age: pickFrom(APPEARANCE_TRAITS.age),
    gender: pickFrom(APPEARANCE_TRAITS.gender),
    height: pickFrom(APPEARANCE_TRAITS.height),
    build: pickFrom(APPEARANCE_TRAITS.build),
    skinTone: pickFrom(APPEARANCE_TRAITS.skinTone),
    hairColor: pickFrom(APPEARANCE_TRAITS.hairColor),
    hairStyle: pickFrom(APPEARANCE_TRAITS.hairStyle),
    eyeColor: pickFrom(APPEARANCE_TRAITS.eyeColor),
    facialFeatures: pickFrom(APPEARANCE_TRAITS.facial),
    clothing: pickFrom(APPEARANCE_TRAITS.clothing),
    accessories: pickFrom(APPEARANCE_TRAITS.accessories),
    distinguishingMarks: pickFrom(APPEARANCE_TRAITS.marks),
    colorPalette: palette,
  };
}

function buildConsistencyPrompt(name: string, app: CharacterAppearance, role: CharacterRole): string {
  return [
    `CHARACTER LOCK — always depict ${name} identically:`,
    `${app.age} ${app.gender}, ${app.height}, ${app.build} build, ${app.skinTone} skin,`,
    `${app.hairColor} hair in ${app.hairStyle}, ${app.eyeColor} eyes, ${app.facialFeatures}.`,
    `Wearing: ${app.clothing}. Accessories: ${app.accessories}. Marks: ${app.distinguishingMarks}.`,
    `Role: ${role}. Maintain exact face geometry, hair, wardrobe silhouette, and color palette (${app.colorPalette.join(", ")}) across every frame.`,
    `Photorealistic living person, subtle micro-expressions, natural skin pores, cinematic realism — NEVER a still photo collage.`,
  ].join(" ");
}

export function generateCharacter(
  role: CharacterRole,
  seedBase: string,
  index: number,
  genre: string
): Character {
  const seed = hashString(`${seedBase}-${role}-${index}`);
  const rng = seededRandom(seed);
  const first = NAME_POOLS.first[Math.floor(rng() * NAME_POOLS.first.length)];
  const last = NAME_POOLS.last[Math.floor(rng() * NAME_POOLS.last.length)];
  const name = `${first} ${last}`;
  const appearance = makeAppearance(seed);
  const personality = pickN(PERSONALITY_TRAITS, 3 + Math.floor(rng() * 2));
  const bank = GENRE_BANK[genre] || GENRE_BANK.adventure;

  const arcs: Record<CharacterRole, string> = {
    protagonist: `Transforms from reluctant outsider to embodiment of ${pick(bank.themes)}`,
    antagonist: `Believes they are the hero; their conviction becomes their undoing`,
    mentor: `Guides with hard-won wisdom, then steps aside so the hero can rise`,
    ally: `Provides loyalty and unexpected skill when hope seems lost`,
    "love-interest": `Challenges the hero emotionally, forcing vulnerability and growth`,
    "comic-relief": `Uses humor as armor; reveals deep courage in the final act`,
    "threshold-guardian": `Tests the hero's worthiness before allowing passage`,
    shapeshifter: `Loyalty is fluid — motives remain ambiguous until the end`,
    herald: `Delivers the call that shatters the ordinary world`,
    shadow: `Mirrors the hero's darkest potential`,
    supporting: `Grounds the story in human texture and quiet truth`,
  };

  const backstories = [
    `Grew up on the edges of ${pick(bank.settings)}, shaped by ${pick(bank.conflicts)}.`,
    `Once lost everything to ${pick(bank.conflicts)}; now seeks ${pick(bank.themes)}.`,
    `Carries a secret tied to ${pick(bank.settings)} that could rewrite the past.`,
    `Trained for a purpose they no longer believe in, searching for a new path.`,
  ];

  const t = now();
  return {
    id: uid("char"),
    name,
    role,
    appearance,
    personality,
    backstory: backstories[Math.floor(rng() * backstories.length)],
    voiceStyle: VOICE_STYLES[Math.floor(rng() * VOICE_STYLES.length)],
    speechPattern: SPEECH_PATTERNS[Math.floor(rng() * SPEECH_PATTERNS.length)],
    arc: arcs[role],
    relationships: [],
    consistencyPrompt: buildConsistencyPrompt(name, appearance, role),
    visualSeed: seed,
    emotionOverrides: {},
    createdAt: t,
    updatedAt: t,
  };
}

export function rebuildCharacterPrompt(c: Character): string {
  return buildConsistencyPrompt(c.name, c.appearance, c.role);
}

function sceneNarration(
  beatName: string,
  type: SceneType,
  title: string,
  genre: string,
  characters: Character[],
  order: number,
  total: number
): { narration: string; dialogue: Scene["dialogue"]; action: string; setting: string; mood: string } {
  const bank = GENRE_BANK[genre] || GENRE_BANK.adventure;
  const setting = pick(bank.settings);
  const protag = characters.find((c) => c.role === "protagonist") || characters[0];
  const antag = characters.find((c) => c.role === "antagonist");
  const ally = characters.find((c) => c.role === "ally" || c.role === "mentor");
  const love = characters.find((c) => c.role === "love-interest");

  const moods: Record<SceneType, string> = {
    establishing: "wonder",
    dialogue: "intimate",
    action: "action",
    emotional: "sad",
    montage: "hopeful",
    climax: "epic",
    resolution: "hopeful",
    flashback: "melancholy",
    dream: "wonder",
    chase: "tense",
    revelation: "mysterious",
    transition: "default",
  };
  const mood = moods[type] || "default";

  const narrations: Record<SceneType, string[]> = {
    establishing: [
      `The world of "${title}" unfolds across ${setting}. Light cuts through the haze as destiny quietly takes aim.`,
      `At ${setting}, silence holds its breath. Something irreversible is about to begin.`,
    ],
    dialogue: [
      `${protag?.name || "The hero"} weighs every word. In ${setting}, truth is a dangerous currency.`,
      `Voices low, stakes high. What is said here will echo through every scene that follows.`,
    ],
    action: [
      `Motion explodes across ${setting}. ${protag?.name || "Our hero"} moves like the future depends on it — because it does.`,
      `Chaos reigns. Every second is a negotiation with survival.`,
    ],
    emotional: [
      `${protag?.name || "They"} stand alone with the weight of every choice. The quiet is louder than any battle.`,
      `Grief and hope share the same breath. Nothing will feel the same after this moment.`,
    ],
    montage: [
      `Time compresses. Training. Planning. Failing. Rising. The path to the inevitable narrows.`,
      `Fragments of preparation flash past — each one a brick in the wall of resolve.`,
    ],
    climax: [
      `Everything collides at ${setting}. ${protag?.name || "The hero"} faces the cost of ${pick(bank.themes)}.`,
      `No more running. No more doubt. Only the choice that defines a life.`,
    ],
    resolution: [
      `The dust settles over ${setting}. What remains is not victory — it is meaning.`,
      `A new quiet arrives. Scarred, wiser, and irrevocably changed.`,
    ],
    flashback: [
      `Memory pulls back the curtain. Before all of this, there was a simpler wound.`,
      `The past refuses to stay buried. It walks into the present wearing familiar faces.`,
    ],
    dream: [
      `Reality loosens its grip. Symbols bloom. Warnings dress themselves as beauty.`,
      `In the dream-logic of ${setting}, truth speaks in riddles only the heart understands.`,
    ],
    chase: [
      `Pursuit. Breath burning. ${setting} becomes a labyrinth of near-misses and closing doors.`,
      `They run because stopping means the story ends too soon.`,
    ],
    revelation: [
      `The secret surfaces. Everything ${protag?.name || "they"} believed rearranges itself in a single heartbeat.`,
      `A truth long buried steps into the light — and nothing can be unseen.`,
    ],
    transition: [
      `The world shifts. ${setting} gives way to whatever comes next.`,
      `A breath between chapters. The story turns its page.`,
    ],
  };

  const actions: Record<SceneType, string[]> = {
    establishing: [
      "Slow push-in across the landscape as atmospheric particles drift through god rays",
      "Crane shot descending from sky to ground level, revealing our world",
    ],
    dialogue: [
      `${protag?.name} turns, eyes sharp, delivering a line that changes the power dynamic`,
      "Two characters face each other; unspoken history fills the frame between them",
    ],
    action: [
      `${protag?.name} sprints through obstacles, camera tracking tightly with kinetic energy`,
      "Explosive physical confrontation with dynamic camera whip-pans",
    ],
    emotional: [
      "Extreme close-up on trembling eyes; a single tear catches the light",
      `${protag?.name} sinks to their knees as the weight of loss settles`,
    ],
    montage: [
      "Rapid cuts of preparation, each shot advancing the emotional arc",
      "Time-lapse of transformation — skill, resolve, and relationships evolving",
    ],
    climax: [
      `${protag?.name} confronts ${antag?.name || "the threat"} in a final, decisive clash`,
      "All storylines collide; the hero makes the defining sacrifice or stand",
    ],
    resolution: [
      "Wide shot of survivors; soft light, open sky, a quiet look of hard-won peace",
      `${protag?.name} walks forward into a changed world, camera holding on their back`,
    ],
    flashback: [
      "Desaturated memory sequence; younger faces, softer edges, haunting score",
      "Match-cut from present object to its past origin",
    ],
    dream: [
      "Surreal physics — gravity bends, colors bloom unnaturally, faces morph",
      "Symbolic imagery cascading: doors, water, falling, light at the end",
    ],
    chase: [
      "Handheld pursuit through tight corridors; breath and footsteps dominate",
      "Vehicle or foot chase with near collisions and desperate improvisation",
    ],
    revelation: [
      "Slow push to face as realization dawns; world sound drops out",
      "Object or document revealed; reverse shot on stunned reaction",
    ],
    transition: [
      "Match dissolve from one environment into the next",
      "Camera whips or fades as geography and time shift",
    ],
  };

  const dialogue: Scene["dialogue"] = [];
  const lineBank: Record<string, string[]> = {
    protag: [
      "If we stop now, none of this meant anything.",
      "I didn't come this far to become what I hate.",
      "Tell me the truth. All of it.",
      "There's still a way. There has to be.",
      "I know what I have to do.",
    ],
    antag: [
      "You still think this is about you?",
      "Every hero needs a mirror. Look closer.",
      "I offered you peace. You chose war.",
      "History will not remember your name.",
    ],
    ally: [
      "I've got your back. Always.",
      "We planned for this. Trust the plan.",
      "You're not alone in this.",
      "Then we do it together.",
    ],
    love: [
      "Don't you dare say goodbye.",
      "I see you. The real you.",
      "Come back to me.",
      "Whatever happens — I choose us.",
    ],
  };

  if (type === "dialogue" || type === "emotional" || type === "revelation" || type === "climax") {
    if (protag) {
      dialogue.push({
        characterId: protag.id,
        line: pick(lineBank.protag),
        emotion: type === "climax" ? "determined" : type === "emotional" ? "sad" : "neutral",
      });
    }
    if (antag && (type === "climax" || type === "revelation" || order > total * 0.4)) {
      dialogue.push({
        characterId: antag.id,
        line: pick(lineBank.antag),
        emotion: type === "climax" ? "fierce" : "angry",
      });
    } else if (ally && type === "dialogue") {
      dialogue.push({
        characterId: ally.id,
        line: pick(lineBank.ally),
        emotion: "hopeful",
      });
    } else if (love && (type === "emotional" || type === "dialogue")) {
      dialogue.push({
        characterId: love.id,
        line: pick(lineBank.love),
        emotion: "loving",
      });
    }
  }

  return {
    narration: pick(narrations[type] || narrations.establishing),
    dialogue,
    action: pick(actions[type] || actions.establishing),
    setting,
    mood,
    // beatName used by caller
  };
}

function buildVisualPrompt(
  scene: Omit<Scene, "visualPrompt" | "id" | "status">,
  characters: Character[],
  style: StoryStyle,
  globalStyle: string
): string {
  const charParts = scene.characterIds
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => c!.consistencyPrompt)
    .join(" | ");

  return [
    STYLE_PROMPTS[style],
    globalStyle,
    `Scene: ${scene.title}. Setting: ${scene.setting}, ${scene.timeOfDay}, weather: ${scene.weather}.`,
    `Camera: ${scene.cameraAngle}. Lighting: ${scene.lighting}. Mood: ${scene.mood}.`,
    `Action: ${scene.action}.`,
    charParts ? `CHARACTERS IN FRAME (identity locked): ${charParts}` : "No primary characters in frame.",
    `Color grade: ${scene.colorGrade}.`,
    "Living, breathing cinematic motion — subtle hair movement, breathing, eye blinks, environmental particles, filmic motion blur.",
    "Ultra photorealistic OR premium stylized according to style, 8K detail, masterpiece composition, no text overlays, no watermarks, no still-photo look.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function generateScenes(
  title: string,
  genre: string,
  structure: NarrativeStructure,
  style: StoryStyle,
  characters: Character[],
  targetDuration: number,
  globalStyle: string,
  sceneCount?: number
): Scene[] {
  const beats = STRUCTURE_BEATS[structure];
  const count = sceneCount || beats.length;
  const selected = beats.slice(0, Math.min(count, beats.length));
  // If need more scenes, cycle types
  while (selected.length < count) {
    const b = beats[selected.length % beats.length];
    selected.push({ ...b, name: `${b.name} (cont.)` });
  }

  const totalWeight = selected.reduce((s, b) => s + b.weight, 0);
  const times = ["dawn", "morning", "midday", "golden hour", "dusk", "night", "blue hour"];
  const weather = ["clear", "light clouds", "overcast", "light rain", "fog", "storm building", "snow flurry"];

  return selected.map((beat, i) => {
    const durationSec = Math.max(3, Math.round((beat.weight / totalWeight) * targetDuration));
    const base = sceneNarration(beat.name, beat.type, title, genre, characters, i, selected.length);
    const moodKey = base.mood;
    const lighting = pick(LIGHTING_BY_MOOD[moodKey] || LIGHTING_BY_MOOD.default);
    const camera = pick(CAMERA_BY_TYPE[beat.type]);

    // Assign characters present
    const charIds: string[] = [];
    const protag = characters.find((c) => c.role === "protagonist");
    if (protag && beat.type !== "establishing") charIds.push(protag.id);
    if (beat.type === "climax" || beat.type === "action" || beat.type === "chase") {
      const antag = characters.find((c) => c.role === "antagonist");
      if (antag) charIds.push(antag.id);
    }
    if (beat.type === "dialogue" || beat.type === "emotional") {
      const other = characters.find((c) => c.role !== "protagonist" && !charIds.includes(c.id));
      if (other) charIds.push(other.id);
    }
    if (beat.type === "establishing" && i === 0 && protag) charIds.push(protag.id);

    const partial = {
      order: i,
      title: beat.name,
      type: beat.type,
      narration: base.narration,
      dialogue: base.dialogue,
      characterIds: charIds,
      setting: base.setting,
      timeOfDay: times[Math.min(i, times.length - 1)],
      weather: weather[i % weather.length],
      cameraAngle: camera,
      lighting,
      mood: base.mood,
      action: base.action,
      durationSec,
      transition: i === 0 ? ("fade" as const) : pick(TRANSITIONS),
      musicCue: pick(MUSIC_CUES),
      soundEffects: pickN(SFX_POOL, 1 + (i % 2)),
      colorGrade: pick(COLOR_GRADES),
    };

    const visualPrompt = buildVisualPrompt(partial, characters, style, globalStyle);

    return {
      id: uid("scene"),
      ...partial,
      visualPrompt,
      status: "ready" as const,
    };
  });
}

export interface CreateStoryOptions {
  title: string;
  style?: StoryStyle;
  structure?: NarrativeStructure;
  aspectRatio?: AspectRatio;
  targetLength?: VideoLength;
  language?: string;
  genreHint?: string;
  customLogline?: string;
  customSynopsis?: string;
  characterCount?: number;
  globalStylePrompt?: string;
  userId?: string;
  targetPlatform?: import("./types").Platform;
}

export function createStoryFromTitle(opts: CreateStoryOptions): StoryProject {
  const title = opts.title.trim() || "Untitled Story";
  const genre = detectGenre(title, opts.genreHint);
  const style = opts.style || "cinematic";
  const structure = opts.structure || "three-act";
  const targetLength = opts.targetLength || "short";
  const lengthCfg = LENGTH_CONFIG[targetLength];
  const aspectRatio = opts.aspectRatio || "9:16";
  const language = opts.language || "en-US";

  const expanded = expandTitle(title, genre);
  const logline = opts.customLogline || expanded.logline;
  const synopsis = opts.customSynopsis || expanded.synopsis;

  const roles: CharacterRole[] =
    targetLength === "short"
      ? ["protagonist", "antagonist", "ally"]
      : targetLength === "medium"
        ? ["protagonist", "antagonist", "ally", "love-interest"]
        : ["protagonist", "antagonist", "mentor", "ally", "love-interest", "shadow"];

  const charCount = opts.characterCount || roles.length;
  const characters: Character[] = [];
  for (let i = 0; i < charCount; i++) {
    const role = roles[i % roles.length];
    characters.push(generateCharacter(role, title, i, genre));
  }

  // Wire relationships
  if (characters.length >= 2) {
    characters[0].relationships.push({ characterId: characters[1].id, relation: "opposed by" });
    characters[1].relationships.push({ characterId: characters[0].id, relation: "rivals" });
  }
  if (characters.length >= 3) {
    characters[0].relationships.push({ characterId: characters[2].id, relation: "allied with" });
    characters[2].relationships.push({ characterId: characters[0].id, relation: "supports" });
  }

  const globalStyle =
    opts.globalStylePrompt ||
    `${STYLE_PROMPTS[style]}. Consistent cinematic universe for "${title}". Genre: ${genre}. Tone: ${expanded.tone}.`;

  const scenes = generateScenes(
    title,
    genre,
    structure,
    style,
    characters,
    lengthCfg.duration,
    globalStyle,
    lengthCfg.scenes
  );

  const t = now();
  const id = uid("proj");

  return {
    id,
    userId: opts.userId || "local",
    title,
    logline,
    synopsis,
    genre: [genre],
    style,
    structure,
    aspectRatio,
    targetLength,
    targetDurationSec: lengthCfg.duration,
    language,
    tone: expanded.tone,
    themes: expanded.themes,
    characters,
    scenes,
    globalStylePrompt: globalStyle,
    soundtrackMood: expanded.tone,
    colorPalette: pickN(
      ["#0b0c10", "#1f2833", "#c5c6c7", "#66fcf1", "#45a29e", "#e94560", "#f5f5f5", "#c9a227"],
      5
    ),
    status: "scripted",
    archived: false,
    version: 1,
    targetPlatform: opts.targetPlatform || "youtube-shorts",
    createdAt: t,
    updatedAt: t,
    metadata: {
      masterTitle: title,
      masterDescription: logline,
      masterTags: [genre, style, ...expanded.themes],
      platforms: [],
      thumbnailVariants: [],
    },
    renderProgress: 0,
    voice: {
      enabled: true,
      language: language.includes("-") ? language : `${language}-${language.toUpperCase()}`,
      voiceURI: "",
      persona: "narrator-warm",
      rate: 0.95,
      pitch: 1,
      volume: 1,
      pauseBetweenSentencesMs: 280,
      emphasis: 0.45,
      stabilizeRate: true,
      autoMatchCharacter: true,
    },
    subtitles: {
      language: language.slice(0, 2),
      languageLabel: "English",
      templateId: "netflix",
      emojisEnabled: true,
      cues: [],
      fontScale: 1,
      position: "bottom",
      maxCharsPerLine: 42,
    },
    subtitleTracks: [],
    voiceLines: [],
    platformOptimizations: [],
  };
}

export function regenerateScenePrompt(scene: Scene, characters: Character[], style: StoryStyle, globalStyle: string): string {
  return buildVisualPrompt(scene, characters, style, globalStyle);
}

export function getStylePrompt(style: StoryStyle): string {
  return STYLE_PROMPTS[style];
}

export function getLengthConfig(len: VideoLength) {
  return LENGTH_CONFIG[len];
}

export const STORY_STYLES: StoryStyle[] = [
  "cinematic", "documentary", "anime", "noir", "fairy-tale", "sci-fi", "horror",
  "comedy", "drama", "adventure", "mystery", "romance", "thriller", "epic", "minimalist",
];

export const NARRATIVE_STRUCTURES: NarrativeStructure[] = [
  "three-act", "heros-journey", "kishotenketsu", "in-medias-res",
  "nonlinear", "frame-story", "episodic", "save-the-cat",
];

export const SCENE_TYPES: SceneType[] = [
  "establishing", "dialogue", "action", "emotional", "montage", "climax",
  "resolution", "flashback", "dream", "chase", "revelation", "transition",
];

export const CHARACTER_ROLES: CharacterRole[] = [
  "protagonist", "antagonist", "mentor", "ally", "love-interest",
  "comic-relief", "threshold-guardian", "shapeshifter", "herald", "shadow", "supporting",
];

export const EMOTIONS: Emotion[] = [
  "neutral", "happy", "sad", "angry", "fearful", "surprised", "determined",
  "loving", "confused", "excited", "melancholy", "fierce", "hopeful", "desperate", "triumphant",
];

export { STYLE_PROMPTS, LENGTH_CONFIG, GENRE_BANK };
