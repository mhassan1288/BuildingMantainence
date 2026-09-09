import { api } from './api';
import { DashboardSummary, ResidentDashboard } from '../types/dashboard';

export async function getDashboardSummary(month?: number, year?: number): Promise<DashboardSummary> {
  const params = month && year ? { month, year } : undefined;
  return (await api.get('/dashboard/summary', { params })).data.data;
}

export async function getResidentDashboard(): Promise<ResidentDashboard> {
  return (await api.get('/dashboard/resident')).data.data;
}
