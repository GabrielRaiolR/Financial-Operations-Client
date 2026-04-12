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
    <section class="card" style="max-width: 400px; margin: 80px auto;">
      <h2>Criar conta</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label>Empresa</label>
          <input formControlName="companyName" type="text" />
        </div>
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
          {{ loading ? 'Criando...' : 'Registar' }}
        </button>
      </form>
      <p><a routerLink="/auth/login">Já tenho conta</a></p>
    </section>
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
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const payload = this.form.getRawValue() as RegisterRequest;
    this.auth.register(payload).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        const fe = err.error?.fieldErrors as Record<string, string> | undefined;
        const firstField =
          fe && Object.keys(fe).length ? Object.values(fe)[0] : undefined;
        this.error = firstField ?? err.error?.message ?? 'Erro ao registar';
      },
    });
  }
}
