import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { SpringPage } from '../../../core/models/page.model';

export interface UserResponse {
  id: string;
  email: string;
  role: 'ADMIN' | 'FINANCE';
  companyId: string;
  active: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: 'ADMIN' | 'FINANCE';
}

export interface UpdateUserRequest {
  email?: string;
  role?: 'ADMIN' | 'FINANCE';
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private http: HttpClient) {}

  list(page = 0, size = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<SpringPage<UserResponse>>(`${environment.apiUrl}/users`, { params });
  }

  getById(id: string) {
    return this.http.get<UserResponse>(`${environment.apiUrl}/users/${id}`);
  }

  create(payload: CreateUserRequest) {
    return this.http.post<UserResponse>(`${environment.apiUrl}/users`, payload);
  }

  patch(id: string, payload: UpdateUserRequest) {
    return this.http.patch<UserResponse>(`${environment.apiUrl}/users/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<void>(`${environment.apiUrl}/users/${id}`);
  }
}
