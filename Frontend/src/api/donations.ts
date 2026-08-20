import { apiGet, apiPost } from "./client";
import type { Donation, DonationStats, PaginationMeta } from "../types";

export interface DonationConfig {
  paymentsEnabled: boolean;
  presets: number[];
  minAmount: number;
  maxAmount: number;
  currency: string;
}

export const getDonationConfig = () => apiGet<DonationConfig>("/donations/config");

export interface CreateOrderInput {
  amount: number;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  message?: string;
}

export interface CreateOrderResult {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  donor: { name: string; email: string; phone: string };
}

export const createOrder = (input: CreateOrderInput) =>
  apiPost<CreateOrderResult>("/donations/order", input);

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const verifyPayment = (input: VerifyPaymentInput) =>
  apiPost<{ receipt: string | null; donation: Donation }>("/donations/verify", input);

export const getDonationReceipt = (ref: string) =>
  apiGet<{ donation: Donation; amountDisplay: string }>(`/donations/receipt/${encodeURIComponent(ref)}`);

export const listDonationsAdmin = (page: number, size: number) =>
  apiGet<{ donations: Donation[]; pagination: PaginationMeta; stats: DonationStats }>(
    `/admin/donations?page=${page}&size=${size}`
  );
