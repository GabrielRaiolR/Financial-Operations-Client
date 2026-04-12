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
    <section class="card" style="max-width: 400px; margin: 80px auto;">
      <h2>Login</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label>Email</label>
          <input formControlName="email" type="email" />
        </div>
        <div>
          <label>Password</label>
          <input formControlName="password" type="password" />
        </div>
        <p *ngIf="error" style="color:red">{{ error }}</p>
        <button type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
      <p><a routerLink="/auth/register">Criar conta</a></p>
    </section>
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
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.getRawValue() as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        const fe = err.error?.fieldErrors as Record<string, string> | undefined;
        const firstField =
          fe && Object.keys(fe).length ? Object.values(fe)[0] : undefined;
        this.error = firstField ?? err.error?.message ?? 'Erro ao fazer login';
      },
    });
  }
}
