import type { BaseQueryParams } from "@/api/common";

/** 商品分类树节点 */
export interface CategoryNode {
  id: string;
  name: string;
  parentId: string;
  level: number;
  icon?: string | null;
  sort: number;
  status: number;
  children?: CategoryNode[];
}

/** 商品分类表单 */
export interface CategoryForm {
  id?: string;
  name?: string;
  parentId?: string;
  icon?: string;
  sort?: number;
  status?: number;
}

/** 商品分页查询参数 */
export interface ProductQueryParams extends Partial<BaseQueryParams> {
  keywords?: string;
  categoryId?: string;
  status?: number;
}

/** 商品列表项 */
export interface ProductItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  subTitle?: string;
  mainImage?: string;
  tags?: string;
  painFriendly?: boolean;
  /** 现售价(分) */
  price: number;
  /** 原价(分) */
  originalPrice?: number;
  sales: number;
  stock: number;
  status: number;
  sort: number;
  createTime?: string;
}

/** SKU 表单项 */
export interface SkuForm {
  id?: string;
  name: string;
  specs?: string;
  skuCode?: string;
  /** 售价(分) */
  price: number;
  /** 原价(分) */
  originalPrice?: number;
  stock: number;
  status?: number;
}

export interface SkuOption {
  id: string;
  productId: string;
  label: string;
  price: number;
}

/** 商品表单 */
export interface ProductForm {
  id?: string;
  name?: string;
  categoryId?: string;
  subTitle?: string;
  mainImage?: string;
  album?: string[];
  videoUrl?: string;
  tags?: string;
  painFriendly?: boolean;
  /** 原价(分) */
  originalPrice?: number;
  detail?: string;
  usageNote?: string;
  status?: number;
  sort?: number;
  skus: SkuForm[];
}
