import { useState, useRef, useEffect } from "react";
import type { Analysis, Level, Message } from "./types";
import { sendTurn, sendCorrection } from "./lib/api";
import { speak, makeRecognition, sttSupported } from "./lib/speech";
import CoachCard from "./components/CoachCard";
import LogPanel from "./components/LogPanel";

const SEED = "Hi! I'm really happy we can talk. So, what did you do last weekend?";
const FALLBACK =
  "Sorry, I didn't quite catch that — can you say it one more time?";

let _id = 1;
const nid = () => `m${_id++}`;

const LEVELS: [Level, string][] = [
  ["easy", "やさしめ"],
  ["normal", "ふつう"],
  ["real", "リアル"],
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: nid(), role: "partner", text: SEED },
  ]);
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [correctText, setCorrectText] = useState("");
  const [level, setLevel] = useState<Level>("easy");
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [micOk, setMicOk] = useState(true);
  const recogRef = useRef<ReturnType<typeof makeRecognition>>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, analyses, loading]);

  useEffect(() => {
    try {
      window.speechSynthesis?.getVoices();
    } catch {
      /* ignore */
    }
    if (!sttSupported()) setMicOk(false);
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    const learnerMsg: Message = { id: nid(), role: "learner", text };
    const next = [...messages, learnerMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const result = await sendTurn(level, next);
      setMessages((cur) => [
        ...cur,
        { id: nid(), role: "partner", text: result.partnerReply || "..." },
      ]);
      if (voiceOn) speak(result.partnerReply);
      setAnalyses((cur) => ({
        ...cur,
        [learnerMsg.id]: {
          said: text,
          heardAsJa: result.heardAsJa || "",
          guessedIntentJa: result.guessedIntentJa || "",
          gapJa: result.gapJa || "",
          naturalEn: result.naturalEn || "",
          naturalAlt: result.naturalAlt || "",
          confirmed: false,
          inLog: false,
          forwardGap: false,
        },
      }));
    } catch {
      setMessages((cur) => [
        ...cur,
        { id: nid(), role: "partner", text: FALLBACK },
      ]);
      if (voiceOn) speak(FALLBACK);
    } finally {
      setLoading(false);
    }
  }

  function confirmYes(msgId: string) {
    setAnalyses((cur) => ({
      ...cur,
      [msgId]: { ...cur[msgId], confirmed: true, inLog: true },
    }));
  }

  async function submitCorrection(msgId: string) {
    const intent = correctText.trim();
    if (!intent) return;
    const a = analyses[msgId];
    setCorrecting(null);
    setCorrectText("");
    setAnalyses((cur) => ({ ...cur, [msgId]: { ...cur[msgId], reloading: true } }));
    try {
      const result = await sendCorrection(a.said, intent);
      setAnalyses((cur) => ({
        ...cur,
        [msgId]: {
          ...cur[msgId],
          guessedIntentJa: intent,
          gapJa: result.gapJa || cur[msgId].gapJa,
          naturalEn: result.naturalEn || cur[msgId].naturalEn,
          naturalAlt: result.naturalAlt || "",
          confirmed: true,
          inLog: true,
          corrected: true,
          reloading: false,
        },
      }));
    } catch {
      setAnalyses((cur) => ({
        ...cur,
        [msgId]: { ...cur[msgId], reloading: false },
      }));
    }
  }

  function toggleForwardGap(msgId: string) {
    setAnalyses((cur) => ({
      ...cur,
      [msgId]: {
        ...cur[msgId],
        forwardGap: !cur[msgId].forwardGap,
        inLog: !cur[msgId].forwardGap ? true : cur[msgId].inLog,
      },
    }));
  }

  function startListening() {
    const r = makeRecognition();
    if (!r) {
      setMicOk(false);
      return;
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    recogRef.current = r;
    const base = input.trim();
    r.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++)
        transcript += e.results[i][0].transcript;
      setInput((base ? base + " " : "") + transcript);
    };
    r.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        setMicOk(false);
    };
    r.onend = () => setListening(false);
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function stopListening() {
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }

  const logEntries = Object.entries(analyses)
    .filter(([, a]) => a.inLog)
    .map(([id, a]) => ({ id, ...a }));

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[640px] flex-col bg-canvas font-sans text-ink">
      {/* header */}
      <header className="flex items-end justify-between px-[22px] pt-[22px] pb-3">
        <div>
          <div className="font-display text-[30px] font-bold leading-none tracking-[-0.5px]">
            MeanIt<span className="text-coach">.</span>
            <span className="ml-2 rounded border border-[rgba(43,38,34,0.12)] px-[5px] py-px align-middle font-sans text-[10px] text-inkSoft">
              仮称
            </span>
          </div>
          <div className="mt-1.5 text-xs text-inkSoft">意図を通す実技練習場</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-[15px] ${
              voiceOn
                ? "border-[rgba(63,122,109,0.35)] bg-partnerSoft"
                : "border-[rgba(43,38,34,0.12)] bg-paper"
            }`}
            onClick={() => setVoiceOn((v) => !v)}
            title="相手の声"
          >
            {voiceOn ? "🔊" : "🔇"}
          </button>
          <button
            className="flex items-center gap-[7px] rounded-full border border-[rgba(43,38,34,0.12)] bg-paper px-3.5 py-2 text-[12.5px] text-ink"
            onClick={() => setLogOpen(true)}
          >
            失敗ログ
            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coach px-[5px] text-[11px] text-white">
              {logEntries.length}
            </span>
          </button>
        </div>
      </header>

      {/* dojo label + level dial */}
      <div className="flex items-center gap-2.5 px-[22px] pb-2.5 text-[10.5px]">
        <span className="font-bold text-partner">向こう：会話相手</span>
        <span className="font-bold text-coach">隣：相棒コーチ</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 text-[10px] text-inkSoft">相手の英語</span>
          {LEVELS.map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setLevel(key)}
              className={`rounded-full border px-[9px] py-[3px] text-[10.5px] ${
                level === key
                  ? "border-partner bg-partner font-bold text-white"
                  : "border-[rgba(43,38,34,0.12)] text-inkSoft"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* thread */}
      <main
        ref={scrollRef}
        className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-[18px] pb-5 pt-2"
      >
        {messages.map((m) => {
          if (m.role === "system")
            return (
              <div
                key={m.id}
                className="animate-fadeUp py-2 text-center text-xs text-inkSoft"
              >
                {m.text}
              </div>
            );
          const isPartner = m.role === "partner";
          return (
            <div key={m.id}>
              <div
                className={`my-2 flex items-end gap-2 animate-fadeUp ${
                  isPartner ? "justify-start" : "justify-end"
                }`}
              >
                {isPartner && (
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-partnerSoft text-base">
                    🌍
                  </div>
                )}
                <div
                  className={
                    isPartner
                      ? "max-w-[78%] rounded-[4px_16px_16px_16px] border border-[rgba(63,122,109,0.18)] bg-partnerSoft px-[15px] py-[11px]"
                      : "max-w-[78%] rounded-[16px_16px_4px_16px] bg-ink px-[15px] py-[11px] text-canvas"
                  }
                >
                  {isPartner && (
                    <div className="mb-[3px] flex items-center gap-1.5">
                      <span className="text-[10px] font-bold tracking-[0.3px] text-partner">
                        Friend
                      </span>
                      <button
                        className="cursor-pointer border-none bg-transparent p-0 text-[11px] leading-none opacity-70"
                        onClick={() => speak(m.text)}
                        title="もう一度聞く"
                      >
                        🔊
                      </button>
                    </div>
                  )}
                  <div className="text-[15px] leading-[1.5]">{m.text}</div>
                </div>
              </div>

              {m.role === "learner" && (
                <div className="my-1 flex justify-end">
                  <button
                    onClick={() => toggleForwardGap(m.id)}
                    className={`rounded-full px-[11px] py-1 text-[11px] ${
                      analyses[m.id]?.forwardGap
                        ? "border border-gold bg-gold text-white"
                        : "border border-dashed border-[rgba(43,38,34,0.12)] text-inkSoft"
                    }`}
                  >
                    {analyses[m.id]?.forwardGap ? "✓ " : ""}
                    言いたかったのに言えなかった
                  </button>
                </div>
              )}

              {m.role === "learner" && analyses[m.id] && (
                <CoachCard
                  a={analyses[m.id]}
                  onYes={() => confirmYes(m.id)}
                  onDifferent={() => {
                    setCorrecting(m.id);
                    setCorrectText("");
                  }}
                  correcting={correcting === m.id}
                  correctText={correctText}
                  setCorrectText={setCorrectText}
                  onSubmitCorrection={() => submitCorrection(m.id)}
                  onCancelCorrection={() => setCorrecting(null)}
                />
              )}
            </div>
          );
        })}

        {loading && (
          <div className="my-2 flex items-end gap-2 animate-fadeUp">
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-partnerSoft text-base">
              🌍
            </div>
            <div className="rounded-[4px_16px_16px_16px] border border-[rgba(63,122,109,0.18)] bg-partnerSoft px-[15px] py-[11px]">
              <div className="typing flex gap-1 px-0.5 py-[3px]">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* input */}
      <div className="sticky bottom-0 flex items-end gap-[9px] border-t border-[rgba(43,38,34,0.12)] bg-canvas px-4 pb-[18px] pt-3">
        {micOk && (
          <button
            onClick={listening ? stopListening : startListening}
            className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] ${
              listening
                ? "animate-pulseMic border border-coach bg-coach text-sm text-white"
                : "border border-[rgba(43,38,34,0.12)] bg-paper text-lg"
            }`}
            title={listening ? "とめる" : "話す"}
          >
            {listening ? "■" : "🎤"}
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
          placeholder={
            micOk
              ? "🎤を押して話すか、入力。めちゃくちゃでいい。（⌘/Ctrl+Enterで送信）"
              : "めちゃくちゃでいい。とにかく英語で返してみて。（⌘/Ctrl+Enterで送信）"
          }
          rows={2}
          className="flex-1 resize-none rounded-[13px] border border-[rgba(43,38,34,0.12)] bg-paper px-3.5 py-[11px] text-[14.5px] leading-[1.45] text-ink outline-none"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-[13px] bg-ink px-5 text-[14.5px] font-bold text-canvas disabled:opacity-40"
          style={{ height: 46 }}
        >
          送る
        </button>
      </div>

      {logOpen && (
        <LogPanel entries={logEntries} onClose={() => setLogOpen(false)} />
      )}
    </div>
  );
}
