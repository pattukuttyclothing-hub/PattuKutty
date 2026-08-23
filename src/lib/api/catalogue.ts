import { apiFetch } from "./client";
import type { Category, Product } from "@/data/boutique";

export interface Testimonial {
  id: string;
  name: string;
  initials?: string;
  rating: number;
  quote: string;
}

export interface HeroBanner {
  id: string;
  image_url: string;
  desktop_image_url?: string;
  tablet_image_url?: string;
  mobile_image_url?: string;
  cta_label?: string;
  cta_link?: string;
  position?: number;
  is_active?: boolean;
}

export interface ReelItem {
  id: string;
  title: string;
  video_url: string;
  poster_url?: string;
  products: Product[];
}

export async function fetchHeroBanners(): Promise<HeroBanner[]> {
  const res = await apiFetch<any>("/storefront/hero-banners");
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await apiFetch<any>("/storefront/categories");
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const res = await apiFetch<any>("/storefront/featured");
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export async function fetchReels(): Promise<ReelItem[]> {
  const res = await apiFetch<any>("/storefront/reels");
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const res = await apiFetch<any>("/storefront/testimonials");
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export async function fetchProductsBySubCategory(categoryId: string, subCategoryId: string): Promise<Product[]> {
  const res = await apiFetch<any>(`/storefront/products?category=${categoryId}&sub=${subCategoryId}`);
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  const res = await apiFetch<any>(`/storefront/products/${id}`);
  if (res && res.data) return res.data;
  if (res && res.id) return res;
  return undefined;
}
