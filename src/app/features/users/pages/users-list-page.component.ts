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
    <section class="card" style="max-width: 800px; margin: 40px auto;">
      <h2>Gestão de utilizadores</h2>

      <details style="margin-bottom: 16px;">
        <summary style="cursor: pointer; font-weight: 600;">
          + Criar utilizador
        </summary>
        <form
          [formGroup]="createForm"
          (ngSubmit)="onCreate()"
          style="margin-top: 12px;"
        >
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <input
              formControlName="email"
              placeholder="Email"
              type="email"
              style="flex: 1;"
            />
            <input
              formControlName="password"
              placeholder="Password"
              type="password"
              style="flex: 1;"
            />
            <select formControlName="role">
              <option value="ADMIN">ADMIN</option>
              <option value="FINANCE">FINANCE</option>
            </select>
            <button
              type="submit"
              [disabled]="createForm.invalid || (loading$ | async)"
            >
              Criar
            </button>
          </div>
          <p *ngIf="createError" style="color: red; margin-top: 4px;">
            {{ createError }}
          </p>
        </form>
      </details>

      <div *ngIf="loading$ | async">Carregando...</div>

      <ng-container *ngIf="page$ | async as page">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr
              style="text-align: left; border-bottom: 2px solid var(--color-border);"
            >
              <th style="padding: 8px;">Email</th>
              <th style="padding: 8px;">Role</th>
              <th style="padding: 8px;">Activo</th>
              <th style="padding: 8px;">Acções</th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let user of page.content; trackBy: trackById"
              style="border-bottom: 1px solid var(--color-border);"
            >
              <td style="padding: 8px;">{{ user.email }}</td>
              <td style="padding: 8px;">
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
              <td style="padding: 8px;">{{ user.active ? 'Sim' : 'Não' }}</td>
              <td style="padding: 8px;">
                <button
                  type="button"
                  (click)="onDelete(user)"
                  style="color: red; background: none; border: 1px solid red; border-radius: 4px; cursor: pointer;"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style="margin-top: 12px; display: flex; gap: 8px; align-items: center;"
        >
          <button
            type="button"
            [disabled]="page.first"
            (click)="loadPage(page.number - 1)"
          >
            Anterior
          </button>
          <span>Página {{ page.number + 1 }} de {{ page.totalPages }}</span>
          <button
            type="button"
            [disabled]="page.last"
            (click)="loadPage(page.number + 1)"
          >
            Seguinte
          </button>
        </div>
      </ng-container>
    </section>
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
}
