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
        <h1>Ordens financeiras</h1>
        <p>Cria ordens, filtra por estado; como administrador, podes aprovar ou rejeitar pendentes.</p>
      </header>

      <section class="card" style="margin-bottom: 16px;">
        <details>
          <summary class="orders-create-summary">+ Nova ordem</summary>
          <form
            [formGroup]="createForm"
            (ngSubmit)="onCreate()"
            class="orders-create-form"
          >
            <div class="orders-create-form__row">
              <label class="orders-create-form__field">
                <span class="orders-create-form__label">Tipo</span>
                <select formControlName="type" class="orders-create-form__input">
                  <option value="PAYABLE">A pagar</option>
                  <option value="RECEIVABLE">A receber</option>
                </select>
              </label>
              <label class="orders-create-form__field">
                <span class="orders-create-form__label">Valor (mín. 0,01)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  formControlName="amount"
                  class="orders-create-form__input"
                />
              </label>
              <label class="orders-create-form__field orders-create-form__field--grow">
                <span class="orders-create-form__label">Descrição</span>
                <input
                  type="text"
                  formControlName="description"
                  class="orders-create-form__input"
                  placeholder="Ex.: Factura fornecedor #123"
                />
              </label>
              <button
                type="submit"
                class="btn btn-primary btn-inline"
                [disabled]="createForm.invalid || createLoading"
              >
                Criar
              </button>
            </div>
            <p *ngIf="createError" class="form-error">{{ createError }}</p>
          </form>
        </details>
      </section>

      <section class="card" style="margin-bottom: 16px;">
        <div class="segmented" role="group" aria-label="Filtro de ordens">
          <button
            type="button"
            [class.is-selected]="activeFilter === 'PENDING'"
            (click)="filter('PENDING')"
          >
            Pendentes
          </button>
          <button
            type="button"
            [class.is-selected]="activeFilter === 'ALL'"
            (click)="filter()"
          >
            Todas
          </button>
        </div>
      </section>

      <section class="card">
        <div *ngIf="state.loading$ | async" class="muted" style="padding: 8px 0;">A carregar…</div>
        <div *ngIf="state.page$ | async as page" class="orders-table-scroll">
          <table class="data-table orders-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Estado</th>
                <th class="orders-table__th-actions">Acções</th>
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
                        aria-label="Aprovar ordem pendente"
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        class="btn btn-danger-outline btn-sm"
                        (click)="reject(item.id)"
                        aria-label="Rejeitar ordem pendente"
                      >
                        Rejeitar
                      </button>
                    </div>
                    <span *ngIf="auth.role !== 'ADMIN'" class="muted"
                      >Aguardando aprovação</span
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

  /** Mantém o filtro activo ao recarregar após aprovar/rejeitar. */
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
      this.createError = 'Indica um valor válido (mínimo 0,01).';
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
            firstField ?? err.error?.message ?? 'Não foi possível criar a ordem.';
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
      'Motivo da rejeição (opcional). Deixa em branco e confirma para rejeitar sem texto. Cancelar aborta.',
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
