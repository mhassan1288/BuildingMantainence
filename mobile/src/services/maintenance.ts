import { api } from './api';
import { MaintenanceInput, MaintenanceRecord } from '../types/maintenance';
export async function listMaintenance(): Promise<MaintenanceRecord[]> {
  return (await api.get('/maintenance-fees')).data.data;
}
export async function createMaintenance(input: MaintenanceInput): Promise<MaintenanceRecord> {
  return (await api.post('/maintenance-fees', input)).data.data;
}
export async function updateMaintenance(id: string, input: Partial<MaintenanceInput>): Promise<MaintenanceRecord> {
  return (await api.patch(`/maintenance-fees/${id}`, input)).data.data;
}
export async function deleteMaintenance(id: string): Promise<void> { await api.delete(`/maintenance-fees/${id}`); }
export async function setMaintenancePaymentStatus(id: string, status: MaintenanceRecord['status']): Promise<MaintenanceRecord> {
  return (await api.post(`/maintenance-fees/${id}/payment-status`, { status })).data.data;
}
