import { api } from './api';
import { PaymentHistoryFilters, PaymentHistoryRecord } from '../types/payment';

export async function listPaymentHistory(filters: PaymentHistoryFilters = {}): Promise<PaymentHistoryRecord[]> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''));
  return (await api.get('/payment-history', { params })).data.data;
}
