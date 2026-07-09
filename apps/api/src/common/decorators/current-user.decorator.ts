import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../types/auth-user';

/** Injects the authenticated user (set by the JWT strategy) into a handler parameter. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | AuthUser[keyof AuthUser] => {
    const user = ctx.switchToHttp().getRequest().user as AuthUser;
    return data ? user?.[data] : user;
  },
);
