import request from "@/utils/request";
import type { AgreementDraft, AgreementForm, AgreementItem, AgreementType } from "./types";

const BASE_URL = "/api/v1/agreements";

const AgreementAPI = {
  getList: () => request<unknown, AgreementItem[]>({ url: BASE_URL, method: "get" }),
  getForm: (type: AgreementType) =>
    request<unknown, AgreementForm>({ url: `${BASE_URL}/${type}/form`, method: "get" }),
  saveDraft: (type: AgreementType, data: AgreementDraft) =>
    request({ url: `${BASE_URL}/${type}`, method: "put", data }),
  publish: (type: AgreementType) => request({ url: `${BASE_URL}/${type}/publish`, method: "put" }),
};

export default AgreementAPI;
export * from "./types";
