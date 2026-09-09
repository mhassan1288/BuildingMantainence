export type DashboardSummary = {
  month: number;
  year: number;
  totalApartments: number;
  expectedCollection: number;
  collected: number;
  pending: number;
};

export type ResidentDashboard = {
  month: number;
  year: number;
  apartment: {
    id: string;
    apartmentNumber: string;
    floor: number;
    residentName: string;
    contactNumber: string | null;
    email: string | null;
    monthlyFee: number;
    status: 'ACTIVE' | 'INACTIVE';
  };
  currentMonth: {
    amount: number | null;
    status: 'PENDING' | 'PAID';
    paidDate: string | null;
  };
  totalPaid: number;
  totalPending: number;
};
