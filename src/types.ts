export type Level = "easy" | "normal" | "real";

export type Role = "partner" | "learner" | "system";

export interface Message {
  id: string;
  role: Role;
  text: string;
}

export interface Analysis {
  said: string;
  heardAsJa: string;
  guessedIntentJa: string;
  gapJa: string;
  naturalEn: string;
  naturalAlt: string;
  confirmed: boolean;
  inLog: boolean;
  forwardGap: boolean;
  corrected?: boolean;
  reloading?: boolean;
}

export interface TurnResult {
  partnerReply: string;
  heardAsJa: string;
  guessedIntentJa: string;
  gapJa: string;
  naturalEn: string;
  naturalAlt: string;
}

export interface CorrectionResult {
  gapJa: string;
  naturalEn: string;
  naturalAlt: string;
}
