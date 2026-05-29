import type {
  Level,
  Message,
  TurnResult,
  CorrectionResult,
} from "../types";

// クライアントは自分のサーバー（/api/chat）だけを叩く。
// Anthropic のキーやプロンプトはここからは一切見えない。
async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`api ${res.status}`);
  return (await res.json()) as T;
}

export function sendTurn(
  level: Level,
  history: Message[]
): Promise<TurnResult> {
  const messages = history
    .filter((m) => m.role === "partner" || m.role === "learner")
    .map((m) => ({
      role: (m.role === "partner" ? "assistant" : "user") as
        | "assistant"
        | "user",
      content: m.text,
    }));
  return post<TurnResult>({ kind: "turn", level, messages });
}

export function sendCorrection(
  said: string,
  intent: string
): Promise<CorrectionResult> {
  return post<CorrectionResult>({ kind: "correction", said, intent });
}
