import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-layout__bg" aria-hidden="true"></div>
      <div class="auth-layout__scrim" aria-hidden="true"></div>
      <section class="card auth-card">
        <p class="auth-card__brand">Financial Operations</p>
        <h1 class="auth-card__title">Login</h1>
        <p class="auth-card__subtitle">
          Sign in to access your company dashboard and orders.
        </p>
        <form class="form-stack" [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              formControlName="email"
              type="email"
              autocomplete="email"
              placeholder="you@company.com"
            />
          </div>
          <div class="form-field">
            <label for="login-password">Password</label>
            <input
              id="login-password"
              formControlName="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <p *ngIf="error" class="form-error" role="alert">{{ error }}</p>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || loading"
          >
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <p class="auth-card__footer">
          <a routerLink="/auth/register">Create an account</a>
        </p>
      </section>
    </div>
  `,
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  error = '';

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const credentials = this.form.getRawValue() as { email: string; password: string };
    this.auth.login(credentials).subscribe({
      next: () => {
        if (credentials.email?.trim()) {
          this.auth.rememberDisplayEmail(credentials.email);
        }
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const fe = err.error?.fieldErrors as Record<string, string> | undefined;
        const firstField =
          fe && Object.keys(fe).length ? Object.values(fe)[0] : undefined;
        this.error =
          firstField ?? err.error?.message ?? 'Unable to sign in. Try again.';
      },
    });
  }
}
