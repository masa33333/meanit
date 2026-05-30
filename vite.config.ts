import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";

type Handler = (body: unknown) => Promise<{ status: number; data: unknown }>;

// 開発時に Vite の dev サーバー内で /api/* を同居させるプラグイン。
// `npm run dev` だけでフロント + API（chat / transcribe）が立ち上がる。
// 本番では api/*.ts（サーバーレス）が同じ handler を共有する。
function apiPlugin(anthropicKey: string, openaiKey: string): Plugin {
  async function json(
    req: IncomingMessage,
    res: ServerResponse,
    handler: Handler
  ) {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: "method_not_allowed" }));
      return;
    }
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "bad_json" }));
      return;
    }
    const { status, data } = await handler(body);
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  }

  return {
    name: "meanit-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/chat", async (req, res) => {
        const mod = (await server.ssrLoadModule(
          "/server/handler.ts"
        )) as typeof import("./server/handler.js");
        await json(req, res, (b) => mod.handleChat(b as never, anthropicKey));
      });
      server.middlewares.use("/api/transcribe", async (req, res) => {
        const mod = (await server.ssrLoadModule(
          "/server/transcribe.ts"
        )) as typeof import("./server/transcribe.js");
        await json(req, res, (b) =>
          mod.handleTranscribe(b as never, openaiKey)
        );
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      apiPlugin(env.ANTHROPIC_API_KEY ?? "", env.OPENAI_API_KEY ?? ""),
    ],
  };
});
