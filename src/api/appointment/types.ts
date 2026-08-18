import type { BaseQueryParams } from "@/api/common";

export interface AppointmentQueryParams extends BaseQueryParams {
  keywords?: string;
  appointmentDate?: string;
}

export interface AppointmentItem {
  id: string;
  memberId: string;
  memberNickname?: string | null;
  memberMobile?: string | null;
  appointmentDate: string;
  appointmentTime: string;
  createTime?: string | null;
}
