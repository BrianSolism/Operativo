import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    PasswordModule,
  ],
  providers: [MessageService],
  template: `
    <style>
      .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #0f2347 0%, #1a3a6e 50%, #2b5290 100%);
        padding: 16px;
        position: relative;
        overflow: hidden;
      }

      .login-page::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(ellipse at center, rgba(245,134,52,0.08) 0%, transparent 60%);
        animation: pulse 8s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 1; }
      }

      .login-card {
        width: 100%;
        max-width: 420px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        position: relative;
        z-index: 1;
      }

      .card-header {
        background: linear-gradient(135deg, #0f2347 0%, #1a3a6e 60%, #2b5290 100%);
        padding: 32px 36px 28px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        position: relative;
        overflow: hidden;
      }

      .card-header::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #ed5d37, #f58634);
      }

      .logo-box {
        width: 140px;
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .logo-box img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: brightness(0) invert(1);
      }

      .brand-title {
        font-size: 22px;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: 2px;
        margin: 0;
      }

      .brand-subtitle {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.65);
        letter-spacing: 1.5px;
        text-transform: uppercase;
        margin: 0;
      }

      .card-body {
        padding: 32px 36px 36px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #2b5290;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 6px;
      }

      .form-group .p-inputtext {
        width: 100%;
        border-radius: 8px;
        border: 1.5px solid #e2e8f0;
        padding: 10px 14px;
        font-size: 14px;
        transition: border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
      }

      .form-group .p-inputtext:focus {
        border-color: #2b5290;
        box-shadow: 0 0 0 3px rgba(43, 82, 144, 0.12);
        outline: none;
      }

      .input-full {
        width: 100%;
        display: block;
      }

      .password-wrapper {
        width: 100%;
        position: relative;
      }

      .password-wrapper ::ng-deep .p-password {
        width: 100%;
        display: flex;
        align-items: center;
      }

      .password-wrapper ::ng-deep .p-password input {
        flex: 1;
        width: 100%;
        border-radius: 8px;
        border: 1.5px solid #e2e8f0;
        padding: 10px 14px;
        font-size: 14px;
        transition: border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
      }

      .password-wrapper ::ng-deep .p-password input:focus {
        border-color: #2b5290;
        box-shadow: 0 0 0 3px rgba(43, 82, 144, 0.12);
        outline: none;
      }

      .password-wrapper ::ng-deep .p-password .p-password-toggle-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        color: #94a3b8;
        background: none;
        border: none;
        padding: 0;
      }

      .submit-btn {
        width: 100%;
        background: linear-gradient(135deg, #ed5d37, #f58634) !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 12px !important;
        font-size: 15px !important;
        font-weight: 700 !important;
        letter-spacing: 0.5px;
        color: #ffffff !important;
        cursor: pointer;
        margin-top: 8px;
        transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s !important;
        box-shadow: 0 4px 14px rgba(237, 93, 55, 0.35) !important;
      }

      .submit-btn:hover:not(:disabled) {
        opacity: 0.92;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(237, 93, 55, 0.45) !important;
      }

      .submit-btn:active:not(:disabled) {
        transform: translateY(0);
      }

      .footer-text {
        text-align: center;
        margin-top: 20px;
        font-size: 11px;
        color: #94a3b8;
      }
    </style>

    <p-toast position="top-right"></p-toast>

    <div class="login-page">
      <div class="login-card">

        <!-- Header -->
        <div class="card-header">
          <div class="logo-box">
            <img src="assets/logo.png" alt="ALGEBASA" />
          </div>
          <p class="brand-subtitle">Portal Operativo</p>
        </div>

        <!-- Body -->
        <div class="card-body">
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" novalidate>

            <div class="form-group">
              <label class="form-label" for="username">Usuario</label>
              <input
                id="username"
                type="text"
                pInputText
                class="input-full"
                [(ngModel)]="username"
                name="username"
                required
                autocomplete="username"
                placeholder="Ingrese su usuario"
                [disabled]="loading"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Contraseña</label>
              <div class="password-wrapper">
                <p-password
                  inputId="password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  [feedback]="false"
                  [toggleMask]="true"
                  styleClass="input-full"
                  inputStyleClass="input-full"
                  placeholder="Ingrese su contraseña"
                  [disabled]="loading"
                ></p-password>
              </div>
            </div>

            <button
              type="submit"
              pButton
              class="submit-btn"
              [disabled]="loading || !username || !password"
            >
              <i class="pi" [class.pi-sign-in]="!loading" [class.pi-spin]="loading" [class.pi-spinner]="loading"></i>
              &nbsp; {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
            </button>

          </form>

          <p class="footer-text">ALGEBASA &copy; {{ currentYear }} — Todos los derechos reservados</p>
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  currentYear = new Date().getFullYear();

  private auth = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  onSubmit() {
    if (!this.username || !this.password) return;
    this.loading = true;

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        const msg =
          err?.error?.message ||
          (err.status === 401 ? 'Credenciales incorrectas' : 'Error al conectar con el servidor');
        this.messageService.add({
          severity: 'error',
          summary: 'Error de autenticación',
          detail: msg,
          life: 4000,
        });
      },
    });
  }
}
