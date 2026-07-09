import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given roles. ADMIN always passes. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
