# MeanIt（仮称）— 意図を通す実技練習場

めちゃくちゃな英語で話す → 会話相手AIが意図を汲んで温かく反応 → 相棒コーチAIが「こう聞こえた／本当はこう言いたかった？／ズレ1点／自然な言い方」を日本語で返す → 失敗ログに意図ごと蓄積。

これは MVP（意図レスキュー・ループ + 音声）の本番実装の雛形です。

## アーキテクチャ（重要）

```
ブラウザ (React)  ──POST /api/chat──▶  サーバー (handler)  ──▶  Anthropic API
   ↑ キーもプロンプトも見えない          ↑ ANTHROPIC_API_KEY を保持
                                        ↑ SYSTEM/LEVELS プロンプトを保持
```

- **APIキーは絶対にクライアントに出ない。** ブラウザは自分のサーバー `/api/chat` だけを叩く。
- **プロンプト（methodology）もサーバー側だけ。** `server/prompts.ts` に置き、クライアントには配信しない。IP保護とプロキシ悪用防止を兼ねる。
- 開発時は Vite の dev サーバーに API を同居させる（`vite.config.ts` のプラグイン）。本番は `api/chat.ts`（サーバーレス）が同じ `server/handler.ts` を共有する。

## セットアップ

```bash
npm install
cp .env.example .env        # .env を開いて ANTHROPIC_API_KEY を設定
npm run dev                 # http://localhost:5173 （フロント + API が同居）
```

## 本番デプロイ（Vercel の例）

1. リポジトリを Vercel に接続（フレームワークは Vite を自動検出）。
2. 環境変数 `ANTHROPIC_API_KEY` を Vercel のプロジェクト設定に追加。
3. `api/chat.ts` は自動でサーバーレス関数としてデプロイされる。

Cloudflare Pages / Netlify などに載せる場合も、`server/handler.ts` の `handleChat()` を各プラットフォームの関数ハンドラで包むだけ。

## 構成

```
api/chat.ts            本番用サーバーレス関数（Vercel/Node スタイル）
server/
  prompts.ts           SYSTEM / LEVELS / モデル名（← methodology。ここを育てる）
  handler.ts           Anthropic 呼び出し + 頑健な JSON パーサ（dev/prod 共有）
src/
  App.tsx              画面本体
  components/          CoachCard / LogPanel
  lib/
    api.ts             /api/chat を叩くクライアント
    speech.ts          TTS（相手が喋る）/ STT（自分が喋る）
  types.ts
vite.config.ts         dev で /api/chat を同居させるプラグイン
```

## 設計メモ

- **音声認識（STT）は入力手段であって発音は採点しない。** このアプリの軸は意図伝達。発音はスコープ外。
- **会話相手の英語レベルは学習者に自動追従。** `easy/normal/real` を切替可能、デフォルト `easy`。
- **失敗時もキャラを保つ。** API が落ちても冷たいエラーは出さず、会話相手が自然に聞き返す。

## 次にやること（MVPの外側）

- メモ＝武器庫（部品の収集とタグ付け）
- リプレイ（同じ会話の再挑戦・色分け可視化）
- 補助輪が外れる難易度の自動上昇
- 多言語展開（母語別の失敗マップ）

## モデルの変更

`server/prompts.ts` の `MODEL` を編集。最新モデルは https://docs.claude.com/en/docs/about-claude/models 参照。
