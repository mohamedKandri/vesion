import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Optional authentication: attach the user when a valid token is sent
      // (lets staff see unpublished content through public endpoints), but
      // never reject anonymous visitors.
      try {
        await super.canActivate(context);
      } catch {
        // anonymous access is fine on public routes
      }
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
