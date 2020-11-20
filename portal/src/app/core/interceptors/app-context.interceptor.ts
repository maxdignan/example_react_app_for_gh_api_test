import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, take, map, switchMap } from 'rxjs/operators';

import { UserService } from '../services/user.service';

/**
 * Automatically appends currently app context to API requests.
 */
@Injectable()
export class AppContextInterceptor implements HttpInterceptor {
  constructor(private userService: UserService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    let req$;

    if (request.params.get('appContext')) {
      req$ = this.userService.getAppContext().pipe(
        filter(app => !!app),
        take(1),
        map(app =>
          request.clone({
            setParams: { appId: app.id },
            params: request.params.delete('appContext'),
          }),
        ),
        switchMap(r => next.handle(r)),
      );
    } else {
      req$ = next.handle(request);
    }

    return req$;
  }
}
