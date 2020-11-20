import { HttpRequest } from '@angular/common/http';
import { JWTInterceptor } from './jwt.interceptor';

describe('jwt interceptor', () => {
  let interceptor: JWTInterceptor;

  beforeEach(
    () =>
      (interceptor = new JWTInterceptor({
        token: 'test-token',
      } as any)),
  );

  it('adds an `x-access-token` header if header is present', () => {
    const req = new HttpRequest('GET', 'foo');
    const mockNext = { handle: jest.fn().mockReturnThis() };
    const res = interceptor.intercept(req, mockNext as any);
    expect(res).toBeDefined();
    const lastCall = mockNext.handle.mock.calls[0][0];
    expect(lastCall.headers.get('x-access-token')).toBe('test-token');
  });
});
