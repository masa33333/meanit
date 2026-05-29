import type { Analysis } from "../types";

interface Entry extends Analysis {
  id: string;
}

export default function LogPanel({
  entries,
  onClose,
}: {
  entries: Entry[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(43,38,34,0.4)]"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-[420px] animate-panelIn overflow-y-auto bg-canvas px-5 py-[22px] shadow-[-10px_0_40px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-[18px] flex items-start justify-between">
          <div>
            <div className="font-display text-[22px] font-bold">失敗ログ</div>
            <div className="mt-1 text-[11.5px] text-inkSoft">
              意図とセットで貯まる、あなただけの出力訓練素材
            </div>
          </div>
          <button
            className="h-8 w-8 rounded-full border border-[rgba(43,38,34,0.12)] text-sm text-ink"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-inkSoft">
            まだ空。会話して、意図を確認すると貯まっていく。
          </div>
        ) : (
          <div className="flex flex-col gap-[11px]">
            {entries.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-[rgba(43,38,34,0.12)] bg-paper px-3.5 py-[13px]"
              >
                {e.forwardGap && (
                  <div className="mb-2 inline-block rounded-[5px] bg-gold px-[7px] py-0.5 text-[10px] font-bold text-white">
                    言いたかったのに言えなかった
                  </div>
                )}
                <div className="mb-[7px] text-sm font-medium leading-[1.5]">
                  <span className="mr-2 inline-block min-w-[56px] text-[10px] font-bold text-inkSoft">
                    意図
                  </span>
                  {e.guessedIntentJa || "（前向きの穴）"}
                </div>
                <div className="mb-[7px] text-[12.5px] text-inkSoft">
                  <span className="mr-2 inline-block min-w-[56px] text-[10px] font-bold text-inkSoft">
                    言ったこと
                  </span>
                  <span className="line-through opacity-70">{e.said}</span>
                </div>
                {e.naturalEn && (
                  <div className="border-t border-dashed border-[rgba(43,38,34,0.12)] pt-[7px] font-display text-sm text-ink">
                    <span className="mr-2 inline-block min-w-[56px] font-sans text-[10px] font-bold text-inkSoft">
                      言えるように
                    </span>
                    {e.naturalEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
