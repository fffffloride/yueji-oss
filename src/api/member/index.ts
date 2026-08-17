import type { PageResult } from "@/api/common";
import request from "@/utils/request";
import type { Member360, MemberItem, MemberQueryParams, MemberUpdateForm } from "./types";

const MEMBER_BASE_URL = "/api/v1/members";

const MemberAPI = {
  getPage(queryParams: MemberQueryParams) {
    return request<unknown, PageResult<MemberItem>>({
      url: `${MEMBER_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  get360(id: string) {
    return request<unknown, Member360>({
      url: `${MEMBER_BASE_URL}/${id}/360`,
      method: "get",
    });
  },

  update(id: string, data: MemberUpdateForm) {
    return request({
      url: `${MEMBER_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },
};

export default MemberAPI;
export * from "./types";
