import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authMock: { isAuthenticated: ReturnType<typeof vi.fn> };
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigateMock = vi.fn();
    authMock = { isAuthenticated: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: { navigate: navigateMock } },
      ],
    });
  });

  it('should allow activation when authenticated', () => {
    authMock.isAuthenticated.mockReturnValue(true);
    const ok = TestBed.runInInjectionContext(
      () => authGuard({} as any, {} as any) as boolean,
    );
    expect(ok).toBe(true);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('should block and redirect to login when not authenticated', () => {
    authMock.isAuthenticated.mockReturnValue(false);
    const ok = TestBed.runInInjectionContext(
      () => authGuard({} as any, {} as any) as boolean,
    );
    expect(ok).toBe(false);
    expect(navigateMock).toHaveBeenCalledWith(['/auth/login']);
  });
});
