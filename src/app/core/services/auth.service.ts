import { Injectable } from '@angular/core';
import { BehaviorSubject, map, tap } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { LoginRequest, RegisterRequest } from '../models/auth.model';

type SessionState = {
  token: string | null;
  sub: string | null;
  companyId: string | null;
  role: 'ADMIN' | 'FINANCE' | null;
};

const STORAGE_KEY = 'finops.session.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private stateSubject = new BehaviorSubject<SessionState>({
    token: sessionStorage.getItem(STORAGE_KEY),
    sub: null,
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
      map((res) => res.acessToken ?? res.accessToken ?? ''),
      tap((token) => this.setSession(token)),
    );
  }

  register(payload: RegisterRequest) {
    return this.api.register(payload).pipe(
      map((res) => res.accessToken),
      tap((token) => this.setSession(token)),
    );
  }

  logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    this.stateSubject.next({ token: null, sub: null, companyId: null, role: null });
  }

  get token() {
    return this.stateSubject.value.token;
  }
  get role() {
    return this.stateSubject.value.role;
  }
  isAuthenticated() {
    return !!this.stateSubject.value.token;
  }

  private setSession(token: string) {
    if (!token) throw new Error('Token ausente na resposta');
    sessionStorage.setItem(STORAGE_KEY, token);
    this.updateClaims(token);
  }

  private updateClaims(token: string) {
    const payloadRaw = token.split('.')[1] ?? '';
    const payloadJson = atob(payloadRaw.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    this.stateSubject.next({
      token,
      sub: payload.sub ?? null,
      companyId: payload.companyId ?? null,
      role: payload.role ?? null,
    });
  }
}
