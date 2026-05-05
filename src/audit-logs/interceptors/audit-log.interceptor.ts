import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../audit-logs.service';
import { AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, params, user } = request;

    // Determine the action based on HTTP method
    const action = this.getActionFromMethod(method);

    // Extract entity name from the URL
    const entity = this.extractEntityFromUrl(url);

    // Get entity ID from params if available
    const entityId = params?.id || null;

    // Get IP address and user agent
    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          // Log the action after successful response
          this.auditLogsService
            .create({
              userId: user?.id || null,
              action,
              entity,
              entityId: entityId || responseData?.id || null,
              changes: this.sanitizeBody(body, method),
              endpoint: url,
              method,
              ipAddress,
              userAgent,
              statusCode: response.statusCode,
              metadata: {
                params,
                responseId: responseData?.id,
              },
            })
            .catch((error) => {
              // Log error but don't fail the request
              console.error('Failed to create audit log:', error);
            });
        },
        error: (error) => {
          // Log failed attempts too
          this.auditLogsService
            .create({
              userId: user?.id || null,
              action,
              entity,
              entityId,
              changes: this.sanitizeBody(body, method),
              endpoint: url,
              method,
              ipAddress,
              userAgent,
              statusCode: error.status || 500,
              metadata: {
                params,
                error: error.message,
              },
            })
            .catch((err) => {
              console.error('Failed to create audit log:', err);
            });
        },
      }),
    );
  }

  private getActionFromMethod(method: string): AuditAction {
    switch (method.toUpperCase()) {
      case 'POST':
        return AuditAction.CREATE;
      case 'GET':
        return AuditAction.READ;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.OTHER;
    }
  }

  private extractEntityFromUrl(url: string): string {
    // Remove query params
    const pathOnly = url.split('?')[0];
    // Split by '/' and get the first meaningful segment
    const segments = pathOnly.split('/').filter(Boolean);

    if (segments.length > 0) {
      // Return the first segment (e.g., 'users', 'products', 'stores')
      // Handle 'admin' prefix
      if (segments[0] === 'admin' && segments.length > 1) {
        return segments[1];
      }
      return segments[0];
    }

    return 'unknown';
  }

  private sanitizeBody(body: any, method: string): Record<string, any> | null {
    if (!body || method === 'GET' || method === 'DELETE') {
      return null;
    }

    // Create a copy to avoid mutating the original
    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'secret',
      'apiKey',
      'otp',
      'code',
    ];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
