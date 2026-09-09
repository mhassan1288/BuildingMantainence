export type MaintenanceStatus = 'PENDING' | 'PAID';
export type MaintenanceRecord = {
  id: string; apartmentId: string; month: number; year: number; amount: number | string;
  status: MaintenanceStatus; paidDate: string | null; collectedBy: string | null;
  apartmentNumber?: string; residentName?: string;
};
export type MaintenanceInput = {
  apartmentId: string; month: number; year: number; amount: number; status: MaintenanceStatus;
};
