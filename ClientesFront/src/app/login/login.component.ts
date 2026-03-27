import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, PasswordModule],
  template: `
    <div class="login-bg">
      <div class="login-card">

        <!-- Logo + branding -->
        <div class="login-header">
          <img src="assets/logo.png" alt="Grupo ALGEBASA" class="login-logo" />
          <h1 class="login-title">Sistema Operativo</h1>
          <p class="login-sub">Grupo ALGEBASA</p>
        </div>

        <!-- Formulario -->
        <div class="login-form">
          <div class="login-field">
            <label class="login-label">
              <i class="pi pi-user"></i> Usuario
            </label>
            <input pInputText
              [(ngModel)]="username"
              placeholder="Ingresa tu usuario"
              class="w-full"
              (keydown.enter)="submit()" />
          </div>

          <div class="login-field">
            <label class="login-label">
              <i class="pi pi-lock"></i> Contraseña
            </label>
            <p-password
              [(ngModel)]="password"
              [feedback]="false"
              [toggleMask]="true"
              placeholder="Ingresa tu contraseña"
              styleClass="w-full"
              inputStyleClass="w-full"
              (keydown.enter)="submit()">
            </p-password>
          </div>

          <div *ngIf="error()" class="login-error">
            <i class="pi pi-exclamation-triangle"></i> {{ error() }}
          </div>

          <button pButton
            label="Ingresar"
            icon="pi pi-sign-in"
            iconPos="right"
            class="login-btn"
            [loading]="loading()"
            (click)="submit()">
          </button>
        </div>

        <div class="login-footer">
          Sistema Operativo Clientes · Grupo ALGEBASA
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f2347 0%, #1a3a6e 40%, #2b5290 70%, #1e3a8a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .login-card {
      background: #fff;
      border-radius: 24px;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 40px 80px rgba(0,0,0,0.3), 0 8px 24px rgba(43,82,144,0.2);
      animation: fadeUp 0.4s ease;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-logo {
      height: 64px;
      width: auto;
      object-fit: contain;
      margin-bottom: 1rem;
    }

    .login-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .login-sub {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .login-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .login-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #374151;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .login-label .pi {
      color: #f58634;
    }

    .login-error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #991b1b;
      padding: 0.7rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .login-btn {
      width: 100%;
      background: linear-gradient(135deg, #2b5290, #1a3a6e) !important;
      border: none !important;
      border-radius: 10px !important;
      padding: 0.85rem !important;
      font-size: 1rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.03em !important;
      transition: all 0.3s ease !important;
    }

    .login-btn:hover {
      background: linear-gradient(135deg, #1a3a6e, #0f2347) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 8px 20px rgba(43,82,144,0.35) !important;
    }

    .login-footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.72rem;
      color: #94a3b8;
      letter-spacing: 0.04em;
    }

    :host ::ng-deep .p-password { width: 100%; }
    :host ::ng-deep .p-password input { width: 100%; border-radius: 8px; }
    :host ::ng-deep .p-inputtext { border-radius: 8px; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.username || !this.password) {
      this.error.set('Ingresa usuario y contraseña');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al iniciar sesión');
      }
    });
  }
}
