import request from "@/utils/request";
import type { DashboardOverview } from "./types";

const DashboardAPI = {
  getOverview(days: 7 | 30) {
    return request<unknown, DashboardOverview>({
      url: "/api/v1/dashboard/overview",
      method: "get",
      params: { days },
    });
  },
};

export default DashboardAPI;
export * from "./types";
