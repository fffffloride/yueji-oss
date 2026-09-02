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
  sceneType: "CONSULTATION" | "ORDER";
  orderId?: string | null;
  orderNo?: string | null;
  productNames: string[];
  createTime?: string | null;
}

export interface AppointmentConfig {
  slotCapacity: number;
}
