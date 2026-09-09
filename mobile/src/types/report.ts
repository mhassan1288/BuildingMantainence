export type ReportStatus = 'PENDING' | 'PAID' | 'MISSING';
export type Report = {
  month: number; year: number; recordCount: number;
  expectedCollection: number; collected: number; pending: number;
  statusBreakdown: { status: ReportStatus; count: number; amount: number }[];
  apartmentBreakdown: { id: string; apartmentNumber: string; residentName: string; status: ReportStatus; amount: number }[];
};
