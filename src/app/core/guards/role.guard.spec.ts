import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

/** Mock mínimo: o guard só usa `auth.role` e `router.navigate`. */
describe('roleGuard', () => {
  let authMock: { role: 'ADMIN' | 'FINANCE' | null };
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigateMock = vi.fn();
    authMock = { role: 'ADMIN' };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: { navigate: navigateMock } },
      ],
    });
  });

  function runGuard(roles: string[]): boolean {
    const route = { data: { roles } } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(
      () => roleGuard(route, {} as any) as boolean,
    );
  }

  it('deve permitir ADMIN quando roles inclui ADMIN', () => {
    authMock.role = 'ADMIN';
    expect(runGuard(['ADMIN'])).toBe(true);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('deve bloquear FINANCE quando roles só inclui ADMIN', () => {
    authMock.role = 'FINANCE';
    expect(runGuard(['ADMIN'])).toBe(false);
    expect(navigateMock).toHaveBeenCalledWith(['/dashboard']);
  });

  it('deve permitir qualquer role quando roles não está definido', () => {
    const route = { data: {} } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(
      () => roleGuard(route, {} as any) as boolean,
    );
    expect(result).toBe(true);
  });
});
