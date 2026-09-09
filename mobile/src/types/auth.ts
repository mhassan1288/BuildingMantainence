export type Role = 'ADMIN' | 'MANAGER' | 'USER';
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  apartmentId: string | null;
};
