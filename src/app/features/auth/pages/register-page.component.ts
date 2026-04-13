import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-layout__bg" aria-hidden="true"></div>
      <div class="auth-layout__scrim" aria-hidden="true"></div>
      <section class="card auth-card">
        <p class="auth-card__brand">Financial Operations</p>
        <h1 class="auth-card__title">Create account</h1>
        <p class="auth-card__subtitle">
          Register your company and first admin user. Password: 8–72 characters.
        </p>
        <form class="form-stack" [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label for="reg-company">Company name</label>
            <input
              id="reg-company"
              formControlName="companyName"
              type="text"
              autocomplete="organization"
              placeholder="Acme Inc."
            />
          </div>
          <div class="form-field">
            <label for="reg-email">Email</label>
            <input
              id="reg-email"
              formControlName="email"
              type="email"
              autocomplete="email"
              placeholder="you@company.com"
            />
          </div>
          <div class="form-field">
            <label for="reg-password">Password</label>
            <input
              id="reg-password"
              formControlName="password"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
            />
          </div>
          <p *ngIf="error" class="form-error" role="alert">{{ error }}</p>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || loading"
          >
            {{ loading ? 'Creating…' : 'Create account' }}
          </button>
        </form>
        <p class="auth-card__footer">
          <a routerLink="/auth/login">Already have an account? Sign in</a>
        </p>
      </section>
    </div>
  `,
})
export class RegisterPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    companyName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(120),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
      ],
    ],
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
    const payload = this.form.getRawValue() as RegisterRequest;
    this.auth.register(payload).subscribe({
      next: () => {
        if (payload.email?.trim()) {
          this.auth.rememberDisplayEmail(payload.email);
        }
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const fe = err.error?.fieldErrors as Record<string, string> | undefined;
        const firstField =
          fe && Object.keys(fe).length ? Object.values(fe)[0] : undefined;
        this.error =
          firstField ?? err.error?.message ?? 'Registration failed. Try again.';
      },
    });
  }
}
