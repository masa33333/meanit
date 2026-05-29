// ブラウザの Web Speech API ラッパ。
// TTS = 相手が喋る / STT = 自分が喋る（入力手段。発音は採点しない）。

export function speak(text: string): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    const voices = synth.getVoices();
    const v =
      voices.find(
        (x) =>
          /en[-_]US/i.test(x.lang) &&
          /Samantha|Google US|Jenny|Aria/i.test(x.name)
      ) ||
      voices.find((x) => /en[-_]US/i.test(x.lang)) ||
      voices.find((x) => /^en/i.test(x.lang));
    if (v) u.voice = v;
    synth.speak(u);
  } catch {
    // ignore
  }
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

export function makeRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = "en-US";
  r.interimResults = true;
  r.continuous = false;
  return r;
}

export function sttSupported(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}
