// ============================================================
//  api/transcribe.ts — 本番用サーバーレス関数（音声 → テキスト）
// ============================================================

import { handleTranscribe, type TranscribeRequest } from "../server/transcribe.js";

interface Req {
  method?: string;
  body?: unknown;
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  setHeader: (k: string, v: string) => void;
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  let body: TranscribeRequest;
  try {
    body =
      typeof req.body === "string"
        ? (JSON.parse(req.body) as TranscribeRequest)
        : (req.body as TranscribeRequest);
  } catch {
    res.status(400).json({ error: "bad_json" });
    return;
  }
  const { status, data } = await handleTranscribe(
    body,
    process.env.OPENAI_API_KEY ?? ""
  );
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(data);
}
