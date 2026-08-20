"use client";

import { useEffect, useRef } from "react";
import { Character, Scene, StoryStyle, AspectRatio } from "@/lib/types";
import { aspectToDims, renderFrame } from "@/lib/visual-engine";

interface Props {
  scene: Scene;
  characters: Character[];
  style: StoryStyle;
  aspectRatio: AspectRatio;
  className?: string;
}

/** Real-time animated canvas preview of a scene (living characters). */
export function LivePreview({ scene, characters, style, aspectRatio, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dims = aspectToDims(aspectRatio, "draft");
    canvas.width = dims.width;
    canvas.height = dims.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    startRef.current = performance.now();
    const duration = Math.max(2, scene.durationSec);

    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000;
      const timeInScene = elapsed % duration;
      renderFrame(ctx, dims.width, dims.height, {
        scene,
        characters,
        style,
        timeInScene,
        sceneDuration: duration,
        globalTime: elapsed + scene.order * 10,
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [scene, characters, style, aspectRatio]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
    />
  );
}
