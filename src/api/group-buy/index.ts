import type { PageResult } from "@/api/common";
import request from "@/utils/request";
import type {
  GroupBuyActivityForm,
  GroupBuyActivityItem,
  GroupBuyActivityQuery,
  GroupBuyGroupDetail,
  GroupBuyGroupItem,
  GroupBuyGroupQuery,
} from "./types";

const BASE_URL = "/api/v1/group-buy";

export const GroupBuyAPI = {
  getActivityPage: (params: GroupBuyActivityQuery) =>
    request<unknown, PageResult<GroupBuyActivityItem>>({
      url: `${BASE_URL}/activities/page`,
      method: "get",
      params,
    }),
  getActivityForm: (id: string) =>
    request<unknown, GroupBuyActivityItem>({
      url: `${BASE_URL}/activities/${id}/form`,
      method: "get",
    }),
  createActivity: (data: GroupBuyActivityForm) =>
    request({ url: `${BASE_URL}/activities`, method: "post", data }),
  updateActivity: (id: string, data: GroupBuyActivityForm) =>
    request({ url: `${BASE_URL}/activities/${id}`, method: "put", data }),
  updateActivityStatus: (id: string, status: number) =>
    request({ url: `${BASE_URL}/activities/${id}/status`, method: "patch", data: { status } }),
  deleteActivity: (id: string) =>
    request({ url: `${BASE_URL}/activities/${id}`, method: "delete" }),
  getGroupPage: (params: GroupBuyGroupQuery) =>
    request<unknown, PageResult<GroupBuyGroupItem>>({
      url: `${BASE_URL}/groups/page`,
      method: "get",
      params,
    }),
  getGroupDetail: (id: string) =>
    request<unknown, GroupBuyGroupDetail>({ url: `${BASE_URL}/groups/${id}`, method: "get" }),
};

export * from "./types";
