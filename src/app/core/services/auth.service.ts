import { Injectable } from '@angular/core';
import { BehaviorSubject, map, tap } from 'rxjs';
import { SESSION_EMAIL_KEY, SESSION_TOKEN_KEY } from '../constants/auth-session';
import { AuthApiService } from './auth-api.service';
import { LoginRequest, RegisterRequest } from '../models/auth.model';

type SessionState = {
  token: string | null;
  sub: string | null;
  email: string | null;
  companyId: string | null;
  role: 'ADMIN' | 'FINANCE' | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private stateSubject = new BehaviorSubject<SessionState>({
    token: sessionStorage.getItem(SESSION_TOKEN_KEY),
    sub: null,
    email: sessionStorage.getItem(SESSION_EMAIL_KEY),
    companyId: null,
    role: null,
  });
  state$ = this.stateSubject.asObservable();

  constructor(private api: AuthApiService) {
    const token = this.stateSubject.value.token;
    if (token) this.updateClaims(token);
  }

  login(payload: LoginRequest) {
    return this.api.login(payload).pipe(
      tap((res) => {
        const token = res.acessToken ?? res.accessToken ?? '';
        if (token) this.setSession(token, payload.email?.trim() ?? undefined);
      }),
      map((res) => res.acessToken ?? res.accessToken ?? ''),
    );
  }

  register(payload: RegisterRequest) {
    return this.api.register(payload).pipe(
      tap((res) => this.setSession(res.accessToken, res.email ?? payload.email)),
      map((res) => res.accessToken),
    );
  }

  logout() {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_EMAIL_KEY);
    this.stateSubject.next({
      token: null,
      sub: null,
      email: null,
      companyId: null,
      role: null,
    });
  }

  get token() {
    return this.stateSubject.value.token;
  }
  get role() {
    return this.stateSubject.value.role;
  }
  get sub() {
    return this.stateSubject.value.sub;
  }
  get email() {
    return this.stateSubject.value.email;
  }
  get companyId() {
    return this.stateSubject.value.companyId;
  }

  rememberDisplayEmail(email: string) {
    const e = email.trim();
    if (!e || !this.stateSubject.value.token) return;
    sessionStorage.setItem(SESSION_EMAIL_KEY, e);
    this.stateSubject.next({
      ...this.stateSubject.value,
      email: e,
    });
  }

  isAuthenticated() {
    return !!this.stateSubject.value.token;
  }

  private setSession(token: string, formEmail?: string) {
    if (!token) throw new Error('No token in response');
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    this.updateClaims(token, formEmail);
  }

  private updateClaims(token: string, formEmail?: string) {
    const payloadRaw = token.split('.')[1] ?? '';
    const payloadJson = atob(payloadRaw.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const sub = (payload['sub'] as string | undefined) ?? null;
    const fromJwt =
      (typeof payload['email'] === 'string' && payload['email']) ||
      (typeof payload['preferred_username'] === 'string' && payload['preferred_username']) ||
      null;
    const storedRaw = sessionStorage.getItem(SESSION_EMAIL_KEY);
    const stored = storedRaw?.trim() ? storedRaw.trim() : null;
    const email =
      (formEmail?.trim() ? formEmail.trim() : null) ??
      fromJwt ??
      stored ??
      (sub?.includes('@') ? sub : null);

    if (email) {
      sessionStorage.setItem(SESSION_EMAIL_KEY, email);
    } else if (!token) {
      sessionStorage.removeItem(SESSION_EMAIL_KEY);
    }

    this.stateSubject.next({
      token,
      sub,
      email,
      companyId: (payload['companyId'] as string | undefined) ?? null,
      role: (payload['role'] as 'ADMIN' | 'FINANCE' | undefined) ?? null,
    });
  }
}
