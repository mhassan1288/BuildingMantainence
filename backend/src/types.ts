export type Role = 'ADMIN' | 'MANAGER' | 'USER';
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  apartmentId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
