import { api } from './api';
import { Report } from '../types/report';

export async function getReport(month?: number, year?: number): Promise<Report> {
  const params = month && year ? { month, year } : undefined;
  return (await api.get('/reports', { params })).data.data;
}
