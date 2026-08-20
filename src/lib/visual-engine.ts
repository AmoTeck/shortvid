import {
  Character,
  Scene,
  StoryStyle,
  AspectRatio,
  Emotion,
  CameraAngle,
  LightingMood,
  SubtitleTrack,
  VoiceSettings,
  VoiceLine,
} from "./types";
import { seededRandom, hashString, clamp } from "./utils";
import { drawSubtitle } from "./subtitle-engine";
import {
  createSoundtrackBuffer,
  scheduleLiveVO,
  stopSpeaking,
  fetchTtsBlob,
  blobToAudioBuffer,
} from "./voice-engine";

export interface RenderDims {
  width: number;
  height: number;
}

export function aspectToDims(aspect: AspectRatio, quality: "draft" | "standard" | "cinematic" | "imax" = "standard"): RenderDims {
  const base =
    quality === "draft" ? 480 : quality === "standard" ? 720 : quality === "cinematic" ? 1080 : 1440;
  switch (aspect) {
    case "9:16":
      return { width: Math.round((base * 9) / 16), height: base };
    case "16:9":
      return { width: base, height: Math.round((base * 9) / 16) };
    case "1:1":
      return { width: base, height: base };
    case "4:5":
      return { width: Math.round((base * 4) / 5), height: base };
    default:
      return { width: Math.round((base * 9) / 16), height: base };
  }
}

/* ── Color utilities ── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgb(r: number, g: number, b: number, a = 1) {
  return `rgba(${clamp(r | 0, 0, 255)},${clamp(g | 0, 0, 255)},${clamp(b | 0, 0, 255)},${a})`;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

/* ── Style palettes ── */

const STYLE_SKY: Record<StoryStyle, [[number, number, number], [number, number, number]]> = {
  cinematic: [[15, 20, 45], [220, 140, 90]],
  documentary: [[90, 120, 150], [200, 210, 220]],
  anime: [[40, 60, 140], [255, 140, 180]],
  noir: [[5, 5, 10], [40, 40, 50]],
  "fairy-tale": [[60, 40, 100], [255, 200, 140]],
  "sci-fi": [[5, 10, 30], [0, 200, 220]],
  horror: [[10, 5, 15], [60, 20, 30]],
  comedy: [[80, 160, 220], [255, 220, 100]],
  drama: [[40, 50, 70], [180, 140, 120]],
  adventure: [[30, 80, 140], [255, 180, 80]],
  mystery: [[20, 25, 50], [80, 90, 120]],
  romance: [[50, 30, 60], [255, 160, 140]],
  thriller: [[10, 15, 25], [180, 40, 60]],
  epic: [[20, 30, 60], [255, 160, 60]],
  minimalist: [[240, 240, 245], [200, 200, 210]],
};

const LIGHTING_TINT: Record<LightingMood, [number, number, number, number]> = {
  "golden-hour": [255, 180, 80, 0.25],
  "blue-hour": [80, 120, 220, 0.3],
  noir: [0, 0, 0, 0.45],
  "high-key": [255, 255, 255, 0.15],
  "low-key": [0, 0, 20, 0.4],
  neon: [255, 0, 180, 0.2],
  candlelight: [255, 140, 40, 0.3],
  "harsh-sun": [255, 240, 200, 0.2],
  overcast: [160, 170, 180, 0.25],
  moonlight: [100, 130, 200, 0.3],
  firelight: [255, 100, 30, 0.28],
  storm: [40, 50, 70, 0.35],
};

/* ── Character visual identity from seed ── */

interface CharVisual {
  skin: [number, number, number];
  hair: [number, number, number];
  eyes: [number, number, number];
  clothes: [number, number, number];
  accent: [number, number, number];
  bodyScale: number;
  hairStyle: number;
  faceShape: number;
}

function charVisual(c: Character): CharVisual {
  const rng = seededRandom(c.visualSeed || hashString(c.id));
  const skinTones: [number, number, number][] = [
    [255, 224, 196], [241, 194, 155], [224, 172, 125], [198, 134, 90],
    [141, 85, 50], [90, 55, 35], [60, 36, 25], [255, 235, 210],
  ];
  const hairs: [number, number, number][] = [
    [20, 15, 10], [60, 40, 25], [180, 140, 60], [140, 50, 30],
    [200, 200, 210], [30, 30, 50], [80, 50, 30], [10, 10, 10],
  ];
  const eyes: [number, number, number][] = [
    [70, 100, 140], [50, 120, 70], [160, 110, 40], [80, 50, 30],
    [100, 160, 200], [100, 80, 50], [120, 80, 140],
  ];
  const clothes: [number, number, number][] = [
    [30, 40, 70], [120, 30, 50], [20, 60, 50], [40, 40, 45],
    [180, 160, 120], [70, 40, 100], [200, 80, 40], [15, 15, 20],
  ];
  if (c.appearance.colorPalette?.length) {
    const p = c.appearance.colorPalette.map(hexToRgb);
    return {
      skin: skinTones[Math.floor(rng() * skinTones.length)],
      hair: hairs[Math.floor(rng() * hairs.length)],
      eyes: eyes[Math.floor(rng() * eyes.length)],
      clothes: p[0] || clothes[0],
      accent: p[1] || clothes[1],
      bodyScale: 0.9 + rng() * 0.25,
      hairStyle: Math.floor(rng() * 5),
      faceShape: rng(),
    };
  }
  return {
    skin: skinTones[Math.floor(rng() * skinTones.length)],
    hair: hairs[Math.floor(rng() * hairs.length)],
    eyes: eyes[Math.floor(rng() * eyes.length)],
    clothes: clothes[Math.floor(rng() * clothes.length)],
    accent: clothes[Math.floor(rng() * clothes.length)],
    bodyScale: 0.9 + rng() * 0.25,
    hairStyle: Math.floor(rng() * 5),
    faceShape: rng(),
  };
}

/* ── Drawing primitives ── */

