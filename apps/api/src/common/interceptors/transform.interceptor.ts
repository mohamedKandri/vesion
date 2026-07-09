import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Wraps successful responses in a consistent `{ success, data }` envelope.
 * Streaming responses (SSE) and raw file downloads bypass interceptor mapping
 * because they end the response themselves.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        if (response.headersSent || data === undefined) return data;
        return { success: true as const, data };
      }),
    );
  }
}
