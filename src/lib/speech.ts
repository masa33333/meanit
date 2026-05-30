// ブラウザ音声ヘルパ。
// TTS = 相手が喋る（Web Speech Synthesis、これは全ブラウザで安定）。
// 入力（自分が喋る）= MediaRecorder で録音し、サーバー経由で Whisper に文字起こしさせる。
//   ブラウザ内蔵の音声認識（Web Speech Recognition）は Brave 等で動かないため使わない。

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

export function recorderSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window.MediaRecorder !== "undefined"
  );
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
