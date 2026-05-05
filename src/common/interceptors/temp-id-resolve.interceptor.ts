import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TempIdMappingsService } from '../temp-id-mappings/temp-id-mappings.service';

/**
 * Resolves temp-X IDs in request body, query, and params to server IDs
 * before validation/controllers run. Enables offline-first flows where
 * clients send temp IDs that were later synced to the server.
 */
@Injectable()
export class TempIdResolveInterceptor implements NestInterceptor {
  constructor(private readonly tempIdMappingsService: TempIdMappingsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return from(
      Promise.all([
        this.tempIdMappingsService.resolvePayload(request.body),
        this.tempIdMappingsService.resolvePayload(request.query),
        this.tempIdMappingsService.resolvePayload(request.params),
      ]),
    ).pipe(
      switchMap(([body, query, params]) => {
        if (body != null && typeof body === 'object') {
          Object.keys(request.body || {}).forEach(
            (k) => delete request.body[k],
          );
          Object.assign(request.body, body);
        }
        if (query != null && typeof query === 'object') {
          Object.keys(request.query || {}).forEach(
            (k) => delete request.query[k],
          );
          Object.assign(request.query, query);
        }
        if (params != null && typeof params === 'object') {
          Object.keys(request.params || {}).forEach(
            (k) => delete request.params[k],
          );
          Object.assign(request.params, params);
        }
        return next.handle();
      }),
    );
  }
}
