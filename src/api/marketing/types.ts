import type { BaseQueryParams } from "@/api/common";

export interface MemberLevel {
  id: string;
  name: string;
  thresholdAmount: number;
  discountRate: number;
  status: number;
  sort: number;
}

export type MemberLevelForm = Omit<MemberLevel, "id" | "sort"> & { id?: string };

export interface PointsRule {
  earnPerYuan: number;
  redeemPointsPerYuan: number;
  maxDeductRate: number;
}

export interface PointsLog {
  id: string;
  memberId: string;
  memberNickname: string;
  memberMobile?: string;
  changePoints: number;
  balanceAfter: number;
  bizType: string;
  bizId: string;
  orderId?: string;
  remark?: string;
  createTime?: string;
}

export interface PointsLogQuery extends BaseQueryParams {
  keywords?: string;
  memberId?: string;
  bizType?: string;
  startTime?: string;
  endTime?: string;
}

export type CouponType = "FULL_REDUCTION" | "DISCOUNT" | "EXCHANGE";
export type CouponScopeType = "ALL" | "CATEGORY" | "PRODUCT";

export interface CouponItem {
  id: string;
  name: string;
  type: CouponType;
  scopeType: CouponScopeType;
  thresholdAmount: number;
  discountAmount: number;
  discountRate: number;
  maxDiscountAmount?: number | null;
  exchangeSkuId?: string | null;
  claimStart: string;
  claimEnd: string;
  validStart: string;
  validEnd: string;
  totalQuantity: number;
  issuedQuantity: number;
  perMemberLimit: number;
  status: number;
  scopeIds: string[];
  createTime?: string;
}

export type CouponForm = Omit<CouponItem, "id" | "issuedQuantity" | "createTime"> & {
  id?: string;
};

export interface CouponQuery extends BaseQueryParams {
  keywords?: string;
  type?: CouponType;
  status?: number;
}

export interface MemberCouponRecord {
  id: string;
  couponId: string;
  couponName: string;
  couponType: CouponType;
  memberId: string;
  memberNickname: string;
  memberMobile?: string;
  status: number;
  orderId?: string;
  claimedAt: string;
  usedAt?: string;
  validStart: string;
  validEnd: string;
}

export interface MemberCouponQuery extends BaseQueryParams {
  couponId?: string;
  memberId?: string;
  status?: number;
}
