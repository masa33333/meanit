import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";

// 開発時に Vite の dev サーバー内で /api/chat を同居させるプラグイン。
// これで `npm run dev` だけでフロント + API プロキシが立ち上がる。
// 本番では api/chat.ts（サーバーレス）が同じ handler を使う。
function apiPlugin(apiKey: string): Plugin {
  return {
    name: "meanit-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/api/chat",
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "method_not_allowed" }));
            return;
          }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          let body;
          try {
            body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "bad_json" }));
            return;
          }
          // dev 中は handler.ts を Vite の SSR ローダで読む（.ts のまま解決）
          const mod = (await server.ssrLoadModule(
            "/server/handler.ts"
          )) as typeof import("./server/handler.js");
          const { status, data } = await mod.handleChat(body, apiKey);
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        }
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.ANTHROPIC_API_KEY ?? "";
  return {
    plugins: [react(), apiPlugin(apiKey)],
  };
});
