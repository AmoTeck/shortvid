import { NextRequest, NextResponse } from "next/server";

/**
 * Free multi-language TTS proxy.
 * Uses Google Translate TTS endpoint (no API key) — widely used for free VO.
 * Falls back with clear error if blocked.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const text = (req.nextUrl.searchParams.get("text") || "").slice(0, 200);
  const lang = (req.nextUrl.searchParams.get("lang") || "en").slice(0, 12);
  if (!text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}` +
    `&tl=${encodeURIComponent(lang)}&client=tw-ob`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "audio/mpeg, audio/*;q=0.9, */*;q=0.5",
        Referer: "https://translate.google.com/",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "TTS upstream failed", status: res.status }, { status: 502 });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TTS error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
