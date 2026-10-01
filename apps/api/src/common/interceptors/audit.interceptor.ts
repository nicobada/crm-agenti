import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const path = request.route?.path || request.url;
    const resource = path.split('/')[2] || 'unknown';
    const resourceId = request.params?.id;

    // Non tracciare GET e health checks
    if (method === 'GET' || path.includes('health') || path.includes('auth')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user?.id,
              action: method,
              resource,
              resourceId,
              details: {
                body: this.sanitizeBody(request.body),
                path,
              },
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            },
          });
        } catch {
          // Silenzioso: non bloccare l'operazione se l'audit fallisce
        }
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '***';
    if (sanitized.passwordHash) sanitized.passwordHash = '***';
    return sanitized;
  }
}
