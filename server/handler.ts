// ============================================================
//  server/handler.ts
//  フレームワーク非依存の純粋ハンドラ。
//  Vite の dev ミドルウェアと api/chat.ts（サーバーレス）が共有する。
//  APIキーは引数で受け取り、クライアントには一切渡らない。
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import {
  MODEL,
  buildTurnSystem,
  CORRECTION_SYSTEM,
  type Level,
} from "./prompts.js";

export interface TurnRequest {
  kind: "turn";
  level: Level;
  messages: { role: "user" | "assistant"; content: string }[];
}

export interface CorrectionRequest {
  kind: "correction";
  said: string;
  intent: string;
}

export type ChatRequest = TurnRequest | CorrectionRequest;

export interface Analysis {
  partnerReply?: string;
  heardAsJa?: string;
  guessedIntentJa?: string;
  gapJa?: string;
  naturalEn?: string;
  naturalAlt?: string;
}

// JSON が多少壊れていても各フィールドを拾う頑健なパーサ
function parseResult(text: string): Analysis {
  let t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  try {
    return JSON.parse(t);
  } catch {
    // empty
  }
  const grab = (k: string): string => {
    const m = t.match(new RegExp('"' + k + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
    if (!m) return "";
    return m[1]
      .replace(/\\n/g, " ")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .trim();
  };
  const obj: Analysis = {
    partnerReply: grab("partnerReply"),
    heardAsJa: grab("heardAsJa"),
    guessedIntentJa: grab("guessedIntentJa"),
    gapJa: grab("gapJa"),
    naturalEn: grab("naturalEn"),
    naturalAlt: grab("naturalAlt"),
  };
  if (!obj.partnerReply && !obj.naturalEn && !obj.gapJa) {
    throw new Error("unparseable");
  }
  return obj;
}

async function callAnthropic(
  client: Anthropic,
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  tries = 2
): Promise<Analysis> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 1000,
        system,
        messages,
      });
      const text = msg.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n");
      if (!text.trim()) throw new Error("empty");
      return parseResult(text);
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastErr;
}

export async function handleChat(
  body: ChatRequest,
  apiKey: string
): Promise<{ status: number; data: unknown }> {
  if (!apiKey) {
    return { status: 500, data: { error: "ANTHROPIC_API_KEY is not set" } };
  }
  const client = new Anthropic({ apiKey });

  try {
    if (body.kind === "turn") {
      const system = buildTurnSystem(body.level);
      const result = await callAnthropic(client, system, body.messages);
      return { status: 200, data: result };
    }
    if (body.kind === "correction") {
      const result = await callAnthropic(client, CORRECTION_SYSTEM, [
        {
          role: "user",
          content: `Original English attempt: "${body.said}"\nLearner's true intent (Japanese): "${body.intent}"`,
        },
      ]);
      return { status: 200, data: result };
    }
    return { status: 400, data: { error: "unknown kind" } };
  } catch {
    return { status: 502, data: { error: "model_failed" } };
  }
}
