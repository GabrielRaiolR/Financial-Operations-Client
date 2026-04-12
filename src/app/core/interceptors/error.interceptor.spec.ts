import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let logoutMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logoutMock = vi.fn();
    navigateMock = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { logout: logoutMock } },
        { provide: Router, useValue: { navigate: navigateMock } },
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should call logout and navigate to login on 401', async () => {
    const pending = firstValueFrom(http.get('/api/protected'));
    const req = httpMock.expectOne('/api/protected');
    req.flush('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
    });
    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(logoutMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should not call logout on 403', async () => {
    const pending = firstValueFrom(http.get('/api/forbidden'));
    const req = httpMock.expectOne('/api/forbidden');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    await expect(pending).rejects.toMatchObject({ status: 403 });
    expect(logoutMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
