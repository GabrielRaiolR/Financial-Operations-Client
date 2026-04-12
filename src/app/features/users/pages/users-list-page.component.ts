import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, finalize } from 'rxjs';
import {
  UsersApiService,
  UserResponse,
  CreateUserRequest,
} from '../services/users-api.service';
import { SpringPage } from '../../../core/models/page.model';

@Component({
  standalone: true,
  selector: 'app-users-list-page',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="page-head">
        <h1>Gestão de utilizadores</h1>
        <p>Criar contas e rever permissões da equipa.</p>
      </header>

      <section class="card" style="margin-bottom: 20px;">
        <details>
          <summary class="details-summary">+ Criar utilizador</summary>
          <form [formGroup]="createForm" (ngSubmit)="onCreate()" class="create-user-form">
            <div class="create-user-form__row">
              <input
                formControlName="email"
                placeholder="Email"
                type="email"
                class="create-user-form__input"
              />
              <input
                formControlName="password"
                placeholder="Password"
                type="password"
                class="create-user-form__input"
              />
              <select formControlName="role" class="create-user-form__select">
                <option value="ADMIN">ADMIN</option>
                <option value="FINANCE">FINANCE</option>
              </select>
              <button
                type="submit"
                class="btn btn-primary btn-inline"
                [disabled]="createForm.invalid || (loading$ | async)"
              >
                Criar
              </button>
            </div>
            <p *ngIf="createError" class="form-error">{{ createError }}</p>
          </form>
        </details>
      </section>

      <section class="card">
        <div *ngIf="loading$ | async" class="muted" style="padding: 8px 0;">A carregar…</div>

        <ng-container *ngIf="page$ | async as page">
          <table class="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Empresa</th>
                <th>Role</th>
                <th>Activo</th>
                <th>Acções</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of page.content; trackBy: trackById">
                <td>{{ user.email }}</td>
                <td>
                  <span class="company-cell">{{ companyLabel(user) }}</span>
                </td>
                <td>
                  <span
                    [style.color]="
                      user.role === 'ADMIN'
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)'
                    "
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td>{{ user.active ? 'Sim' : 'Não' }}</td>
                <td>
                  <button type="button" class="btn-danger-outline" (click)="onDelete(user)">
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination-bar">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              [disabled]="page.first"
              (click)="loadPage(page.number - 1)"
            >
              Anterior
            </button>
            <span class="muted">Página {{ page.number + 1 }} de {{ page.totalPages }}</span>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              [disabled]="page.last"
              (click)="loadPage(page.number + 1)"
            >
              Seguinte
            </button>
          </div>
        </ng-container>
      </section>
    </div>
  `,
  styles: `
    .details-summary {
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--color-accent);
      list-style: none;
    }
    .details-summary::-webkit-details-marker {
      display: none;
    }
    .create-user-form {
      margin-top: 16px;
    }
    .create-user-form__row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .create-user-form__input,
    .create-user-form__select {
      flex: 1;
      min-width: 160px;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 0.9375rem;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-bg);
      color: var(--color-text);
    }
    .create-user-form__select {
      flex: 0 1 140px;
      min-width: 120px;
    }
    .pagination-bar {
      margin-top: 16px;
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .company-cell {
      font-size: 0.9375rem;
      color: var(--color-text);
    }
  `,
})
export class UsersListPageComponent {
  private api = inject(UsersApiService);
  private fb = inject(FormBuilder);

  page$ = new BehaviorSubject<SpringPage<UserResponse> | null>(null);
  loading$ = new BehaviorSubject<boolean>(false);
  createError = '';

  createForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
      ],
    ],
    role: ['FINANCE' as 'ADMIN' | 'FINANCE', Validators.required],
  });

  constructor() {
    this.loadPage(0);
  }

  loadPage(page: number) {
    this.loading$.next(true);
    this.api
      .list(page, 20)
      .pipe(finalize(() => this.loading$.next(false)))
      .subscribe((p) => this.page$.next(p));
  }

  onCreate() {
    if (this.createForm.invalid) return;
    this.createError = '';
    const payload = this.createForm.getRawValue() as CreateUserRequest;
    this.api.create(payload).subscribe({
      next: () => {
        this.createForm.reset({ role: 'FINANCE' });
        this.loadPage(0);
      },
      error: (err) => {
        const fe = err.error?.fieldErrors as Record<string, string> | undefined;
        const firstField =
          fe && Object.keys(fe).length ? Object.values(fe)[0] : undefined;
        this.createError =
          firstField ?? err.error?.message ?? 'Erro ao criar utilizador';
      },
    });
  }

  onDelete(user: UserResponse) {
    if (!confirm(`Eliminar ${user.email}?`)) return;
    const currentPage = this.page$.value?.number ?? 0;
    this.api.delete(user.id).subscribe(() => this.loadPage(currentPage));
  }

  trackById(_: number, item: UserResponse) {
    return item.id;
  }

  companyLabel(user: UserResponse): string {
    const name = user.companyName?.trim();
    if (name) return name;
    const cid = user.companyId?.trim();
    if (!cid) return '—';
    return cid.length > 14 ? `${cid.slice(0, 8)}…` : cid;
  }
}
