import { TestBed } from '@angular/core/testing';

import { AppContextInterceptor } from './app-context.interceptor';

describe('AppContextInterceptor', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [AppContextInterceptor],
    }),
  );

  it('should be created', () => {
    const interceptor: AppContextInterceptor = TestBed.inject(
      AppContextInterceptor,
    );
    expect(interceptor).toBeTruthy();
  });
});
