import type { BaseQueryParams } from "@/api/common";
import type { OrderListItem } from "@/api/order/types";

export interface MemberQueryParams extends BaseQueryParams {
  keywords?: string;
  status?: number;
}

export interface MemberItem {
  id: string;
  nickname: string;
  avatar?: string | null;
  mobile?: string | null;
  gender: number;
  status: number;
  points: number;
  levelId?: string | null;
  levelName?: string;
  totalSpent: number;
  lastLoginTime?: string | null;
  createTime?: string;
  tags?: string | null;
  remark?: string | null;
}

export interface MemberStats {
  orderCount: number;
  totalPaid: number;
  avgPaid: number;
  statusCounts: Record<number, number>;
}

export interface Member360 {
  profile: MemberItem;
  stats: MemberStats;
  recentOrders: OrderListItem[];
}

export interface MemberUpdateForm {
  tags?: string;
  remark?: string;
}