function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: StoryStyle,
  lighting: LightingMood,
  t: number
) {
  const [c1, c2] = STYLE_SKY[style] || STYLE_SKY.cinematic;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.4);
  const mid = lerpColor(c1, c2, 0.45 + pulse * 0.1);
  grad.addColorStop(0, rgb(c1[0], c1[1], c1[2]));
  grad.addColorStop(0.55, rgb(mid[0], mid[1], mid[2]));
  grad.addColorStop(1, rgb(c2[0] * 0.5, c2[1] * 0.45, c2[2] * 0.4));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Sun / moon
  const isNight = lighting === "moonlight" || lighting === "noir" || lighting === "neon" || lighting === "low-key";
  const cx = w * (0.7 + 0.05 * Math.sin(t * 0.1));
  const cy = h * (0.18 + 0.02 * Math.cos(t * 0.15));
  const radius = w * (isNight ? 0.06 : 0.09);
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3);
  if (isNight) {
    glow.addColorStop(0, rgb(220, 230, 255, 0.9));
    glow.addColorStop(0.3, rgb(180, 200, 255, 0.35));
    glow.addColorStop(1, rgb(100, 120, 200, 0));
  } else {
    glow.addColorStop(0, rgb(255, 250, 200, 0.95));
    glow.addColorStop(0.4, rgb(255, 180, 80, 0.4));
    glow.addColorStop(1, rgb(255, 100, 50, 0));
  }
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 3, 0, Math.PI * 2);
  ctx.fill();

  // Stars for night
  if (isNight) {
    const rng = seededRandom(42);
    ctx.fillStyle = rgb(255, 255, 255, 0.7);
    for (let i = 0; i < 60; i++) {
      const sx = rng() * w;
      const sy = rng() * h * 0.5;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
      ctx.globalAlpha = tw;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  }
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: StoryStyle,
  seed: number,
  t: number
) {
  const rng = seededRandom(seed);
  const horizon = h * 0.58;

  // Far mountains
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, horizon);
  let x = 0;
  while (x < w) {
    const peak = horizon - h * (0.08 + rng() * 0.18);
    const mid = x + 20 + rng() * 60;
    ctx.lineTo(mid, peak);
    x = mid + 20 + rng() * 40;
    ctx.lineTo(x, horizon - h * (0.02 + rng() * 0.06));
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  const mg = ctx.createLinearGradient(0, horizon - h * 0.25, 0, h);
  if (style === "sci-fi") {
    mg.addColorStop(0, rgb(20, 40, 70));
    mg.addColorStop(1, rgb(10, 15, 30));
  } else if (style === "horror") {
    mg.addColorStop(0, rgb(25, 15, 25));
    mg.addColorStop(1, rgb(10, 5, 10));
  } else {
    mg.addColorStop(0, rgb(40, 55, 50));
    mg.addColorStop(1, rgb(20, 30, 28));
  }
  ctx.fillStyle = mg;
  ctx.fill();

  // Mid ground hills
  ctx.beginPath();
  ctx.moveTo(0, h);
  const h2 = horizon + h * 0.08;
  ctx.lineTo(0, h2);
  x = 0;
  const rng2 = seededRandom(seed + 7);
  while (x < w + 50) {
    const peak = h2 - h * (0.03 + rng2() * 0.08) + Math.sin(t * 0.3 + x * 0.01) * 3;
    x += 30 + rng2() * 50;
    ctx.lineTo(x, peak);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = style === "anime" ? rgb(50, 100, 70) : rgb(30, 50, 40);
  ctx.fill();

  // Ground
  const gg = ctx.createLinearGradient(0, horizon + h * 0.1, 0, h);
  gg.addColorStop(0, rgb(35, 45, 35));
  gg.addColorStop(1, rgb(15, 18, 15));
  ctx.fillStyle = gg;
  ctx.fillRect(0, horizon + h * 0.12, w, h);

  // Ground texture lines (parallax)
  ctx.strokeStyle = rgb(255, 255, 255, 0.04);
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const y = horizon + h * 0.15 + i * (h * 0.04);
    const offset = ((t * (8 + i * 3)) % 40) - 20;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let px = 0; px < w; px += 20) {
      ctx.lineTo(px, y + Math.sin(px * 0.05 + offset) * 2);
    }
    ctx.stroke();
  }
}

