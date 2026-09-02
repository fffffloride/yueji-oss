import type { BaseQueryParams } from "@/api/common";

export const AppointmentStatus = {
  BOOKED: 0,
  COMPLETED: 1,
  CANCELLED: 2,
} as const;

export type AppointmentStatusValue = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AppointmentTab = {
  PENDING_BOOKING: "PENDING_BOOKING",
  PENDING_ARRIVAL: "PENDING_ARRIVAL",
  SERVICE_RECORD: "SERVICE_RECORD",
  CANCELLED: "CANCELLED",
} as const;

export type AppointmentTabValue = (typeof AppointmentTab)[keyof typeof AppointmentTab];
export type AppointmentSceneType = "CONSULTATION" | "ORDER";

export interface AppointmentQueryParams extends BaseQueryParams {
  tab?: AppointmentTabValue;
  keywords?: string;
  sceneType?: AppointmentSceneType;
  startDate?: string;
  endDate?: string;
  orderNo?: string;
}

export interface AppointmentItem {
  id?: string | null;
  appointmentId?: string | null;
  memberId: string;
  memberNickname?: string | null;
  memberMobile?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  sceneType: AppointmentSceneType;
  orderId?: string | null;
  orderNo?: string | null;
  productNames: string[];
  status?: AppointmentStatusValue | null;
  completeTime?: string | null;
  cancelTime?: string | null;
  cancelReason?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
  lastChangedAt?: string | null;
  occupiesCapacity?: boolean;
  canBook: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  canComplete: boolean;
}

export interface AppointmentSummary {
  pendingBooking: number;
  pendingArrival: number;
  serviceRecord: number;
  cancelled: number;
}

export type AppointmentOperationAction = "CREATE" | "RESCHEDULE" | "CANCEL" | "COMPLETE";
export type AppointmentOperatorType = "MEMBER" | "ADMIN" | "SYSTEM";

export interface AppointmentOperationLog {
  id: string;
  action: AppointmentOperationAction;
  operatorType: AppointmentOperatorType;
  operatorId?: string | null;
  beforeDate?: string | null;
  beforeTime?: string | null;
  afterDate?: string | null;
  afterTime?: string | null;
  reason?: string | null;
  createTime: string;
}

export interface AppointmentDetail extends AppointmentItem {
  operationLogs: AppointmentOperationLog[];
}

export interface AppointmentSlot {
  time: string;
  bookedCount: number;
  capacity: number;
  availableCapacity: number;
  remainingCount: number;
  full: boolean;
  available: boolean;
}

export interface AppointmentRescheduleForm {
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}

export interface AppointmentCancelForm {
  reason?: string;
}

export interface AppointmentConfig {
  slotCapacity: number;
}
