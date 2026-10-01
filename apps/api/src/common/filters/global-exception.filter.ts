import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Si è verificato un errore interno del server';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errorCode = this.getErrorCodeFromStatus(status);
      } else if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, any>;
        message = errorObj.message || exception.message;
        errorCode = errorObj.error || this.getErrorCodeFromStatus(status);
        if (Array.isArray(errorObj.message)) {
          details = errorObj.message;
          message = 'Errore di validazione dei dati inviati';
          errorCode = 'VALIDATION_ERROR';
        }
      }
    } else if (this.isPrismaError(exception)) {
      // Gestione specifica errori Prisma
      const prismaError = exception as { code: string; meta?: any; message: string };
      switch (prismaError.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          errorCode = 'DUPLICATE_ENTRY';
          message = `Un record con questo valore univoco esiste già (${prismaError.meta?.target || 'campo duplicato'}).`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          errorCode = 'NOT_FOUND';
          message = 'La risorsa richiesta non è stata trovata.';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          errorCode = 'FOREIGN_KEY_VIOLATION';
          message = 'Operazione non consentita a causa di relazioni vincolate con altri record.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          errorCode = `PRISMA_${prismaError.code}`;
          message = 'Errore durante l operazione sul database.';
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      message = process.env.NODE_ENV === 'production' ? 'Errore interno' : exception.message;
    }

    // Costruzione risposta standardizzata
    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private isPrismaError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as any).code === 'string' &&
      (error as any).code.startsWith('P')
    );
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'HTTP_ERROR';
    }
  }
}
