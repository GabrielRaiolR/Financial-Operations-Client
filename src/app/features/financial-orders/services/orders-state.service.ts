import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import { SpringPage } from '../../../core/models/page.model';
import { FinancialOrderResponse } from '../../../core/models/order.model';
import { FinancialOrdersApiService } from './financial-orders-api.service';

@Injectable({ providedIn: 'root' })
export class OrdersStateService {
  page$ = new BehaviorSubject<SpringPage<FinancialOrderResponse> | null>(null);
  loading$ = new BehaviorSubject<boolean>(false);

  constructor(private api: FinancialOrdersApiService) {}

  load(page = 0, size = 20, status?: string) {
    this.loading$.next(true);
    this.api
      .list(page, size, status)
      .pipe(finalize(() => this.loading$.next(false)))
      .subscribe((p) => this.page$.next(p));
  }
}
