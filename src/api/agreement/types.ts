export enum AgreementType {
  USER_AGREEMENT = "USER_AGREEMENT",
  PRIVACY_POLICY = "PRIVACY_POLICY",
  MEDICAL_INFORMED_CONSENT = "MEDICAL_INFORMED_CONSENT",
}

export interface AgreementItem {
  type: AgreementType;
  typeLabel: string;
  draftTitle: string;
  published: boolean;
  publishTime?: string | null;
  updateTime?: string | null;
}

export interface AgreementForm {
  type: AgreementType;
  title: string;
  content: string;
}

export type AgreementDraft = Pick<AgreementForm, "title" | "content">;
