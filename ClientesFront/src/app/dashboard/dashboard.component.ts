import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API } from '../api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="db-container">

      <!-- ══ HERO HEADER ══ -->
      <div class="db-hero">
        <div class="db-hero-diagonal"></div>
        <div class="db-hero-inner">
          <div class="db-hero-text">
            <h1 class="db-hero-title">Grupo <span class="db-brand-orange">ALGEBASA</span></h1>
            <p class="db-hero-sub">Gestiona clientes, contratos y operaciones desde un solo lugar.</p>
          </div>
          <div class="db-hero-stats">
            <div class="db-stat-card" (click)="go('/contratos')">
              <i class="pi pi-file-edit db-stat-icon"></i>
              <span class="db-stat-num">{{ contratoCount() }}</span>
              <span class="db-stat-lbl">Contratos</span>
            </div>
            <div class="db-stat-card" (click)="go('/clientes')">
              <i class="pi pi-users db-stat-icon"></i>
              <span class="db-stat-num">{{ clienteCount() }}</span>
              <span class="db-stat-lbl">Clientes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ MÓDULOS ══ -->
      <div class="db-section-title">
        <div class="db-section-bar"></div>
        <span>Módulos del sistema</span>
      </div>

      <div class="db-modules">
        <div class="db-module-card" (click)="go('/clientes')">
          <i class="pi pi-users" style="font-size:2.2rem; color:#ed5d37;"></i>
          <h3 class="db-module-title">Clientes</h3>
          <p class="db-module-desc">Consulta, administra y organiza la información completa de todos los clientes.</p>
          <span class="db-module-link">Ver módulo <i class="pi pi-arrow-right"></i></span>
        </div>

        <div class="db-module-card" (click)="go('/contratos')">
          <i class="pi pi-file-edit" style="font-size:2.2rem; color:#2b5290;"></i>
          <h3 class="db-module-title">Contratos</h3>
          <p class="db-module-desc">Crea, administra y consulta todos los contratos registrados en el sistema.</p>
          <span class="db-module-link">Ver módulo <i class="pi pi-arrow-right"></i></span>
        </div>

        <div class="db-module-card" (click)="go('/cat/personalidades-juridicas')">
          <i class="pi pi-database" style="font-size:2.2rem; color:#ed5d37;"></i>
          <h3 class="db-module-title">Catálogos</h3>
          <p class="db-module-desc">Accede a catálogos, empresas, personalidades jurídicas y unidades de negocio.</p>
          <span class="db-module-link">Ver módulo <i class="pi pi-arrow-right"></i></span>
        </div>
      </div>

      <!-- ══ ACCIONES RÁPIDAS ══ -->
      <div class="db-section-title">
        <div class="db-section-bar"></div>
        <span>Acciones rápidas</span>
      </div>

      <div class="db-actions">
        <button class="db-action-btn db-action-primary" (click)="go('/clientes')">
          <i class="pi pi-user-plus"></i>
          <span>Nuevo Cliente</span>
        </button>
        <button class="db-action-btn db-action-secondary" (click)="go('/contratos')">
          <i class="pi pi-file-plus"></i>
          <span>Nuevo Contrato</span>
        </button>
        <button class="db-action-btn db-action-secondary" (click)="go('/cat/personalidades-juridicas')">
          <i class="pi pi-sliders-h"></i>
          <span>Catálogos</span>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .db-container { padding: 1.5rem; background: #f1f5f9; min-height: 100vh; }

    /* ── Hero ── */
    .db-hero {
      position: relative;
      background: linear-gradient(135deg, #2b5290 0%, #1a3a6e 55%, #0f2347 100%);
      border-radius: 20px;
      overflow: hidden;
      margin-bottom: 2rem;
      box-shadow: 0 16px 50px rgba(43,82,144,0.35);
    }
    .db-hero-diagonal {
      position: absolute; top: 0; right: 0;
      width: 50%; height: 100%;
      background: linear-gradient(135deg, transparent 25%, rgba(245,134,52,0.1) 100%);
      clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%);
    }
    .db-hero-inner {
      position: relative;
      display: flex; justify-content: space-between; align-items: center;
      padding: 2.5rem 3rem; gap: 2rem;
      flex-wrap: wrap;
    }
    .db-hero-title { color: white; font-size: 2.8rem; font-weight: 900; margin: 0 0 0.5rem; line-height: 1.1; }
    .db-brand-orange { color: #f58634; }
    .db-hero-sub { color: rgba(255,255,255,0.65); font-size: 1rem; margin: 0; }

    /* Stats en el hero */
    .db-hero-stats { display: flex; gap: 1rem; flex-wrap: wrap; }
    .db-stat-card {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 14px; padding: 1.2rem 1.6rem;
      display: flex; flex-direction: column; align-items: center;
      min-width: 100px; text-align: center;
      backdrop-filter: blur(4px);
      transition: background 0.2s, transform 0.15s;
      cursor: pointer;
    }
    .db-stat-card:hover { background: rgba(255,255,255,0.14); transform: translateY(-2px); }
    .db-stat-card.db-stat-warn { border-color: rgba(237,93,55,0.5); background: rgba(237,93,55,0.15); }
    .db-stat-icon { font-size: 1.3rem; color: #f58634; margin-bottom: 0.4rem; }
    .db-stat-num { font-size: 1.9rem; font-weight: 800; color: white; line-height: 1; }
    .db-stat-lbl { font-size: 0.72rem; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.25rem; }

    /* ── Section title ── */
    .db-section-title {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.8rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.1em; color: #64748b;
      margin-bottom: 1rem;
    }
    .db-section-bar { width: 4px; height: 18px; background: linear-gradient(to bottom, #f58634, #ed5d37); border-radius: 2px; }

    /* ── Módulos ── */
    .db-modules { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .db-module-card {
      background: white; border-radius: 16px;
      padding: 1.8rem 1.5rem 1.4rem;
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem;
      cursor: pointer;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
      position: relative; overflow: hidden;
    }
    .db-module-card::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0;
      height: 3px; background: linear-gradient(90deg, #2b5290, #f58634);
      transform: scaleX(0); transform-origin: left;
      transition: transform 0.25s ease;
    }
    .db-module-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(43,82,144,0.15); border-color: #c7d7f0; }
    .db-module-card:hover::after { transform: scaleX(1); }
    .db-module-title { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0; }
    .db-module-desc { font-size: 0.82rem; color: #64748b; margin: 0; line-height: 1.5; flex: 1; }
    .db-module-link {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.78rem; font-weight: 700; color: #2b5290;
      text-transform: uppercase; letter-spacing: 0.05em;
      transition: gap 0.18s;
    }
    .db-module-card:hover .db-module-link { gap: 0.55rem; }

    /* ── Acciones rápidas ── */
    .db-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
    .db-action-btn {
      display: inline-flex; align-items: center; gap: 0.6rem;
      padding: 0.85rem 1.8rem; border-radius: 10px; border: none;
      font-size: 0.95rem; font-weight: 700; cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .db-action-btn:hover { transform: translateY(-2px); }
    .db-action-primary {
      background: linear-gradient(135deg, #ed5d37, #f58634);
      color: white;
      box-shadow: 0 6px 20px rgba(237,93,55,0.35);
    }
    .db-action-primary:hover { box-shadow: 0 10px 28px rgba(237,93,55,0.5); }
    .db-action-secondary {
      background: white; color: #2b5290;
      border: 2px solid #2b5290;
      box-shadow: 0 2px 8px rgba(43,82,144,0.1);
    }
    .db-action-secondary:hover { background: #2b5290; color: white; box-shadow: 0 8px 20px rgba(43,82,144,0.25); }
  `]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  contratoCount = signal<number>(0);
  clienteCount = signal<number>(0);

  ngOnInit() {
    this.loadCounts();
  }

  loadCounts() {
    this.http.get<any[]>(`${API}/contratos`).subscribe({
      next: (data) => this.contratoCount.set(data.length),
      error: () => {}
    });
    this.http.get<any[]>(`${API}/clientes`).subscribe({
      next: (data) => this.clienteCount.set(data.length),
      error: () => {}
    });
  }

  go(path: string) {
    this.router.navigate([path]);
  }
}