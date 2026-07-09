import { UserRole } from '@prisma/client';

/** Shape attached to `request.user` after JWT validation. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  firstName: string;
  lastName: string;
}
