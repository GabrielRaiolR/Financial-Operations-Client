import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { finalize, tap } from 'rxjs';
import { OrdersStateService } from '../services/orders-state.service';
import { FinancialOrdersApiService } from '../services/financial-orders-api.service';
import { AuthService } from '../../../core/services/auth.service';
import type {
  FinancialOrderResponse,
  OrderStatus,
  OrderType,
} from '../../../core/models/order.model';

@Component({
  standalone: true,
  selector: 'app-orders-list-page',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <header class="page-head">
        <h1>Financial orders</h1>
        <p>Create orders and filter by status; as an administrator you can approve or reject pending ones.</p>
      </header>

      <section class="card" style="margin-bottom: 16px;">
        <details>
          <summary class="orders-create-summary">+ New order</summary>
          <form
            [formGroup]="createForm"
            (ngSubmit)="onCreate()"
            class="orders-create-form"
          >
            <div class="orders-create-form__row">
              <label class="orders-create-form__field">
                <span class="orders-create-form__label">Type</span>
                <select formControlName="type" class="orders-create-form__input">
                  <option value="PAYABLE">Payable</option>
                  <option value="RECEIVABLE">Receivable</option>
                </select>
              </label>
              <label class="orders-create-form__field">
                <span class="orders-create-form__label">Amount (min. 0.01)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  formControlName="amount"
                  class="orders-create-form__input"
                />
              </label>
              <label class="orders-create-form__field orders-create-form__field--grow">
                <span class="orders-create-form__label">Description</span>
                <input
                  type="text"
                  formControlName="description"
                  class="orders-create-form__input"
                  placeholder="e.g. Vendor invoice #123"
                />
              </label>
              <button
                type="submit"
                class="btn btn-primary btn-inline"
                [disabled]="createForm.invalid || createLoading"
              >
                Create
              </button>
            </div>
            <p *ngIf="createError" class="form-error">{{ createError }}</p>
          </form>
        </details>
      </section>

      <section class="card" style="margin-bottom: 16px;">
        <div class="segmented" role="group" aria-label="Order filter">
          <button
            type="button"
            [class.is-selected]="activeFilter === 'PENDING'"
            (click)="filter('PENDING')"
          >
            Pending
          </button>
          <button
            type="button"
            [class.is-selected]="activeFilter === 'ALL'"
            (click)="filter()"
          >
            All
          </button>
        </div>
      </section>

      <section class="card">
        <div *ngIf="state.loading$ | async" class="muted" style="padding: 8px 0;">Loading…</div>
        <div *ngIf="state.page$ | async as page" class="orders-table-scroll">
          <table class="data-table orders-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th class="orders-table__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of page.content; trackBy: trackById">
                <td>{{ item.description }}</td>
                <td>{{ item.type }}</td>
                <td>{{ item.amount }}</td>
                <td>{{ item.status }}</td>
                <td class="orders-table__actions">
                  <ng-container *ngIf="item.status === 'PENDING'">
                    <div
                      *ngIf="auth.role === 'ADMIN'"
                      class="row-actions row-actions--orders"
                    >
                      <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        (click)="approve(item.id)"
                        aria-label="Approve pending order"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        class="btn btn-danger-outline btn-sm"
                        (click)="reject(item.id)"
                        aria-label="Reject pending order"
                      >
                        Reject
                      </button>
                    </div>
                    <span *ngIf="auth.role !== 'ADMIN'" class="muted"
                      >Awaiting approval</span
                    >
                  </ng-container>
                  <span *ngIf="item.status !== 'PENDING'" class="muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .orders-create-summary {
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--color-accent);
      list-style: none;
    }
    .orders-create-summary::-webkit-details-marker {
      display: none;
    }
    .orders-create-form {
      margin-top: 16px;
    }
    .orders-create-form__row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: flex-end;
    }
    .orders-create-form__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 120px;
    }
    .orders-create-form__field--grow {
      flex: 1;
      min-width: 200px;
    }
    .orders-create-form__label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }
    .orders-create-form__input {
      padding: 10px 12px;
      font-family: inherit;
      font-size: 0.9375rem;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-bg);
      color: var(--color-text);
    }
    .orders-table-scroll {
      overflow-x: auto;
      margin: 0 -4px;
      padding: 0 4px;
    }
    .orders-table__th-actions,
    .orders-table__actions {
      min-width: 11.5rem;
      width: 1%;
      white-space: nowrap;
      vertical-align: middle;
    }
    .row-actions--orders {
      flex-direction: column;
      align-items: stretch;
    }
    .row-actions--orders .btn {
      width: 100%;
      justify-content: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersListPageComponent {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  /** Keeps the active filter when reloading after approve/reject. */
  private listStatus?: OrderStatus;
  activeFilter: 'PENDING' | 'ALL' = 'ALL';

  createForm = this.fb.group({
    type: this.fb.nonNullable.control<OrderType>('PAYABLE', Validators.required),
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(500)],
    ],
  });

  createLoading = false;
  createError = '';

  constructor(
    public state: OrdersStateService,
    private api: FinancialOrdersApiService,
    protected auth: AuthService,
  ) {
    this.state.load(0, 20);
  }

  onCreate() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.createError = '';
    const raw = this.createForm.getRawValue();
    const amount = Number(raw.amount);
    if (Number.isNaN(amount) || amount < 0.01) {
      this.createError = 'Enter a valid amount (minimum 0.01).';
      return;
    }
    this.createLoading = true;
    this.cdr.markForCheck();
    this.api
      .create({
        type: raw.type,
        amount,
        description: raw.description!.trim(),
      })
      .pipe(
        finalize(() => {
          this.createLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.createForm.reset({ type: 'PAYABLE', amount: null, description: '' });
          this.state.load(0, 20, this.listStatus);
          this.cdr.markForCheck();
        },
        error: (err) => {
          const fe = err.error?.fieldErrors as Record<string, string> | undefined;
          const firstField =
            fe && Object.keys(fe).length ? Object.values(fe)[0] : undefined;
          this.createError =
            firstField ?? err.error?.message ?? 'Could not create the order.';
          this.cdr.markForCheck();
        },
      });
  }

  filter(status?: OrderStatus) {
    this.listStatus = status;
    this.activeFilter = status === 'PENDING' ? 'PENDING' : 'ALL';
    this.state.load(0, 20, status);
  }

  approve(id: string) {
    this.api
      .approve(id)
      .pipe(tap(() => this.state.load(0, 20, this.listStatus)))
      .subscribe();
  }

  reject(id: string) {
    const input = window.prompt(
      'Rejection reason (optional). Leave blank and confirm to reject without a note. Cancel aborts.',
      '',
    );
    if (input === null) {
      return;
    }
    const reason = input.trim();
    this.api
      .reject(id, reason || undefined)
      .pipe(tap(() => this.state.load(0, 20, this.listStatus)))
      .subscribe();
  }

  trackById(_: number, item: FinancialOrderResponse) {
    return item.id;
  }
}
