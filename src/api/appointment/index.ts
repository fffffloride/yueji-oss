import type { PageResult } from "@/api/common";
import request from "@/utils/request";
import type { AppointmentConfig, AppointmentItem, AppointmentQueryParams } from "./types";

const APPOINTMENT_BASE_URL = "/api/v1/appointments";

const AppointmentAPI = {
  getPage(queryParams: AppointmentQueryParams) {
    return request<unknown, PageResult<AppointmentItem>>({
      url: `${APPOINTMENT_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  getCalendar(month: string) {
    return request<unknown, AppointmentItem[]>({
      url: `${APPOINTMENT_BASE_URL}/calendar`,
      method: "get",
      params: { month },
    });
  },

  getConfig() {
    return request<unknown, AppointmentConfig>({
      url: `${APPOINTMENT_BASE_URL}/config`,
      method: "get",
    });
  },

  updateConfig(data: AppointmentConfig) {
    return request<unknown, AppointmentConfig>({
      url: `${APPOINTMENT_BASE_URL}/config`,
      method: "put",
      data,
    });
  },
};

export default AppointmentAPI;
export * from "./types";
