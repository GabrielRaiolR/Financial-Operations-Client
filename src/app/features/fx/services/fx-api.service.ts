import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface FxRateResponse {
  rate: number;
  from: string;
  to: string;
  asOf: string;
  source: string;
}

@Injectable({
  providedIn: 'root',
})
export class FxApiService {
  constructor(private http: HttpClient) {}

  getRate(from: string, to: string) {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<FxRateResponse>(`${environment.apiUrl}/fx/rate`, {
      params,
    });
  }
}
