import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FinancialOrdersApiService } from '../../financial-orders/services/financial-orders-api.service';
import { FxApiService, FxRateResponse } from '../../fx/services/fx-api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { OrderStatus } from '../../../core/models/order.model';

interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section style="max-width: 900px; margin: 40px auto; padding: 0 16px;">
      <h1 style="color: var(--color-primary); margin-bottom: 8px;">Dashboard</h1>
      <p style="color: var(--color-text-muted); margin-bottom: 24px;">
        Bem-vindo de volta. Aqui tens um resumo das operações financeiras.
      </p>

      <!-- Cards de resumo -->
      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;"
      >
        <div class="card" style="text-align: center;" *ngIf="stats$ | async as stats">
          <p style="font-size: 2rem; font-weight: 700; color: var(--color-primary); margin: 0;">
            {{ stats.total }}
          </p>
          <p style="color: var(--color-text-muted); margin: 4px 0;">Total de ordens</p>
        </div>
        <div class="card" style="text-align: center;" *ngIf="stats$ | async as stats">
          <p style="font-size: 2rem; font-weight: 700; color: #e6a100; margin: 0;">
            {{ stats.pending }}
          </p>
          <p style="color: var(--color-text-muted); margin: 4px 0;">Pendentes</p>
        </div>
        <div class="card" style="text-align: center;" *ngIf="stats$ | async as stats">
          <p style="font-size: 2rem; font-weight: 700; color: #1a8a3f; margin: 0;">
            {{ stats.approved }}
          </p>
          <p style="color: var(--color-text-muted); margin: 4px 0;">Aprovadas</p>
        </div>
        <div class="card" style="text-align: center;" *ngIf="stats$ | async as stats">
          <p style="font-size: 2rem; font-weight: 700; color: #c0392b; margin: 0;">
            {{ stats.rejected }}
          </p>
          <p style="color: var(--color-text-muted); margin: 4px 0;">Rejeitadas</p>
        </div>
      </div>

      <!-- FX Rate -->
      <div class="card" style="margin-bottom: 24px;" *ngIf="fxRate$ | async as fx">
        <h3 style="margin-top: 0;">Cotação FX</h3>
        <p style="font-size: 1.25rem;">
          <strong>{{ fx.from }} → {{ fx.to }}:</strong>
          <span style="color: var(--color-accent); font-weight: 700;">
            {{ fx.rate | number: '1.4-4' }}</span
          >
        </p>
        <p style="color: var(--color-text-muted); font-size: 0.875rem; margin: 8px 0 0;">
          Fonte: {{ fx.source }} · {{ fx.asOf | date: 'short' }}
        </p>
      </div>
      <div class="card" style="margin-bottom: 24px;" *ngIf="fxError$">
        <h3 style="margin-top: 0;">Cotação FX</h3>
        <p style="color: var(--color-text-muted);">{{ fxError$ }}</p>
      </div>

      <!-- Links rápidos -->
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <a
          routerLink="/orders"
          class="card"
          style="text-decoration: none; color: var(--color-accent); font-weight: 600; padding: 12px 24px;"
        >
          Ver ordens →
        </a>
        <a
          routerLink="/users"
          class="card"
          style="text-decoration: none; color: var(--color-accent); font-weight: 600; padding: 12px 24px;"
          *ngIf="isAdmin"
        >
          Gerir utilizadores →
        </a>
      </div>
    </section>
  `,
})
export class DashboardPageComponent implements OnInit {
  stats$ = new BehaviorSubject<DashboardStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  fxRate$ = new BehaviorSubject<FxRateResponse | null>(null);
  fxError$ = '';
  isAdmin = false;

  constructor(
    private ordersApi: FinancialOrdersApiService,
    private fxApi: FxApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.isAdmin = this.auth.role === 'ADMIN';
    this.loadStats();
    this.loadFx();
  }
  private loadStats() {
    this.ordersApi.list(0, 1).subscribe({
      next: (page) => {
        const total = page.totalElements;
        this.stats$.next({ total, pending: 0, approved: 0, rejected: 0 });
        this.loadStatusCount('PENDING', (n) =>
          this.stats$.next({ ...this.stats$.value, pending: n }),
        );
        this.loadStatusCount('APPROVED', (n) =>
          this.stats$.next({ ...this.stats$.value, approved: n }),
        );
        this.loadStatusCount('REJECTED', (n) =>
          this.stats$.next({ ...this.stats$.value, rejected: n }),
        );
      },
    });
  }

  private loadStatusCount(status: OrderStatus, cb: (n: number) => void) {
    this.ordersApi.list(0, 1, status).subscribe({
      next: (page) => cb(page.totalElements),
    });
  }

  private loadFx() {
    this.fxApi.getRate('USD', 'BRL').subscribe({
      next: (rate) => this.fxRate$.next(rate),
      error: () => {
        this.fxError$ =
          'Não foi possível carregar a cotação. O serviço FX pode estar indisponível.';
      },
    });
  }
}
