export type ApartmentStatus = 'ACTIVE' | 'INACTIVE';

export interface Apartment {
  id: string;
  apartmentNumber: string;
  floor: number;
  residentName: string;
  contactNumber: string | null;
  email: string | null;
  monthlyFee: number | string;
  status: ApartmentStatus;
  notes: string | null;
}

export type ApartmentInput = Omit<Apartment, 'id'>;
