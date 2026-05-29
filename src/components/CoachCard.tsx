import type { Analysis } from "../types";

interface Props {
  a: Analysis;
  onYes: () => void;
  onDifferent: () => void;
  correcting: boolean;
  correctText: string;
  setCorrectText: (v: string) => void;
  onSubmitCorrection: () => void;
  onCancelCorrection: () => void;
}

export default function CoachCard({
  a,
  onYes,
  onDifferent,
  correcting,
  correctText,
  setCorrectText,
  onSubmitCorrection,
  onCancelCorrection,
}: Props) {
  return (
    <div className="animate-coachIn ml-[38px] mt-1 mb-3.5 rounded-2xl border border-[rgba(194,107,74,0.28)] border-l-[3px] border-l-coach bg-paper px-[15px] pt-[13px] pb-[15px] shadow-[0_6px_20px_rgba(43,38,34,0.05)]">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-base">🎒</span>
        <span className="text-xs font-bold text-coach">相棒コーチ</span>
        <span className="ml-auto text-[10.5px] font-bold text-partner">
          ✓ 意図は受け取った
        </span>
      </div>

      <div className="mb-[11px] flex items-baseline gap-[9px]">
        <span className="w-16 shrink-0 text-[10.5px] font-bold text-inkSoft">
          こう聞こえた
        </span>
        <span className="text-[13.5px] leading-[1.55] text-ink">
          {a.heardAsJa}
        </span>
      </div>

      <div className="mb-3 rounded-xl bg-coachSoft px-[13px] py-[11px]">
        <div className="mb-1.5 text-xs font-bold text-coach">
          🎯 本当はこう言いたかった？
        </div>
        <div className="mb-1 text-[14.5px] font-medium leading-[1.5]">
          {a.guessedIntentJa}
        </div>

        {!a.confirmed && !correcting && (
          <div className="mt-2.5 flex gap-2">
            <button
              className="rounded-full bg-coach px-4 py-[7px] text-[12.5px] font-bold text-white"
              onClick={onYes}
            >
              はい、それ
            </button>
            <button
              className="rounded-full border border-coach px-4 py-[7px] text-[12.5px] font-bold text-coach"
              onClick={onDifferent}
            >
              もう少し違う
            </button>
          </div>
        )}

        {correcting && (
          <div className="mt-2.5">
            <input
              value={correctText}
              onChange={(e) => setCorrectText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing)
                  onSubmitCorrection();
              }}
              placeholder="日本語で「本当はこう言いたかった」を書いて"
              className="w-full rounded-lg border border-coach bg-white px-[11px] py-[9px] text-[13.5px] text-ink outline-none"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <button
                className="rounded-full bg-coach px-4 py-[7px] text-[12.5px] font-bold text-white"
                onClick={onSubmitCorrection}
              >
                これで直す
              </button>
              <button
                className="rounded-full border border-[rgba(43,38,34,0.12)] px-3.5 py-[7px] text-[12.5px] text-inkSoft"
                onClick={onCancelCorrection}
              >
                やめる
              </button>
            </div>
          </div>
        )}

        {a.confirmed && (
          <div className="mt-2 text-[11px] font-bold text-partner">
            {a.corrected ? "意図を修正して記録" : "✓ 記録した"}
          </div>
        )}
      </div>

      {a.reloading ? (
        <div className="py-1.5 text-[12.5px] text-inkSoft">直しています…</div>
      ) : (
        <>
          <div className="mb-3 flex items-baseline gap-[9px]">
            <span className="shrink-0 rounded-[5px] bg-inkSoft px-[7px] py-0.5 text-[10.5px] font-bold text-white">
              ズレ
            </span>
            <span className="text-[13px] leading-[1.6] text-ink">{a.gapJa}</span>
          </div>

          <div className="border-t border-dashed border-[rgba(43,38,34,0.12)] pt-[11px]">
            <div className="mb-1.5 text-[11.5px] font-bold text-gold">
              💬 自然な言い方（部品）
            </div>
            <div className="font-display text-[15.5px] font-medium leading-[1.5] text-ink">
              {a.naturalEn}
            </div>
            {a.naturalAlt ? (
              <div className="mt-1 text-[13.5px] leading-[1.5] text-inkSoft">
                ・{a.naturalAlt}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
