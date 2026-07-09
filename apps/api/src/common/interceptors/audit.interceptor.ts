import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../types/auth-user';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const SENSITIVE_PATHS = [/\/auth\//];
const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'passwordHash',
  'token',
  'refreshToken',
  'code',
  'secret',
]);

/**
 * Writes an audit-trail entry for every authenticated mutating request.
 * Request bodies are recorded with sensitive fields stripped; auth endpoints
 * log the action only (handled explicitly inside AuthService).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: AuthUser }).user;

    const shouldAudit =
      MUTATING_METHODS.has(request.method) &&
      user !== undefined &&
      !SENSITIVE_PATHS.some((re) => re.test(request.path));

    if (!shouldAudit) return next.handle();

    return next.handle().pipe(
      tap(() => {
        const segments = request.path.split('/').filter(Boolean); // api, v1, resource, ...
        const resource = segments[2] ?? 'unknown';
        const entityId = segments[3] && !segments[4] ? segments[3] : segments[4] ?? null;
        void this.prisma.auditLog
          .create({
            data: {
              userId: user.id,
              action: `${resource}.${request.method.toLowerCase()}`,
              entityType: resource,
              entityId,
              metadata: this.sanitize(request.body),
              ip: request.ip,
              userAgent: request.headers['user-agent']?.slice(0, 255),
            },
          })
          .catch((err: Error) => this.logger.warn(`Audit write failed: ${err.message}`));
      }),
    );
  }

  private sanitize(body: unknown): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      clean[key] = SENSITIVE_KEYS.has(key) ? '[redacted]' : value;
    }
    return clean;
  }
}
