import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  FinancialOrderRequest,
  FinancialOrderResponse,
  RejectFinancialOrderRequest,
} from '../../../core/models/order.model';
import { SpringPage } from '../../../core/models/page.model';

@Injectable({
  providedIn: 'root',
})
export class FinancialOrdersApiService {
  constructor(private http: HttpClient) {}

  list(page = 0, size = 20, status?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<SpringPage<FinancialOrderResponse>>(
      `${environment.apiUrl}/financial-orders`,
      { params },
    );
  }

  create(payload: FinancialOrderRequest) {
    return this.http.post<FinancialOrderResponse>(
      `${environment.apiUrl}/financial-orders`,
      payload,
    );
  }

  approve(id: string) {
    return this.http.post<FinancialOrderResponse>(
      `${environment.apiUrl}/financial-orders/${id}/approve`,
      {},
    );
  }

  reject(id: string, reason?: string) {
    const body: RejectFinancialOrderRequest = reason ? { reason } : {};
    return this.http.post<FinancialOrderResponse>(
      `${environment.apiUrl}/financial-orders/${id}/reject`,
      body,
    );
  }
}
