export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "ROLE_ADMIN" | "ROLE_USER";
}

export interface EventItem {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  description: string;
  location: string | null;
  eventDate: string;
  coverImage: string | null;
  published: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export type BlogCategory = "article" | "press" | "announcement";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: BlogCategory;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string | null;
  published: boolean;
  publishedAt: string;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export type MediaType = "image" | "video";

export interface GalleryItem {
  id: number;
  title: string | null;
  caption: string | null;
  mediaType: MediaType;
  mediaUrl: string;
  eventId: number | null;
  eventTitle?: string | null;
  createdBy?: number | null;
  createdAt: string;
  updatedAt?: string;
}

export type DonationStatus = "created" | "paid" | "failed" | "refunded";

export interface Donation {
  id: number;
  receipt: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string | null;
  message: string | null;
  amount: number; // rupees (decimal)
  currency: string;
  status: DonationStatus;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DonationStats {
  totalCount: number;
  paidCount: number;
  raisedAmount: number;
}

export interface FieldErrors {
  [field: string]: string;
}

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}
