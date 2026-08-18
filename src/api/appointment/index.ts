import type { PageResult } from "@/api/common";
import request from "@/utils/request";
import type { AppointmentItem, AppointmentQueryParams } from "./types";

const APPOINTMENT_BASE_URL = "/api/v1/appointments";

const AppointmentAPI = {
  getPage(queryParams: AppointmentQueryParams) {
    return request<unknown, PageResult<AppointmentItem>>({
      url: `${APPOINTMENT_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },
};

export default AppointmentAPI;
export * from "./types";
