import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
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
  imports: [CommonModule, RouterLink, BaseChartDirective],
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
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
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
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
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
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
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
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
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

      <div class="fx-dashboard-row">
        <div class="fx-dashboard-row__spot">
          <div class="fx-dashboard-row__spot-cards">
            <div class="card" *ngIf="fxUsd$ | async as fxUsd">
              <h3 class="fx-card__title">USD → BRL</h3>
              <p class="fx-card__rate">
                <strong>{{ fxUsd.from }} → {{ fxUsd.to }}:</strong>
                <span class="fx-card__rate-num">{{ fxUsd.rate | number: '1.4-4' }}</span>
              </p>
              <p class="fx-card__meta muted">
                Source: {{ fxUsd.source }} · rate date (UTC): {{ formatFxReferenceDate(fxUsd) }}
              </p>
            </div>
            <div class="card" *ngIf="fxUsdError$">
              <h3 class="fx-card__title">USD → BRL</h3>
              <p class="muted">{{ fxUsdError$ }}</p>
            </div>

            <div class="card" *ngIf="fxJpy$ | async as fxJpy">
              <h3 class="fx-card__title">JPY → BRL</h3>
              <p class="fx-card__rate">
                <strong>{{ fxJpy.from }} → {{ fxJpy.to }}:</strong>
                <span class="fx-card__rate-num">{{ fxJpy.rate | number: '1.4-6' }}</span>
              </p>
              <p class="fx-card__meta muted">
                Source: {{ fxJpy.source }} · rate date (UTC): {{ formatFxReferenceDate(fxJpy) }}
              </p>
            </div>
            <div class="card" *ngIf="fxJpyError$">
              <h3 class="fx-card__title">JPY → BRL</h3>
              <p class="muted">{{ fxJpyError$ }}</p>
            </div>
          </div>
        </div>

        <div class="fx-dashboard-row__chart">
          <div class="card" *ngIf="fxHistoryLoading">
            <h3 class="fx-card__title">USD → BRL (last 5 trading days)</h3>
            <p class="muted">Loading history…</p>
          </div>
          <div class="card fx-chart-card" *ngIf="!fxHistoryLoading && historyHasPoints">
            <h3 class="fx-card__title">USD → BRL (last 5 trading days)</h3>
            <p class="fx-chart-card__subtitle muted">
              Most recent five daily reference rates (UTC). Weekends omitted by the data source.
            </p>
            <div class="fx-chart-card__canvas-wrap">
              <canvas
                baseChart
                [type]="'line'"
                [data]="lineChartData"
                [options]="lineChartOptions"
                aria-label="USD to BRL exchange rate last five trading days"
              ></canvas>
            </div>
          </div>
          <div class="card" *ngIf="!fxHistoryLoading && fxHistoryError$">
            <h3 class="fx-card__title">USD → BRL (last 5 trading days)</h3>
            <p class="muted">{{ fxHistoryError$ }}</p>
          </div>
        </div>
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
    .fx-dashboard-row {
      display: grid;
      grid-template-columns: 1fr 1.35fr;
      gap: 20px;
      margin-bottom: 22px;
      align-items: stretch;
    }
    .fx-dashboard-row__spot {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 100%;
    }
    .fx-dashboard-row__spot-cards {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 0;
    }
    .fx-dashboard-row__spot-cards > .card {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 0;
    }
    .fx-dashboard-row__chart {
      min-width: 0;
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }
    .fx-dashboard-row__chart > .card {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .fx-chart-card .fx-chart-card__canvas-wrap {
      flex: 1;
      min-height: 220px;
    }
    @media (max-width: 900px) {
      .fx-dashboard-row {
        grid-template-columns: 1fr;
      }
      .fx-dashboard-row__spot-cards > .card {
        flex: 0 1 auto;
      }
    }
    .fx-chart-card__subtitle {
      margin: -4px 0 12px;
      font-size: 0.8125rem;
    }
    .fx-chart-card__canvas-wrap {
      position: relative;
      height: 220px;
      width: 100%;
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

  fxUsd$ = new BehaviorSubject<FxRateResponse | null>(null);
  fxJpy$ = new BehaviorSubject<FxRateResponse | null>(null);
  fxUsdError$ = '';
  fxJpyError$ = '';
  fxHistoryError$ = '';
  fxHistoryLoading = true;
  historyHasPoints = false;

  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'BRL per 1 USD',
        data: [],
        borderColor: '#0d56df',
        backgroundColor: 'rgba(13, 86, 223, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { boxWidth: 12, font: { size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { maxRotation: 45, minRotation: 0, font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: { font: { size: 10 } },
        grid: { color: 'rgba(5, 24, 60, 0.06)' },
      },
    },
  };

  isAdmin = false;

  constructor(
    private ordersApi: FinancialOrdersApiService,
    private fxApi: FxApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.isAdmin = this.auth.role === 'ADMIN';
    this.loadStats();
    this.loadFxUsd();
    this.loadFxJpy();
    this.loadFxHistory();
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
      error: () => this.cdr.markForCheck(),
    });
  }

  private loadStatusCount(status: OrderStatus, cb: (n: number) => void) {
    this.ordersApi.list(0, 1, status).subscribe({
      next: (page) => cb(page.totalElements),
      error: () => cb(0),
    });
  }

  private loadFxUsd() {
    this.fxApi.getRate('USD', 'BRL').subscribe({
      next: (rate) => {
        this.fxUsd$.next(rate);
        this.fxUsdError$ = '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.fxUsdError$ = 'Could not load the exchange rate. The FX service may be unavailable.';
        this.cdr.markForCheck();
      },
    });
  }

  private loadFxJpy() {
    this.fxApi.getRate('JPY', 'BRL').subscribe({
      next: (rate) => {
        this.fxJpy$.next(rate);
        this.fxJpyError$ = '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.fxJpyError$ = 'Could not load JPY/BRL. The FX service may be unavailable.';
        this.cdr.markForCheck();
      },
    });
  }

  private loadFxHistory() {
    this.fxApi.getHistory('USD', 'BRL', 5).subscribe({
      next: (h) => {
        this.fxHistoryLoading = false;
        this.fxHistoryError$ = '';
        if (!h.points?.length) {
          this.historyHasPoints = false;
          this.fxHistoryError$ = 'No historical data returned for this window.';
          this.cdr.markForCheck();
          return;
        }
        this.historyHasPoints = true;
        const labels = h.points.map((p) => this.shortDateLabel(p.date));
        const data = h.points.map((p) => Number(p.rate));
        this.lineChartData = {
          labels: [...labels],
          datasets: [
            {
              label: 'BRL per 1 USD',
              data: [...data],
              borderColor: '#0d56df',
              backgroundColor: 'rgba(13, 86, 223, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        };
        this.cdr.markForCheck();
      },
      error: () => {
        this.fxHistoryLoading = false;
        this.historyHasPoints = false;
        this.fxHistoryError$ = 'Could not load rate history. The FX service may be unavailable.';
        this.cdr.markForCheck();
      },
    });
  }

  /** Provider daily rate date for display (UTC calendar day, not “now” of the HTTP request). */
  formatFxReferenceDate(fx: FxRateResponse): string {
    if (fx.referenceDate) {
      const [y, m, d] = fx.referenceDate.split('-').map(Number);
      if (y && m && d) {
        return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        });
      }
      return fx.referenceDate;
    }
    const t = fx.asOf ? new Date(fx.asOf) : null;
    return t && !Number.isNaN(t.getTime())
      ? t.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : '—';
  }

  /** `yyyy-MM-dd` → short label for chart axis */
  private shortDateLabel(isoDate: string): string {
    const [y, m, d] = isoDate.split('-').map(Number);
    if (!y || !m || !d) return isoDate;
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
