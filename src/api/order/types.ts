import type { BaseQueryParams } from "@/api/common";

export interface OrderQueryParams extends BaseQueryParams {
  keywords?: string;
  status?: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  skuId: string;
  productName: string;
  productImage?: string | null;
  skuName?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderListItem {
  id: string;
  orderNo: string;
  memberId: string;
  status: number;
  statusLabel: string;
  totalAmount: number;
  discountAmount: number;
  payAmount: number;
  payType?: number | null;
  payTime?: string | null;
  createTime?: string;
  contactName?: string | null;
  contactMobile?: string | null;
  memberNickname?: string;
  memberMobile?: string;
}

export interface OrderDetail extends OrderListItem {
  remark?: string | null;
  verifyCode?: string | null;
  verifyTime?: string | null;
  verifyBy?: string | null;
  cancelTime?: string | null;
  cancelReason?: string | null;
  items: OrderItem[];
  pricing: {
    totalAmount: number;
    memberLevelId?: string | null;
    memberDiscount: number;
    memberCouponId?: string | null;
    couponAmount: number;
    pointsUsed: number;
    pointsDeduct: number;
    discountAmount: number;
    payAmount: number;
  };
}

export interface PaymentInfo {
  paymentNo: string;
  orderId: string;
  amount: number;
  channel: string;
  status: number;
  thirdPartyNo?: string | null;
  paidTime?: string | null;
}

export interface RefundInfo {
  refundNo: string;
  status: 0 | 1 | 2 | 3 | 4;
}
