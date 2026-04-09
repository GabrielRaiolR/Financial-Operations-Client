import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = route.data['roles'] as readonly string[] | undefined;
  if (!allowed?.length) return true;
  const role = auth.role;
  if (role !== null && allowed.includes(role)) return true;
  void router.navigate(['/dashboard']);
  return false;
};
