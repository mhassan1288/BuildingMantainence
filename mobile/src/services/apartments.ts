import { api } from './api';
import { Apartment, ApartmentInput } from '../types/apartment';

export async function listApartments(): Promise<Apartment[]> {
  return (await api.get('/apartments')).data.data;
}

export async function createApartment(input: ApartmentInput): Promise<Apartment> {
  return (await api.post('/apartments', input)).data.data;
}

export async function updateApartment(id: string, input: Partial<ApartmentInput>): Promise<Apartment> {
  return (await api.patch(`/apartments/${id}`, input)).data.data;
}

export async function deleteApartment(id: string): Promise<void> {
  await api.delete(`/apartments/${id}`);
}
