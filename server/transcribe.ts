// ============================================================
//  server/transcribe.ts
//  音声 → テキスト。OpenAI Whisper を使う（SYNCRO! と同じ仕組み）。
//  どのブラウザ・端末でも同じように動く。APIキーはサーバー側のみ。
// ============================================================

export interface TranscribeRequest {
  audio: string; // base64（data: プレフィックスなし）
  mimeType: string; // 例: "audio/webm"
}

function extFor(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "mp4";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export async function handleTranscribe(
  body: TranscribeRequest,
  apiKey: string
): Promise<{ status: number; data: unknown }> {
  if (!apiKey) {
    return { status: 500, data: { error: "OPENAI_API_KEY is not set" } };
  }
  if (!body || !body.audio) {
    return { status: 400, data: { error: "no_audio" } };
  }
  try {
    const buffer = Buffer.from(body.audio, "base64");
    const mime = body.mimeType || "audio/webm";
    const form = new FormData();
    form.append(
      "file",
      new Blob([buffer], { type: mime }),
      `audio.${extFor(mime)}`
    );
    form.append("model", "whisper-1");
    form.append("language", "en");
    form.append("temperature", "0");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      return { status: 502, data: { error: "whisper_failed" } };
    }
    const json = (await res.json()) as { text?: string };
    return { status: 200, data: { text: (json.text || "").trim() } };
  } catch {
    return { status: 502, data: { error: "transcribe_error" } };
  }
}
