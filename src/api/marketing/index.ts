import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type {
  CouponForm,
  CouponItem,
  CouponQuery,
  MemberCouponQuery,
  MemberCouponRecord,
  MemberLevel,
  MemberLevelForm,
  PointsLog,
  PointsLogQuery,
  PointsRule,
} from "./types";

export const MemberLevelAPI = {
  getPage(params: BasePage) {
    return request<unknown, PageResult<MemberLevel>>({
      url: "/api/v1/member-levels/page",
      method: "get",
      params,
    });
  },
  getList() {
    return request<unknown, MemberLevel[]>({
      url: "/api/v1/member-levels/list",
      method: "get",
    });
  },
  create(data: MemberLevelForm) {
    return request({ url: "/api/v1/member-levels", method: "post", data });
  },
  update(id: string, data: MemberLevelForm) {
    return request({ url: `/api/v1/member-levels/${id}`, method: "put", data });
  },
  delete(id: string) {
    return request({ url: `/api/v1/member-levels/${id}`, method: "delete" });
  },
};

export const PointsAPI = {
  getRule() {
    return request<unknown, PointsRule>({ url: "/api/v1/marketing/points/rule", method: "get" });
  },
  updateRule(data: PointsRule) {
    return request({ url: "/api/v1/marketing/points/rule", method: "put", data });
  },
  getLogs(params: PointsLogQuery) {
    return request<unknown, PageResult<PointsLog>>({
      url: "/api/v1/marketing/points/logs/page",
      method: "get",
      params,
    });
  },
};

export const CouponAPI = {
  getPage(params: CouponQuery) {
    return request<unknown, PageResult<CouponItem>>({
      url: "/api/v1/coupons/page",
      method: "get",
      params,
    });
  },
  getDetail(id: string) {
    return request<unknown, CouponItem>({ url: `/api/v1/coupons/${id}`, method: "get" });
  },
  create(data: CouponForm) {
    return request({ url: "/api/v1/coupons", method: "post", data });
  },
  update(id: string, data: CouponForm) {
    return request({ url: `/api/v1/coupons/${id}`, method: "put", data });
  },
  delete(id: string) {
    return request({ url: `/api/v1/coupons/${id}`, method: "delete" });
  },
  issue(id: string, memberIds: string[]) {
    return request({ url: `/api/v1/coupons/${id}/issue`, method: "post", data: { memberIds } });
  },
  getRecords(params: MemberCouponQuery) {
    return request<unknown, PageResult<MemberCouponRecord>>({
      url: "/api/v1/coupons/records/page",
      method: "get",
      params,
    });
  },
};

interface BasePage {
  pageNum: number;
  pageSize: number;
}

export * from "./types";
