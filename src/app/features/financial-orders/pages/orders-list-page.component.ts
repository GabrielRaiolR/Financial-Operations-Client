import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersStateService } from '../services/orders-state.service';
import { FinancialOrdersApiService } from '../services/financial-orders-api.service';
import { tap } from 'rxjs';
import type { FinancialOrderResponse, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-orders-list-page',
  standalone: true,
  imports: [CommonModule],
  template: `<section class="card">
    <h2>Ordens financeiras</h2>
    <button type="button" (click)="filter('PENDING')">PENDENTES</button>
    <button type="button" (click)="filter()">TODAS</button>
    <div *ngIf="state.loading$ | async">Carregando...</div>
    <table *ngIf="state.page$ | async as page">
      <tr *ngFor="let item of page.content; trackBy: trackById">
        <td>{{ item.description }}</td>
        <td>{{ item.amount }}</td>
        <td>{{ item.status }}</td>
        <td>
          <button type="button" (click)="approve(item.id)">Aprovar</button>
          <button type="button" (click)="reject(item.id)">Rejeitar</button>
        </td>
      </tr>
    </table>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersListPageComponent {
  private listStatus?: OrderStatus;

  constructor(
    public state: OrdersStateService,
    private api: FinancialOrdersApiService,
  ) {
    this.state.load(0, 20);
  }

  filter(status?: OrderStatus) {
    this.listStatus = status;
    this.state.load(0, 20, status);
  }

  approve(id: string) {
    this.api
      .approve(id)
      .pipe(tap(() => this.state.load(0, 20, this.listStatus)))
      .subscribe();
  }

  reject(id: string) {
    this.api
      .reject(id, 'Reprovando via UI')
      .pipe(tap(() => this.state.load(0, 20, this.listStatus)))
      .subscribe();
  }

  trackById(_: number, item: FinancialOrderResponse) {
    return item.id;
  }
}
