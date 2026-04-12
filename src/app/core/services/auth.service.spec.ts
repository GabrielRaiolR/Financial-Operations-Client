import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthApiService } from './auth-api.service';
import { environment } from '../../../environments/environment';
import { SESSION_TOKEN_KEY } from '../constants/auth-session';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesig`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService, AuthApiService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login deve salvar o token no sessionStorage', () => {
    const token = fakeJwt({
      sub: 'user@test.com',
      role: 'ADMIN',
      companyId: 'c1',
    });

    service.login({ email: 'user@test.com', password: '123456' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({
      acessToken: token,
      tokenType: 'Bearer',
      expiresInMinutes: 60,
    });

    expect(service.token).toBe(token);
    expect(sessionStorage.getItem(SESSION_TOKEN_KEY)).toBe(token);
  });

  it('logout deve limpar token e sessionStorage', () => {
    const token = fakeJwt({ sub: 'u', role: 'ADMIN', companyId: 'c' });
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);

    service.logout();

    expect(service.token).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_TOKEN_KEY)).toBeNull();
  });

  it('role deve ser extraída do JWT', () => {
    const token = fakeJwt({ sub: 'u', role: 'FINANCE', companyId: 'c' });

    service.login({ email: 'u@t.com', password: 'x' }).subscribe();
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ acessToken: token, tokenType: 'Bearer', expiresInMinutes: 60 });

    expect(service.role).toBe('FINANCE');
  });
});
