import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private http: HttpClient) {}

  login(payload: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload);
  }

  register(payload: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, payload);
  }
}
