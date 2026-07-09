import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorBody {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * Normalizes every thrown error into a consistent JSON envelope and maps
 * common Prisma errors to meaningful HTTP statuses without leaking internals.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const rec = body as Record<string, unknown>;
        message = (rec.message as string | string[]) ?? exception.message;
        error = (rec.error as string) ?? exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          error = 'Conflict';
          message = 'A record with this value already exists';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          error = 'Not Found';
          message = 'The requested record was not found';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          message = 'Related record does not exist';
          break;
        default:
          this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    const body: ErrorBody = {
      success: false,
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
