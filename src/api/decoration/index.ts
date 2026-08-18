import type { PageResult } from "@/api/common";
import request from "@/utils/request";
import type {
  BannerForm,
  BannerItem,
  BrandForm,
  DecorationQuery,
  NoticeForm,
  NoticeItem,
} from "./types";

const BASE_URL = "/api/v1/decoration";

export const BannerAPI = {
  getPage: (params: DecorationQuery) =>
    request<unknown, PageResult<BannerItem>>({
      url: `${BASE_URL}/banners/page`,
      method: "get",
      params,
    }),
  getForm: (id: string) =>
    request<unknown, BannerItem>({ url: `${BASE_URL}/banners/${id}/form`, method: "get" }),
  create: (data: BannerForm) => request({ url: `${BASE_URL}/banners`, method: "post", data }),
  update: (id: string, data: BannerForm) =>
    request({ url: `${BASE_URL}/banners/${id}`, method: "put", data }),
  updateStatus: (id: string, status: number) =>
    request({ url: `${BASE_URL}/banners/${id}/status`, method: "patch", data: { status } }),
  delete: (id: string) => request({ url: `${BASE_URL}/banners/${id}`, method: "delete" }),
};

export const NoticeAPI = {
  getPage: (params: DecorationQuery) =>
    request<unknown, PageResult<NoticeItem>>({
      url: `${BASE_URL}/notices/page`,
      method: "get",
      params,
    }),
  getForm: (id: string) =>
    request<unknown, NoticeItem>({ url: `${BASE_URL}/notices/${id}/form`, method: "get" }),
  create: (data: NoticeForm) => request({ url: `${BASE_URL}/notices`, method: "post", data }),
  update: (id: string, data: NoticeForm) =>
    request({ url: `${BASE_URL}/notices/${id}`, method: "put", data }),
  updateStatus: (id: string, status: number) =>
    request({ url: `${BASE_URL}/notices/${id}/status`, method: "patch", data: { status } }),
  delete: (id: string) => request({ url: `${BASE_URL}/notices/${id}`, method: "delete" }),
};

export const BrandAPI = {
  get: () => request<unknown, BrandForm>({ url: `${BASE_URL}/brand`, method: "get" }),
  save: (content: string) =>
    request({ url: `${BASE_URL}/brand`, method: "put", data: { content } }),
};

export * from "./types";
