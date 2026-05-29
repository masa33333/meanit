// ============================================================
//  api/chat.ts  — 本番用サーバーレス関数（Vercel / Node スタイル）
//  Vercel は api/ 配下を自動で関数としてデプロイする。
//  Cloudflare などに載せる場合は同じ handleChat を fetch ハンドラで包むだけ。
// ============================================================

import { handleChat, type ChatRequest } from "../server/handler.js";

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
  let body: ChatRequest;
  try {
    body =
      typeof req.body === "string"
        ? (JSON.parse(req.body) as ChatRequest)
        : (req.body as ChatRequest);
  } catch {
    res.status(400).json({ error: "bad_json" });
    return;
  }
  const { status, data } = await handleChat(
    body,
    process.env.ANTHROPIC_API_KEY ?? ""
  );
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(data);
}
