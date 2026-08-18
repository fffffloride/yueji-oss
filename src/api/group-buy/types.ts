import type { BaseQueryParams } from "@/api/common";

export interface GroupBuyActivityQuery extends Partial<BaseQueryParams> {
  keywords?: string;
  status?: number;
}

export interface GroupBuyActivityForm {
  skuId: string;
  name: string;
  groupPrice: number;
  requiredPeople: number;
  startTime: string;
  endTime: string;
  groupDurationMinutes: number;
  status: number;
}

export interface GroupBuyActivityItem extends GroupBuyActivityForm {
  id: string;
  skuName: string;
  skuPrice: number;
  productName: string;
  productImage?: string | null;
  createTime?: string;
}

export interface GroupBuyGroupQuery extends Partial<BaseQueryParams> {
  activityId?: string;
  status?: number;
}

export interface GroupBuyGroupItem {
  id: string;
  activityId: string;
  activityName: string;
  leaderMemberId: string;
  groupPrice: number;
  requiredPeople: number;
  paidPeople: number;
  occupiedPeople: number;
  status: number;
  expireTime: string;
  successTime?: string | null;
  failTime?: string | null;
  createTime?: string;
}

export interface GroupBuyMemberItem {
  id: string;
  memberId: string;
  nickname: string;
  mobile?: string;
  orderId: string;
  orderNo?: string;
  orderStatus?: number;
  status: number;
  paidTime?: string | null;
}

export interface GroupBuyGroupDetail extends GroupBuyGroupItem {
  members: GroupBuyMemberItem[];
}
