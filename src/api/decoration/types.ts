import type { BaseQueryParams } from "@/api/common";

export interface DecorationQuery extends BaseQueryParams {
  keywords?: string;
  status?: number;
}

export interface BannerItem {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
  sort: number;
  status: number;
  createTime?: string;
}

export interface BannerForm {
  imageUrl: string;
  linkUrl?: string;
  sort?: number;
  status: number;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  sort: number;
  status: number;
  createTime?: string;
}

export type NoticeForm = Omit<NoticeItem, "id" | "createTime" | "sort"> & { sort?: number };

export interface BrandForm {
  id?: string;
  content: string;
}

export interface HomeCard {
  title: string;
  imageUrl: string;
  content: string;
}

export interface HomeCardsForm {
  cards: HomeCard[];
}

export interface PromoCard extends Pick<HomeCard, "title" | "imageUrl"> {
  linkUrl: string;
}

export interface PromoCardsForm {
  cards: PromoCard[];
}
