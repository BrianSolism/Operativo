import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

interface HomeCard {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  visible: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <style>
      .home-wrapper {
        min-height: 100%;
        background: #f4f6fb;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px 24px 64px;
        position: relative;
        overflow: hidden;
      }

      /* Decoración de fondo */
      .home-wrapper::before {
        content: '';
        position: absolute;
        top: -100px;
        right: -100px;
        width: 380px;
        height: 380px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(43,82,144,0.07) 0%, transparent 70%);
        pointer-events: none;
      }

      .home-wrapper::after {
        content: '';
        position: absolute;
        bottom: -80px;
        left: -80px;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(245,134,52,0.06) 0%, transparent 70%);
        pointer-events: none;
      }

      /* Hero */
      .hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-bottom: 52px;
        position: relative;
        z-index: 1;
      }

      .hero-logo-wrap {
        animation: fadeInDown 0.5s ease both;
      }

      .hero-logo {
        width: 120px;
        height: 120px;
        object-fit: contain;
      }

      .hero-divider {
        width: 48px;
        height: 3px;
        background: linear-gradient(90deg, transparent, #f58634, transparent);
        border-radius: 2px;
        animation: fadeIn 0.6s ease 0.2s both;
      }

      .hero-greeting {
        font-size: 14px;
        font-weight: 500;
        color: #94a3b8;
        letter-spacing: 0.5px;
        animation: fadeIn 0.6s ease 0.25s both;
      }

      .hero-name {
        font-size: 26px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: 0.3px;
        animation: fadeIn 0.6s ease 0.3s both;
      }

      .hero-sub {
        font-size: 13px;
        color: #94a3b8;
        animation: fadeIn 0.6s ease 0.35s both;
      }

      /* Section label */
      .section-label {
        width: 100%;
        max-width: 880px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #94a3b8;
        margin-bottom: 16px;
        position: relative;
        z-index: 1;
        animation: fadeIn 0.5s ease 0.4s both;
      }

      /* Cards grid */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 18px;
        width: 100%;
        max-width: 880px;
        position: relative;
        z-index: 1;
      }

      /* Card */
      .nav-card {
        background: #ffffff;
        border: 1px solid #e8edf5;
        border-radius: 16px;
        padding: 28px 24px;
        cursor: pointer;
        text-decoration: none;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        animation: fadeInUp 0.5s ease both;
        position: relative;
        overflow: hidden;
      }

      .nav-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--card-color, #f58634);
        border-radius: 16px 16px 0 0;
        opacity: 0;
        transition: opacity 0.22s ease;
      }

      .nav-card:hover {
        transform: translateY(-5px);
        border-color: transparent;
        box-shadow: 0 12px 36px rgba(43,82,144,0.12);
      }

      .nav-card:hover::before {
        opacity: 1;
      }

      .card-icon-wrap {
        width: 50px;
        height: 50px;
        border-radius: 14px;
        background: var(--card-color, #f58634);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px color-mix(in srgb, var(--card-color, #f58634) 35%, transparent);
        transition: transform 0.22s ease;
      }

      .nav-card:hover .card-icon-wrap {
        transform: scale(1.08);
      }

      .card-icon-wrap i {
        font-size: 22px;
        color: #ffffff;
      }

      .card-label {
        font-size: 15px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: 0.2px;
      }

      .card-desc {
        font-size: 12.5px;
        color: #64748b;
        line-height: 1.5;
      }

      .card-arrow {
        margin-top: auto;
        font-size: 11px;
        color: var(--card-color, #f58634);
        opacity: 0;
        transform: translateX(-4px);
        transition: opacity 0.2s, transform 0.2s;
        display: flex;
        align-items: center;
        gap: 5px;
        font-weight: 600;
      }

      .nav-card:hover .card-arrow {
        opacity: 1;
        transform: translateX(0);
      }

      /* Animaciones */
      @keyframes fadeInDown {
        from { opacity: 0; transform: translateY(-16px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .nav-card:nth-child(1) { animation-delay: 0.35s; }
      .nav-card:nth-child(2) { animation-delay: 0.42s; }
      .nav-card:nth-child(3) { animation-delay: 0.49s; }
      .nav-card:nth-child(4) { animation-delay: 0.56s; }
      .nav-card:nth-child(5) { animation-delay: 0.63s; }

      @media (max-width: 600px) {
        .hero-logo { width: 90px; height: 90px; }
        .hero-name { font-size: 20px; }
        .cards-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
        .nav-card { padding: 20px 16px; }
      }
    </style>

    <div class="home-wrapper">

      <!-- Hero -->
      <div class="hero">
        <div class="hero-logo-wrap">
          <img src="assets/logo.png" alt="ALGEBASA" class="hero-logo" />
        </div>
        <div class="hero-divider"></div>
        <span class="hero-greeting">Bienvenido,</span>
        <span class="hero-name">{{ userName }}</span>
        <span class="hero-sub">Portal Operativo · ALGEBASA</span>
      </div>

      <span class="section-label">Módulos disponibles</span>

      <!-- Cards -->
      <div class="cards-grid">

        <a
          *ngFor="let card of visibleCards"
          class="nav-card"
          [routerLink]="card.route"
          [style.--card-color]="card.color"
        >
          <div class="card-icon-wrap">
            <i class="pi {{ card.icon }}"></i>
          </div>
          <span class="card-label">{{ card.label }}</span>
          <span class="card-desc">{{ card.description }}</span>
          <span class="card-arrow">
            Ir al módulo <i class="pi pi-arrow-right"></i>
          </span>
        </a>

      </div>
    </div>
  `,
})
export class HomeComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  currentUser = this.auth.currentUser;

  get userName(): string {
    return this.currentUser()?.nombre ?? 'Usuario';
  }

  get isAdmin(): boolean {
    return this.currentUser()?.es_admin ?? false;
  }

  get visibleCards(): HomeCard[] {
    const cards: HomeCard[] = [
      {
        label: 'Clientes',
        description: 'Gestión de clientes registrados en el sistema.',
        icon: 'pi-users',
        route: '/clientes/clientes',
        color: '#3b82f6',
        visible: this.auth.canView('clientes') || this.isAdmin,
      },
      {
        label: 'Contratos',
        description: 'Administración de contratos y vigencias.',
        icon: 'pi-file-edit',
        route: '/clientes/contratos',
        color: '#8b5cf6',
        visible: this.auth.canView('contratos') || this.isAdmin,
      },
      {
        label: 'Catálogos',
        description: 'Configuración de catálogos del sistema.',
        icon: 'pi-database',
        route: '/clientes/empresas',
        color: '#f58634',
        visible: this.showCatalogos,
      },
      {
        label: 'Almacén',
        description: 'Checklist recepción de mercancía.',
        icon: 'pi-box',
        route: '/checklist',
        color: '#10b981',
        visible: this.auth.canView('almacen') || this.isAdmin,
      },
      {
        label: 'Usuarios',
        description: 'Administración de usuarios y permisos.',
        icon: 'pi-user-edit',
        route: '/clientes/usuarios',
        color: '#ef4444',
        visible: this.isAdmin,
      },
    ];
    return cards.filter(c => c.visible);
  }

  get showCatalogos(): boolean {
    if (this.isAdmin) return true;
    const perms = this.currentUser()?.permisos ?? {};
    const catModules = [
      'empresas',
      'cat/personalidades-juridicas',
      'cat/tipos-cliente',
      'cat/tipos-contrato',
      'cat/tipos-servicio',
      'cat/unidades-negocio',
      'cat/unidades-estrategicas',
      'cat/reglas-tipo-contrato',
    ];
    return catModules.some(m => perms[m]?.ver);
  }
}
