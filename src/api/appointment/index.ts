import type { PageResult } from "@/api/common";
import request from "@/utils/request";
import type {
  AppointmentCancelForm,
  AppointmentConfig,
  AppointmentDetail,
  AppointmentItem,
  AppointmentQueryParams,
  AppointmentRescheduleForm,
  AppointmentSlot,
  AppointmentSummary,
} from "./types";

const APPOINTMENT_BASE_URL = "/api/v1/appointments";

const AppointmentAPI = {
  getSummary() {
    return request<unknown, AppointmentSummary>({
      url: `${APPOINTMENT_BASE_URL}/summary`,
      method: "get",
    });
  },

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

  getSlots(appointmentDate: string) {
    return request<unknown, AppointmentSlot[]>({
      url: `${APPOINTMENT_BASE_URL}/slots`,
      method: "get",
      params: { appointmentDate },
    });
  },

  getDetail(id: string) {
    return request<unknown, AppointmentDetail>({
      url: `${APPOINTMENT_BASE_URL}/${id}`,
      method: "get",
    });
  },

  reschedule(id: string, data: AppointmentRescheduleForm) {
    return request<unknown, AppointmentDetail>({
      url: `${APPOINTMENT_BASE_URL}/${id}/reschedule`,
      method: "put",
      data,
    });
  },

  cancel(id: string, data: AppointmentCancelForm) {
    return request<unknown, AppointmentDetail>({
      url: `${APPOINTMENT_BASE_URL}/${id}/cancel`,
      method: "post",
      data,
    });
  },

  complete(id: string) {
    return request<unknown, AppointmentDetail>({
      url: `${APPOINTMENT_BASE_URL}/${id}/complete`,
      method: "post",
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