function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lighting: LightingMood,
  weather: string,
  t: number,
  seed: number
) {
  const tint = LIGHTING_TINT[lighting] || LIGHTING_TINT["golden-hour"];
  ctx.fillStyle = rgb(tint[0], tint[1], tint[2], tint[3] * 0.6);
  ctx.fillRect(0, 0, w, h);

  // God rays
  if (lighting === "golden-hour" || lighting === "firelight") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i++) {
      const angle = -0.4 + i * 0.18 + Math.sin(t * 0.2 + i) * 0.02;
      ctx.translate(w * 0.7, h * 0.1);
      ctx.rotate(angle);
      const rg = ctx.createLinearGradient(0, 0, 0, h);
      rg.addColorStop(0, rgb(255, 200, 100, 0.12));
      rg.addColorStop(1, rgb(255, 150, 50, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(-15 - i * 5, 0, 30 + i * 8, h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
  }

  // Neon accents
  if (lighting === "neon") {
    const ng = ctx.createLinearGradient(0, h * 0.5, w, h);
    ng.addColorStop(0, rgb(255, 0, 150, 0.15));
    ng.addColorStop(0.5, rgb(0, 255, 220, 0.1));
    ng.addColorStop(1, rgb(120, 0, 255, 0.15));
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, w, h);
  }

  // Particles / weather
  const rng = seededRandom(seed);
  const isRain = weather.includes("rain") || weather.includes("storm");
  const isFog = weather.includes("fog") || weather.includes("overcast");
  const isSnow = weather.includes("snow");

  if (isRain) {
    ctx.strokeStyle = rgb(180, 200, 255, 0.35);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 80; i++) {
      const px = (rng() * w + t * 120 + i * 17) % (w + 20) - 10;
      const py = (rng() * h + t * 400 + i * 31) % (h + 40) - 20;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 3, py + 14);
      ctx.stroke();
    }
  } else if (isSnow) {
    ctx.fillStyle = rgb(255, 255, 255, 0.7);
    for (let i = 0; i < 50; i++) {
      const px = (rng() * w + Math.sin(t + i) * 20 + t * 10) % w;
      const py = (rng() * h + t * 40 + i * 13) % h;
      ctx.beginPath();
      ctx.arc(px, py, 1 + rng() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Floating dust / embers
    for (let i = 0; i < 30; i++) {
      const px = (rng() * w + Math.sin(t * 0.5 + i) * 30) % w;
      const py = (rng() * h + Math.cos(t * 0.3 + i * 0.7) * 20 + t * 8) % h;
      const a = 0.15 + 0.25 * Math.abs(Math.sin(t + i));
      ctx.fillStyle = lighting === "firelight" ? rgb(255, 150, 50, a) : rgb(255, 255, 240, a);
      ctx.beginPath();
      ctx.arc(px, py, 1 + rng() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (isFog) {
    for (let i = 0; i < 4; i++) {
      const fy = h * 0.45 + i * h * 0.1;
      const fg = ctx.createLinearGradient(0, fy, 0, fy + h * 0.15);
      fg.addColorStop(0, rgb(200, 200, 210, 0));
      fg.addColorStop(0.5, rgb(200, 200, 210, 0.12 + i * 0.03));
      fg.addColorStop(1, rgb(200, 200, 210, 0));
      ctx.fillStyle = fg;
      const shift = Math.sin(t * 0.2 + i) * 40;
      ctx.fillRect(shift - 40, fy, w + 80, h * 0.15);
    }
  }

  // Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
  vig.addColorStop(0, rgb(0, 0, 0, 0));
  vig.addColorStop(1, rgb(0, 0, 0, 0.55));
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function emotionOffset(emotion: Emotion): { brow: number; mouth: number; eyeOpen: number } {
  switch (emotion) {
    case "happy":
    case "excited":
    case "triumphant":
      return { brow: -2, mouth: 1, eyeOpen: 0.9 };
    case "sad":
    case "melancholy":
    case "desperate":
      return { brow: 3, mouth: -1, eyeOpen: 0.75 };
    case "angry":
    case "fierce":
      return { brow: -4, mouth: -0.5, eyeOpen: 1.1 };
    case "fearful":
      return { brow: 4, mouth: 0.3, eyeOpen: 1.3 };
    case "surprised":
      return { brow: -5, mouth: 0.8, eyeOpen: 1.4 };
    case "determined":
    case "hopeful":
      return { brow: -1, mouth: 0.2, eyeOpen: 1.0 };
    case "loving":
      return { brow: 1, mouth: 0.7, eyeOpen: 0.85 };
    default:
      return { brow: 0, mouth: 0, eyeOpen: 1 };
  }
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  c: Character,
  x: number,
  y: number,
  scale: number,
  t: number,
  emotion: Emotion,
  facing: number // -1 left, 1 right
) {
  const v = charVisual(c);
  const s = scale * v.bodyScale;
  const breathe = Math.sin(t * 2.2 + c.visualSeed * 0.01) * 2 * s;
  const sway = Math.sin(t * 1.1 + c.visualSeed * 0.02) * 3 * s;
  const blink = Math.sin(t * 0.7 + c.visualSeed) > 0.97 ? 0.15 : 1;
  const emo = emotionOffset(emotion);

  ctx.save();
  ctx.translate(x + sway, y + breathe);
  ctx.scale(facing, 1);

  // Shadow
  ctx.fillStyle = rgb(0, 0, 0, 0.3);
  ctx.beginPath();
  ctx.ellipse(0, 0, 28 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = rgb(v.clothes[0] * 0.7, v.clothes[1] * 0.7, v.clothes[2] * 0.7);
  ctx.lineWidth = 10 * s;
  ctx.lineCap = "round";
  const legSwing = Math.sin(t * 2) * 4 * s;
  ctx.beginPath();
  ctx.moveTo(-8 * s, -20 * s);
  ctx.lineTo(-10 * s + legSwing, 0);
  ctx.moveTo(8 * s, -20 * s);
  ctx.lineTo(10 * s - legSwing, 0);
  ctx.stroke();

  // Body / torso
  const bodyGrad = ctx.createLinearGradient(0, -90 * s, 0, -20 * s);
  bodyGrad.addColorStop(0, rgb(v.clothes[0], v.clothes[1], v.clothes[2]));
  bodyGrad.addColorStop(1, rgb(v.clothes[0] * 0.6, v.clothes[1] * 0.6, v.clothes[2] * 0.6));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-22 * s, -25 * s);
  ctx.quadraticCurveTo(-28 * s, -55 * s, -18 * s, -85 * s);
  ctx.lineTo(18 * s, -85 * s);
  ctx.quadraticCurveTo(28 * s, -55 * s, 22 * s, -25 * s);
  ctx.closePath();
  ctx.fill();

  // Accent sash / collar
  ctx.fillStyle = rgb(v.accent[0], v.accent[1], v.accent[2], 0.85);
  ctx.fillRect(-18 * s, -85 * s, 36 * s, 8 * s);

  // Arms
  ctx.strokeStyle = rgb(v.clothes[0], v.clothes[1], v.clothes[2]);
  ctx.lineWidth = 8 * s;
  const armSwing = Math.sin(t * 2 + 1) * 6 * s;
  ctx.beginPath();
  ctx.moveTo(-20 * s, -75 * s);
  ctx.quadraticCurveTo(-35 * s, -50 * s, -25 * s + armSwing, -30 * s);
  ctx.moveTo(20 * s, -75 * s);
  ctx.quadraticCurveTo(35 * s, -50 * s, 25 * s - armSwing, -30 * s);
  ctx.stroke();

  // Hands
  ctx.fillStyle = rgb(v.skin[0], v.skin[1], v.skin[2]);
  ctx.beginPath();
  ctx.arc(-25 * s + armSwing, -28 * s, 5 * s, 0, Math.PI * 2);
  ctx.arc(25 * s - armSwing, -28 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = rgb(v.skin[0] * 0.95, v.skin[1] * 0.95, v.skin[2] * 0.95);
  ctx.fillRect(-7 * s, -95 * s, 14 * s, 12 * s);

  // Head
  const headY = -115 * s;
  const headRx = (16 + v.faceShape * 4) * s;
  const headRy = (20 + (1 - v.faceShape) * 3) * s;
  const headGrad = ctx.createRadialGradient(-4 * s, headY - 5 * s, 2 * s, 0, headY, headRx);
  headGrad.addColorStop(0, rgb(v.skin[0] + 15, v.skin[1] + 10, v.skin[2] + 8));
  headGrad.addColorStop(1, rgb(v.skin[0] * 0.85, v.skin[1] * 0.85, v.skin[2] * 0.85));
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, headY, headRx, headRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = rgb(v.hair[0], v.hair[1], v.hair[2]);
  ctx.beginPath();
  if (v.hairStyle === 0) {
    // Long waves
    ctx.ellipse(0, headY - 8 * s, headRx + 4 * s, headRy + 6 * s, 0, Math.PI, 0);
    ctx.quadraticCurveTo(headRx + 10 * s, headY + 30 * s, headRx + 2 * s, headY + 40 * s);
    ctx.lineTo(-headRx - 2 * s, headY + 40 * s);
    ctx.quadraticCurveTo(-headRx - 10 * s, headY + 30 * s, -headRx - 4 * s, headY);
  } else if (v.hairStyle === 1) {
    // Short
    ctx.ellipse(0, headY - 4 * s, headRx + 2 * s, headRy * 0.7, 0, Math.PI * 1.1, -0.1, true);
  } else if (v.hairStyle === 2) {
    // Bun
    ctx.ellipse(0, headY - 6 * s, headRx + 3 * s, headRy * 0.65, 0, Math.PI, 0);
    ctx.ellipse(0, headY - headRy - 6 * s, 8 * s, 8 * s, 0, 0, Math.PI * 2);
  } else if (v.hairStyle === 3) {
    // Spiky
    ctx.moveTo(-headRx, headY);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const r = headRx + (i % 2 === 0 ? 12 * s : 2 * s);
      ctx.lineTo(Math.cos(a) * r, headY + Math.sin(a) * headRy * 0.3 - 8 * s);
    }
  } else {
    // Side sweep
    ctx.ellipse(4 * s, headY - 6 * s, headRx + 6 * s, headRy * 0.7, 0.3, Math.PI * 0.9, -0.2, true);
  }
  ctx.fill();

  // Eyes
  const eyeY = headY - 2 * s + emo.brow * 0.3 * s;
  const eyeOpen = emo.eyeOpen * blink;
  const eyeW = 4.5 * s;
  const eyeH = 3.2 * s * eyeOpen;

  // Eye whites
  ctx.fillStyle = rgb(250, 248, 245);
  ctx.beginPath();
  ctx.ellipse(-6 * s, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
  ctx.ellipse(6 * s, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iris
  if (eyeOpen > 0.2) {
    ctx.fillStyle = rgb(v.eyes[0], v.eyes[1], v.eyes[2]);
    const lookX = Math.sin(t * 0.5) * 1.2 * s;
    ctx.beginPath();
    ctx.ellipse(-6 * s + lookX, eyeY, 2.2 * s, 2.2 * s * eyeOpen, 0, 0, Math.PI * 2);
    ctx.ellipse(6 * s + lookX, eyeY, 2.2 * s, 2.2 * s * eyeOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = rgb(10, 10, 15);
    ctx.beginPath();
    ctx.ellipse(-6 * s + lookX, eyeY, 1.1 * s, 1.1 * s * eyeOpen, 0, 0, Math.PI * 2);
    ctx.ellipse(6 * s + lookX, eyeY, 1.1 * s, 1.1 * s * eyeOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    // Catchlight
    ctx.fillStyle = rgb(255, 255, 255, 0.9);
    ctx.beginPath();
    ctx.arc(-5.5 * s + lookX, eyeY - 0.8 * s, 0.7 * s, 0, Math.PI * 2);
    ctx.arc(6.5 * s + lookX, eyeY - 0.8 * s, 0.7 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brows
  ctx.strokeStyle = rgb(v.hair[0], v.hair[1], v.hair[2]);
  ctx.lineWidth = 1.8 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10 * s, eyeY - 6 * s + emo.brow * s * 0.4);
  ctx.quadraticCurveTo(-6 * s, eyeY - 8 * s + emo.brow * s * 0.5, -2 * s, eyeY - 6 * s + emo.brow * s * 0.3);
  ctx.moveTo(10 * s, eyeY - 6 * s + emo.brow * s * 0.4);
  ctx.quadraticCurveTo(6 * s, eyeY - 8 * s + emo.brow * s * 0.5, 2 * s, eyeY - 6 * s + emo.brow * s * 0.3);
  ctx.stroke();

  // Nose
  ctx.strokeStyle = rgb(v.skin[0] * 0.8, v.skin[1] * 0.75, v.skin[2] * 0.75);
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(0, eyeY + 3 * s);
  ctx.lineTo(2 * s, eyeY + 9 * s);
  ctx.stroke();

  // Mouth
  ctx.strokeStyle = rgb(160, 80, 80);
  ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  const mouthY = headY + 10 * s;
  if (emo.mouth > 0.3) {
    ctx.arc(0, mouthY - 2 * s, 5 * s, 0.15, Math.PI - 0.15);
  } else if (emo.mouth < -0.3) {
    ctx.arc(0, mouthY + 5 * s, 5 * s, Math.PI + 0.2, -0.2);
  } else {
    ctx.moveTo(-4 * s, mouthY);
    ctx.quadraticCurveTo(0, mouthY + emo.mouth * 4 * s, 4 * s, mouthY);
  }
  ctx.stroke();

  ctx.restore();
}

function cameraTransform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  angle: CameraAngle,
  t: number,
  intensity: number
) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.translate(cx, cy);

  switch (angle) {
    case "close-up":
      ctx.scale(1.6 + Math.sin(t * 0.3) * 0.02, 1.6);
      ctx.translate(0, h * 0.12);
      break;
    case "extreme-close-up":
      ctx.scale(2.4, 2.4);
      ctx.translate(0, h * 0.18);
      break;
    case "low-angle":
      ctx.scale(1.15, 1.25);
      ctx.translate(0, h * 0.08);
      break;
    case "high-angle":
      ctx.scale(0.95, 0.9);
      ctx.translate(0, -h * 0.05);
      break;
    case "dutch":
      ctx.rotate(0.12 + Math.sin(t * 0.5) * 0.02);
      ctx.scale(1.1, 1.1);
      break;
    case "tracking":
      ctx.translate(Math.sin(t * 1.5) * 20 * intensity, Math.cos(t * 0.8) * 6);
      break;
    case "dolly-zoom":
      ctx.scale(1.2 + Math.sin(t * 0.8) * 0.15, 1.2 + Math.sin(t * 0.8) * 0.15);
      break;
    case "pov":
      ctx.translate(Math.sin(t * 3) * 4, Math.cos(t * 2.5) * 3);
      ctx.scale(1.05, 1.05);
      break;
    case "aerial":
      ctx.scale(0.75, 0.75);
      break;
    case "wide":
      ctx.scale(0.85, 0.85);
      break;
    case "over-shoulder":
      ctx.translate(w * 0.08, 0);
      ctx.scale(1.2, 1.2);
      break;
    default:
      ctx.scale(1 + Math.sin(t * 0.2) * 0.01, 1);
  }

  ctx.translate(-cx, -cy);
}

function drawDialogueBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  speaker: string
) {
  const maxW = Math.min(w * 0.7, 320);
  ctx.font = "600 13px Inter, system-ui, sans-serif";
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW - 24) {
      if (line) lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);

  const bw = Math.min(
    maxW,
    Math.max(...lines.map((l) => ctx.measureText(l).width)) + 28
  );
  const bh = lines.length * 18 + 28;
  const bx = clamp(x - bw / 2, 12, w - bw - 12);
  const by = Math.max(12, y);

  ctx.fillStyle = rgb(10, 12, 20, 0.82);
  ctx.strokeStyle = rgb(255, 255, 255, 0.15);
  ctx.lineWidth = 1;
  roundRect(ctx, bx, by, bw, bh, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = rgb(120, 200, 255, 0.9);
  ctx.font = "700 10px Inter, system-ui, sans-serif";
  ctx.fillText(speaker.toUpperCase(), bx + 14, by + 14);

  ctx.fillStyle = rgb(240, 242, 250, 0.95);
  ctx.font = "500 13px Inter, system-ui, sans-serif";
  lines.forEach((l, i) => {
    ctx.fillText(l, bx + 14, by + 32 + i * 18);
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawNarrationBar(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  progress: number
) {
  const words = text.split(" ");
  const visibleCount = Math.max(1, Math.floor(words.length * Math.min(1, progress * 1.4)));
  const visible = words.slice(0, visibleCount).join(" ");

  const barH = Math.min(120, h * 0.18);
  const gg = ctx.createLinearGradient(0, h - barH - 20, 0, h);
  gg.addColorStop(0, rgb(0, 0, 0, 0));
  gg.addColorStop(0.3, rgb(0, 0, 0, 0.55));
  gg.addColorStop(1, rgb(0, 0, 0, 0.8));
  ctx.fillStyle = gg;
  ctx.fillRect(0, h - barH - 20, w, barH + 20);

  ctx.font = "500 15px Inter, Georgia, serif";
  const maxW = w * 0.86;
  const lines: string[] = [];
  let line = "";
  for (const word of visible.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW) {
      if (line) lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);

  ctx.fillStyle = rgb(245, 245, 250, 0.95);
  ctx.textAlign = "center";
  const startY = h - 28 - (lines.length - 1) * 20;
  lines.slice(-3).forEach((l, i) => {
    ctx.fillText(l, w / 2, startY + i * 20);
  });
  ctx.textAlign = "left";
}

function drawSceneTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  w: number,
  h: number,
  fade: number
) {
  if (fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = rgb(255, 255, 255, 0.9);
  ctx.font = "700 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  const label = title.toUpperCase().split("").join(" ");
  ctx.fillText(label, w / 2, h * 0.12);
  ctx.strokeStyle = rgb(255, 255, 255, 0.3);
  ctx.lineWidth = 1;
  const tw = ctx.measureText(label).width;
  ctx.beginPath();
  ctx.moveTo(w / 2 - tw / 2 - 20, h * 0.12 + 10);
  ctx.lineTo(w / 2 + tw / 2 + 20, h * 0.12 + 10);
  ctx.stroke();
  ctx.restore();
  ctx.textAlign = "left";
}

function drawFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const imageData = ctx.getImageData(0, 0, Math.min(w, 200), Math.min(h, 200));
  // Lightweight grain overlay via sparse noise rects
  const rng = seededRandom(Math.floor(t * 30) + 1);
  ctx.fillStyle = rgb(255, 255, 255, 0.03);
  for (let i = 0; i < 120; i++) {
    const x = rng() * w;
    const y = rng() * h;
    if (rng() > 0.5) ctx.fillRect(x, y, 1.5, 1.5);
  }
  // Avoid unused warning
  void imageData;
}

/* ── Public render API ── */

export interface FrameContext {
  scene: Scene;
  characters: Character[];
  style: StoryStyle;
  timeInScene: number; // seconds
  sceneDuration: number;
  globalTime: number;
  subtitles?: SubtitleTrack | null;
  burnSubtitles?: boolean;
  hideLegacyCaptions?: boolean;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fc: FrameContext
) {
  const { scene, characters, style, timeInScene, sceneDuration, globalTime } = fc;
  const progress = sceneDuration > 0 ? timeInScene / sceneDuration : 0;
  const t = globalTime;

  ctx.clearRect(0, 0, w, h);
  ctx.save();

  // Camera
  cameraTransform(ctx, w, h, scene.cameraAngle, t, 1);

  // Environment
  drawSky(ctx, w, h, style, scene.lighting, t);
  drawTerrain(ctx, w, h, style, hashString(scene.id), t);

  // Characters in scene
  const sceneChars = scene.characterIds
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean) as Character[];

  const baseY = h * 0.78;
  const count = sceneChars.length || 0;
  sceneChars.forEach((c, i) => {
    const spread = count === 1 ? 0.5 : 0.3 + (i / Math.max(1, count - 1)) * 0.4;
    const cx = w * spread;
    // Scale by camera
    let scale = h / 520;
    if (scene.cameraAngle === "close-up" || scene.cameraAngle === "extreme-close-up") scale *= 1.3;
    if (scene.cameraAngle === "wide" || scene.cameraAngle === "aerial") scale *= 0.7;

    // Emotion from dialogue if speaking
    let emotion: Emotion = "neutral";
    const speaking = scene.dialogue.find((d) => d.characterId === c.id);
    if (speaking) emotion = speaking.emotion;
    else if (scene.type === "climax") emotion = "determined";
    else if (scene.type === "emotional") emotion = "sad";
    else if (scene.type === "action" || scene.type === "chase") emotion = "fierce";

    const facing = i % 2 === 0 ? 1 : -1;
    // Entrance animation
    const enter = clamp(progress * 4, 0, 1);
    const enterY = (1 - enter) * 40;
    drawCharacter(ctx, c, cx, baseY + enterY, scale, t + i, emotion, facing);
  });

  // If no characters, draw silhouettes / environmental focus
  if (count === 0) {
    // Distant figure
    ctx.fillStyle = rgb(0, 0, 0, 0.4);
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.72, 8, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Atmosphere (post camera)
  drawAtmosphere(ctx, w, h, scene.lighting, scene.weather, t, hashString(scene.setting));

  // Title card fade
  const titleFade =
    progress < 0.15 ? progress / 0.15 : progress > 0.85 ? (1 - progress) / 0.15 : 1;
  if (progress < 0.35) drawSceneTitle(ctx, scene.title, w, h, titleFade * (progress < 0.25 ? 1 : 1 - (progress - 0.25) / 0.1));

  // Legacy dialogue/narration bars only when not burning pro subtitles
  if (!fc.burnSubtitles || !fc.subtitles?.cues?.length) {
    if (scene.dialogue.length && !fc.hideLegacyCaptions) {
      const dlgIndex = Math.min(
        scene.dialogue.length - 1,
        Math.floor(progress * scene.dialogue.length)
      );
      const dlg = scene.dialogue[dlgIndex];
      const speaker = characters.find((c) => c.id === dlg.characterId);
      const localProg = (progress * scene.dialogue.length) % 1;
      if (localProg > 0.1 && localProg < 0.9) {
        drawDialogueBubble(ctx, dlg.line, w / 2, h * 0.22, w, speaker?.name || "Voice");
      }
    }
    if (scene.narration && !fc.hideLegacyCaptions) {
      drawNarrationBar(ctx, scene.narration, w, h, progress);
    }
  }

  // Transition overlays
  if (progress < 0.08) {
    const fadeIn = 1 - progress / 0.08;
    if (scene.transition === "fade" || scene.order === 0) {
      ctx.fillStyle = rgb(0, 0, 0, fadeIn);
      ctx.fillRect(0, 0, w, h);
    } else if (scene.transition === "flash") {
      ctx.fillStyle = rgb(255, 255, 255, fadeIn * 0.8);
      ctx.fillRect(0, 0, w, h);
    }
  }
  if (progress > 0.92) {
    const fadeOut = (progress - 0.92) / 0.08;
    if (scene.transition === "fade" || scene.transition === "dissolve") {
      ctx.fillStyle = rgb(0, 0, 0, fadeOut);
      ctx.fillRect(0, 0, w, h);
    } else if (scene.transition === "wipe") {
      ctx.fillStyle = rgb(0, 0, 0, 1);
      ctx.fillRect(0, 0, w * fadeOut, h);
    } else if (scene.transition === "zoom") {
      // handled visually by slight darken
      ctx.fillStyle = rgb(0, 0, 0, fadeOut * 0.7);
      ctx.fillRect(0, 0, w, h);
    }
  }

  // Film grain
  drawFilmGrain(ctx, w, h, t);

  // Letterbox for cinematic
  if (style === "cinematic" || style === "epic" || style === "noir") {
    const box = h * 0.06;
    ctx.fillStyle = rgb(0, 0, 0, 1);
    ctx.fillRect(0, 0, w, box);
    ctx.fillRect(0, h - box, w, box);
  }

  // Professional burned-in subtitles
  if (fc.burnSubtitles && fc.subtitles?.cues?.length) {
    drawSubtitle(ctx, w, h, fc.subtitles, globalTime);
  }
}

export function renderThumbnail(
  canvas: HTMLCanvasElement,
  project: {
    title: string;
    style: StoryStyle;
    characters: Character[];
    tone: string;
    colorPalette: string[];
    scenes: Scene[];
  },
  variant = 0
): string {
  const w = 1280;
  const h = 720;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const scene = project.scenes[Math.min(variant, project.scenes.length - 1)] || project.scenes[0];

  if (scene) {
    renderFrame(ctx, w, h, {
      scene: { ...scene, cameraAngle: variant === 0 ? "close-up" : variant === 1 ? "wide" : "low-angle" },
      characters: project.characters,
      style: project.style,
      timeInScene: scene.durationSec * 0.4,
      sceneDuration: scene.durationSec,
      globalTime: 1.5 + variant,
    });
  } else {
    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(0, 0, w, h);
  }

  // Title treatment
  ctx.fillStyle = rgb(0, 0, 0, 0.45);
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 56px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  const title = project.title.length > 40 ? project.title.slice(0, 38) + "…" : project.title;
  ctx.fillText(title, w / 2, h * 0.78);

  ctx.font = "600 20px Inter, system-ui, sans-serif";
  ctx.fillStyle = rgb(200, 220, 255, 0.85);
  ctx.fillText(project.tone.toUpperCase() + "  ·  STORYCINEMA", w / 2, h * 0.85);

  ctx.textAlign = "left";
  return canvas.toDataURL("image/jpeg", 0.92);
}

/* ── Video recording ── */

export interface RenderOptions {
  fps?: number;
  quality?: "draft" | "standard" | "cinematic" | "imax";
  aspectRatio: AspectRatio;
  style: StoryStyle;
  characters: Character[];
  scenes: Scene[];
  subtitles?: SubtitleTrack | null;
  burnSubtitles?: boolean;
  voice?: VoiceSettings | null;
  voiceLines?: VoiceLine[];
  soundtrackMood?: string;
  musicEnabled?: boolean;
  onProgress?: (p: number, message: string) => void;
  signal?: AbortSignal;
}

async function setupRecorder(
  canvas: HTMLCanvasElement,
  fps: number,
  quality: RenderOptions["quality"],
  opts: {
    musicEnabled?: boolean;
    soundtrackMood?: string;
    durationSec: number;
    voice?: VoiceSettings | null;
    voiceLines?: VoiceLine[];
    signal?: AbortSignal;
  }
) {
  const videoStream = canvas.captureStream(fps);
  let audioCtx: AudioContext | null = null;
  let mixedStream: MediaStream = videoStream;
  let stopAudio: (() => void) | null = null;
  let cancelVO: (() => void) | null = null;

  try {
    audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const master = audioCtx.createGain();
    master.gain.value = 1;
    master.connect(dest);

    if (opts.musicEnabled !== false) {
      const buf = await createSoundtrackBuffer(
        opts.durationSec + 4,
        opts.soundtrackMood || "cinematic",
        audioCtx.sampleRate
      );
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const g = audioCtx.createGain();
      g.gain.value = 0.35;
      src.connect(g);
      g.connect(master);
      src.start(0);
      stopAudio = () => {
        try {
          src.stop();
        } catch {
          /* */
        }
      };
    }

    // Try free TTS bed for first few lines (best-effort, multi-lang)
    if (opts.voice?.enabled && opts.voiceLines?.length) {
      const lang = (opts.voice.language || "en").split("-")[0];
      const previewLines = opts.voiceLines.slice(0, 8);
      for (const line of previewLines) {
        if (opts.signal?.aborted) break;
        try {
          const blob = await fetchTtsBlob(line.text.slice(0, 180), lang);
          if (!blob || !audioCtx) continue;
          const ab = await blobToAudioBuffer(blob, audioCtx);
          const src = audioCtx.createBufferSource();
          src.buffer = ab;
          const g = audioCtx.createGain();
          g.gain.value = (line.volume ?? opts.voice.volume ?? 1) * 0.9;
          src.connect(g);
          g.connect(master);
          src.start(Math.max(0, line.startSec));
        } catch {
          /* TTS optional */
        }
      }
      // Also schedule browser VO for live monitor during render
      cancelVO = scheduleLiveVO(opts.voiceLines, opts.voice, performance.now(), opts.signal);
    }

    const tracks = [...videoStream.getVideoTracks(), ...dest.stream.getAudioTracks()];
    mixedStream = new MediaStream(tracks);
  } catch {
    mixedStream = videoStream;
  }

  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : "video/webm";

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(mixedStream, {
    mimeType: mime,
    videoBitsPerSecond:
      quality === "draft" ? 1_500_000 : quality === "imax" ? 12_000_000 : 5_000_000,
    audioBitsPerSecond: 128_000,
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      stopAudio?.();
      cancelVO?.();
      stopSpeaking();
      try {
        audioCtx?.close();
      } catch {
        /* */
      }
      mixedStream.getTracks().forEach((t) => t.stop());
      videoStream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: mime.includes("webm") ? "video/webm" : mime }));
    };
    recorder.onerror = () => reject(new Error("Recording failed"));
  });

  return { recorder, done };
}

export async function renderSceneVideo(
  scene: Scene,
  opts: Omit<RenderOptions, "scenes"> & { scenes?: Scene[]; timelineOffset?: number }
): Promise<Blob> {
  const fps = opts.fps || 30;
  const dims = aspectToDims(opts.aspectRatio, opts.quality || "standard");
  const canvas = document.createElement("canvas");
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext("2d")!;
  const duration = Math.max(2, scene.durationSec);
  const offset = opts.timelineOffset ?? 0;

  const sceneLines = (opts.voiceLines || []).filter((l) => l.sceneId === scene.id);
  const { recorder, done } = await setupRecorder(canvas, fps, opts.quality, {
    musicEnabled: opts.musicEnabled,
    soundtrackMood: opts.soundtrackMood || scene.musicCue,
    durationSec: duration,
    voice: opts.voice,
    voiceLines: sceneLines.map((l) => ({ ...l, startSec: Math.max(0, l.startSec - offset) })),
    signal: opts.signal,
  });

  recorder.start(100);
  const totalFrames = Math.ceil(duration * fps);

  for (let f = 0; f < totalFrames; f++) {
    if (opts.signal?.aborted) {
      recorder.stop();
      throw new Error("Aborted");
    }
    const timeInScene = f / fps;
    renderFrame(ctx, dims.width, dims.height, {
      scene,
      characters: opts.characters,
      style: opts.style,
      timeInScene,
      sceneDuration: duration,
      globalTime: offset + timeInScene,
      subtitles: opts.subtitles,
      burnSubtitles: opts.burnSubtitles,
      hideLegacyCaptions: !!opts.burnSubtitles,
    });
    opts.onProgress?.(f / totalFrames, `Rendering "${scene.title}" frame ${f + 1}/${totalFrames}`);
    await new Promise((r) => setTimeout(r, (1000 / fps) * 0.25));
  }

  recorder.stop();
  return done;
}

export async function renderFullVideo(opts: RenderOptions): Promise<Blob> {
  const fps = opts.fps || 30;
  const dims = aspectToDims(opts.aspectRatio, opts.quality || "standard");
  const canvas = document.createElement("canvas");
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext("2d")!;

  const scenes = opts.scenes;
  const totalDuration = scenes.reduce((s, sc) => s + Math.max(2, sc.durationSec), 0) + 4.5;

  // Shift voice lines after title card (2.2s)
  const titlePad = 2.2;
  const shiftedLines = (opts.voiceLines || []).map((l) => ({
    ...l,
    startSec: l.startSec + titlePad,
  }));

  const { recorder, done } = await setupRecorder(canvas, fps, opts.quality, {
    musicEnabled: opts.musicEnabled,
    soundtrackMood: opts.soundtrackMood || "cinematic",
    durationSec: totalDuration,
    voice: opts.voice,
    voiceLines: shiftedLines,
    signal: opts.signal,
  });

  recorder.start(200);
  let elapsed = 0;

  // Title card
  {
    const titleFrames = Math.ceil(fps * titlePad);
    for (let f = 0; f < titleFrames; f++) {
      if (opts.signal?.aborted) break;
      const p = f / titleFrames;
      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, dims.width, dims.height);
      const rng = seededRandom(99);
      for (let i = 0; i < 40; i++) {
        const px = rng() * dims.width;
        const py = (rng() * dims.height + f * 2) % dims.height;
        ctx.fillStyle = rgb(100, 180, 255, 0.3 * p);
        ctx.fillRect(px, py, 2, 2);
      }
      ctx.save();
      ctx.globalAlpha = clamp(p * 2, 0, 1) * clamp((1 - p) * 4, 0, 1);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(dims.width * 0.055)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("STORYCINEMA", dims.width / 2, dims.height * 0.45);
      ctx.font = `600 ${Math.round(dims.width * 0.028)}px system-ui, sans-serif`;
      ctx.fillStyle = rgb(150, 200, 255, 0.9);
      ctx.fillText("presents", dims.width / 2, dims.height * 0.52);
      ctx.restore();
      opts.onProgress?.(0.02 * p, "Title card…");
      await new Promise((r) => setTimeout(r, 1000 / fps / 4));
    }
  }
  elapsed = titlePad;

  for (let si = 0; si < scenes.length; si++) {
    const scene = scenes[si];
    const duration = Math.max(2, scene.durationSec);
    const frames = Math.ceil(duration * fps);

    for (let f = 0; f < frames; f++) {
      if (opts.signal?.aborted) {
        recorder.stop();
        throw new Error("Aborted");
      }
      const timeInScene = f / fps;
      const globalTime = elapsed + timeInScene;
      renderFrame(ctx, dims.width, dims.height, {
        scene,
        characters: opts.characters,
        style: opts.style,
        timeInScene,
        sceneDuration: duration,
        globalTime,
        subtitles: opts.subtitles
          ? {
              ...opts.subtitles,
              cues: opts.subtitles.cues.map((c) => ({
                ...c,
                startSec: c.startSec + titlePad,
                endSec: c.endSec + titlePad,
              })),
            }
          : null,
        burnSubtitles: opts.burnSubtitles,
        hideLegacyCaptions: !!opts.burnSubtitles,
      });
      const overall = globalTime / totalDuration;
      opts.onProgress?.(0.05 + overall * 0.9, `Scene ${si + 1}/${scenes.length}: ${scene.title}`);
      await new Promise((r) => setTimeout(r, 1000 / fps / 4));
    }
    elapsed += duration;
  }

  // End card
  {
    const endFrames = Math.ceil(fps * 2.5);
    for (let f = 0; f < endFrames; f++) {
      if (opts.signal?.aborted) break;
      const p = f / endFrames;
      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, dims.width, dims.height);
      ctx.save();
      ctx.globalAlpha = clamp(p * 3, 0, 1) * clamp((1 - p) * 3, 0, 1);
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${Math.round(dims.width * 0.04)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("THE END", dims.width / 2, dims.height * 0.45);
      ctx.font = `500 ${Math.round(dims.width * 0.022)}px system-ui, sans-serif`;
      ctx.fillStyle = rgb(150, 180, 220, 0.8);
      ctx.fillText("Created with StoryCinema — Zero Cost, Pure Story", dims.width / 2, dims.height * 0.55);
      ctx.restore();
      opts.onProgress?.(0.95 + 0.05 * p, "End card…");
      await new Promise((r) => setTimeout(r, 1000 / fps / 4));
    }
  }

  recorder.stop();
  opts.onProgress?.(1, "Finalizing…");
  return done;
}

export function previewFrameToDataUrl(
  scene: Scene,
  characters: Character[],
  style: StoryStyle,
  aspect: AspectRatio,
  timeFrac = 0.4
): string {
  const dims = aspectToDims(aspect, "draft");
  const canvas = document.createElement("canvas");
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext("2d")!;
  renderFrame(ctx, dims.width, dims.height, {
    scene,
    characters,
    style,
    timeInScene: scene.durationSec * timeFrac,
    sceneDuration: scene.durationSec,
    globalTime: scene.order * 5 + scene.durationSec * timeFrac,
  });
  return canvas.toDataURL("image/jpeg", 0.85);
}
