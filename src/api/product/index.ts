import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type {
  CategoryNode,
  CategoryForm,
  ProductQueryParams,
  ProductItem,
  ProductForm,
} from "./types";

const CATEGORY_BASE_URL = "/api/v1/product-categories";
const PRODUCT_BASE_URL = "/api/v1/products";

export const ProductCategoryAPI = {
  /** 分类树 */
  getTree() {
    return request<unknown, CategoryNode[]>({ url: `${CATEGORY_BASE_URL}/tree`, method: "get" });
  },
  /** 新增分类 */
  create(data: CategoryForm) {
    return request({ url: CATEGORY_BASE_URL, method: "post", data });
  },
  /** 修改分类 */
  update(id: string, data: CategoryForm) {
    return request({ url: `${CATEGORY_BASE_URL}/${id}`, method: "put", data });
  },
  /** 删除分类 */
  deleteById(id: string) {
    return request({ url: `${CATEGORY_BASE_URL}/${id}`, method: "delete" });
  },
};

export const ProductAPI = {
  /** 商品分页列表 */
  getPage(params: ProductQueryParams) {
    return request<unknown, PageResult<ProductItem>>({
      url: `${PRODUCT_BASE_URL}/page`,
      method: "get",
      params,
    });
  },
  /** 商品表单数据（含SKU） */
  getFormData(id: string) {
    return request<unknown, ProductForm>({ url: `${PRODUCT_BASE_URL}/${id}/form`, method: "get" });
  },
  /** 新增商品 */
  create(data: ProductForm) {
    return request({ url: PRODUCT_BASE_URL, method: "post", data });
  },
  /** 修改商品 */
  update(id: string, data: ProductForm) {
    return request({ url: `${PRODUCT_BASE_URL}/${id}`, method: "put", data });
  },
  /** 上下架 */
  updateStatus(id: string, status: number) {
    return request({ url: `${PRODUCT_BASE_URL}/${id}/status`, method: "patch", data: { status } });
  },
  /** 删除商品 */
  deleteById(id: string) {
    return request({ url: `${PRODUCT_BASE_URL}/${id}`, method: "delete" });
  },
};

// 重导出类型
export * from "./types";
