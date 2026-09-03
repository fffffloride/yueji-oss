import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type {
  OrderDetail,
  OrderListItem,
  OrderQueryParams,
  PaymentInfo,
  RefundInfo,
} from "./types";

const ORDER_BASE_URL = "/api/v1/orders";

const OrderAPI = {
  getPage(queryParams?: OrderQueryParams) {
    return request<unknown, PageResult<OrderListItem>>({
      url: `${ORDER_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  getDetail(id: string) {
    return request<unknown, OrderDetail>({
      url: `${ORDER_BASE_URL}/${id}`,
      method: "get",
    });
  },

  verifyById(id: string) {
    return request<unknown, OrderDetail>({
      url: `${ORDER_BASE_URL}/${id}/verify`,
      method: "post",
    });
  },

  verifyByCode(verifyCode: string) {
    return request<unknown, OrderDetail>({
      url: `${ORDER_BASE_URL}/verify`,
      method: "post",
      data: { verifyCode },
    });
  },

  getPayment(orderId: string) {
    return request<unknown, PaymentInfo>({
      url: `/api/v1/payments/order/${orderId}`,
      method: "get",
    });
  },

  refund(paymentNo: string, reason: string) {
    return request<unknown, RefundInfo>({
      url: `/api/v1/payments/${paymentNo}/refund`,
      method: "post",
      data: { reason },
    });
  },

  export(queryParams?: OrderQueryParams) {
    return request({
      url: `${ORDER_BASE_URL}/export`,
      method: "get",
      params: queryParams,
      responseType: "blob",
    });
  },
};

export default OrderAPI;
export * from "./types";
