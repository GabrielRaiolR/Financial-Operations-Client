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
    <section class="page-container">
      <header class="page-head page-head--hero">
        <h1>Financial operations</h1>
        <p>Summary of orders and FX. Use the menu on the left to navigate.</p>
      </header>

      <ng-container *ngIf="stats$ | async as stats">
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--primary" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div class="stat-card__body">
              <p class="stat-card__value">{{ stats.total }}</p>
              <p class="stat-card__label">Total orders</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--warning" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div class="stat-card__body">
              <p class="stat-card__value stat-card__value--warning">{{ stats.pending }}</p>
              <p class="stat-card__label">Pending</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--success" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div class="stat-card__body">
              <p class="stat-card__value stat-card__value--success">{{ stats.approved }}</p>
              <p class="stat-card__label">Approved</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--danger" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div class="stat-card__body">
              <p class="stat-card__value stat-card__value--danger">{{ stats.rejected }}</p>
              <p class="stat-card__label">Rejected</p>
            </div>
          </div>
        </div>
      </ng-container>

      <div class="card" style="margin-bottom: 22px;" *ngIf="fxRate$ | async as fx">
        <h3 class="fx-card__title">FX rate</h3>
        <p class="fx-card__rate">
          <strong>{{ fx.from }} → {{ fx.to }}:</strong>
          <span class="fx-card__rate-num">{{ fx.rate | number: '1.4-4' }}</span>
        </p>
        <p class="fx-card__meta muted">Source: {{ fx.source }} · {{ fx.asOf | date: 'short' }}</p>
      </div>
      <div class="card" style="margin-bottom: 22px;" *ngIf="fxError$">
        <h3 class="fx-card__title">FX rate</h3>
        <p class="muted">{{ fxError$ }}</p>
      </div>

      <div class="dash-actions">
        <a routerLink="/orders" class="btn btn-primary btn-inline">View orders</a>
        <a routerLink="/users" class="btn btn-secondary" *ngIf="isAdmin">Manage users</a>
      </div>
    </section>
  `,
  styles: `
    .page-head--hero h1 {
      font-size: clamp(1.5rem, 2.5vw, 1.875rem);
    }
    .fx-card__title {
      margin: 0 0 12px;
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--color-primary);
    }
    .fx-card__rate {
      margin: 0;
      font-size: 1.2rem;
    }
    .fx-card__rate-num {
      color: var(--color-accent);
      font-weight: 800;
      margin-left: 6px;
    }
    .fx-card__meta {
      margin: 10px 0 0;
      font-size: 0.875rem;
    }
    .dash-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
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
          'Could not load the exchange rate. The FX service may be unavailable.';
      },
    });
  }
}
