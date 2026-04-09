import { HttpInterceptorFn } from '@angular/common/http';
import { AUTH_SESSION_KEY } from '../constants/auth-session';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!token) {
    return next(req);
  }
  // Opcional: não enviar Bearer em login/register (evita token antigo).
  const url = req.url.toLowerCase();
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
