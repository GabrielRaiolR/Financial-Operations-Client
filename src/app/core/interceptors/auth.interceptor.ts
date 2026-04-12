import { HttpInterceptorFn } from '@angular/common/http';
import { SESSION_TOKEN_KEY } from '../constants/auth-session';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    return next(req);
  }
  const url = req.url.toLowerCase();
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
