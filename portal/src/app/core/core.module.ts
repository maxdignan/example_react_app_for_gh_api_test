import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { UserHttpService } from './services/user-http.service';
import { ModalService } from './services/modal.service';
import { APIInterceptor } from './interceptors/api.interceptor';
import { JWTInterceptor } from './interceptors/jwt.interceptor';
import { AppContextInterceptor } from './interceptors/app-context.interceptor';

export * from './services/auth.service';
export * from './services/modal.service';
export * from './services/user-http.service';
export * from './services/user.service';
export * from './interceptors/api.interceptor';
export * from './interceptors/jwt.interceptor';
export * from './interceptors/app-context.interceptor';

@NgModule({
  imports: [CommonModule],
  providers: [
    AuthService,
    UserService,
    UserHttpService,
    ModalService,
    APIInterceptor,
    JWTInterceptor,
    AppContextInterceptor,
  ],
})
export class CoreModule {}
