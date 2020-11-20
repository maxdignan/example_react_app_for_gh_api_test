import { HttpRequest } from '@angular/common/http';
import { environment } from 'environments/environment';
import { APIInterceptor } from './api.interceptor';

describe('api interceptor', () => {
  let interceptor: APIInterceptor;

  beforeEach(() => (interceptor = new APIInterceptor()));

  it('adds api base to the url', () => {
    const req = new HttpRequest('GET', 'foo');
    const mockNext = { handle: jest.fn().mockReturnThis() };
    const res = interceptor.intercept(req, mockNext as any);
    expect(res).toBeDefined();
    const lastCall = mockNext.handle.mock.calls[0][0];
    expect(lastCall.url).toContain(environment.apiBase);
  });
});
