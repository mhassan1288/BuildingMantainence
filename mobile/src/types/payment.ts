export type PaymentStatus = 'PENDING' | 'PAID';
export type PaymentHistoryRecord = {
  id: string;
  apartmentId: string;
  apartmentNumber: string;
  residentName: string;
  month: number;
  year: number;
  amount: number | string;
  status: PaymentStatus;
  paidDate: string | null;
  collectedBy: string | null;
  collectorName: string | null;
  createdAt: string;
};
export type PaymentHistoryFilters = {
  month?: number;
  year?: number;
  status?: PaymentStatus;
  apartmentId?: string;
  limit?: number;
};
