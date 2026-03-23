import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  modulo?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  visibleFn: () => boolean;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLinkActive],
  template: `
    <style>
      /* ── Layout shell ─────────────────────────────────────── */
      .shell-container {
        display: flex;
        height: 100vh;
        overflow: hidden;
        background: #f1f5f9;
      }

      /* ── Sidebar ──────────────────────────────────────────── */
      .sidebar {
        width: 240px;
        min-width: 240px;
        background: linear-gradient(180deg, #1e3f7a 0%, #2b5290 40%, #243f78 100%);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: width 0.25s ease, min-width 0.25s ease;
        z-index: 100;
        position: relative;
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.18);
      }

      .sidebar.collapsed {
        width: 64px;
        min-width: 64px;
        overflow: visible;
      }

      /* Brand */
      .sidebar-brand {
        background: rgba(0, 0, 0, 0.2);
        padding: 0 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        height: 96px;
        min-height: 96px;
        overflow: hidden;
        flex-shrink: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(4px);
      }

      .brand-icon {
        width: 80px;
        height: 80px;
        min-width: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: width 0.25s, height 0.25s;
      }

      .sidebar.collapsed .brand-icon {
        width: 44px;
        height: 44px;
        min-width: 44px;
      }

      .brand-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: brightness(0) invert(1);
        opacity: 0.95;
      }

      /* Toggle button */
      .sidebar-toggle {
        position: absolute;
        top: 20px;
        right: -13px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #f58634;
        border: 2px solid #ffffff;
        color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        transition: background 0.2s, transform 0.2s;
        z-index: 110;
      }

      .sidebar-toggle:hover {
        background: #ed5d37;
        transform: scale(1.1);
      }

      /* Nav */
      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        overflow-x: visible;
        padding: 10px 0;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.12) transparent;
      }

      .sidebar.collapsed .sidebar-nav {
        overflow-x: visible;
        overflow-y: visible;
      }

      .sidebar-nav::-webkit-scrollbar {
        width: 3px;
      }

      .sidebar-nav::-webkit-scrollbar-track {
        background: transparent;
      }

      .sidebar-nav::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 4px;
      }

      /* Section */
      .nav-section {
        margin-bottom: 4px;
      }

      .nav-section-title {
        display: block;
        font-size: 9.5px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.35);
        text-transform: uppercase;
        letter-spacing: 1.4px;
        padding: 10px 20px 4px;
        white-space: nowrap;
        overflow: hidden;
        transition: opacity 0.2s, height 0.2s, padding 0.2s;
      }

      .sidebar.collapsed .nav-section-title {
        opacity: 0;
        height: 0;
        padding: 0;
        margin: 0;
      }

      /* Nav item */
      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        margin: 2px 8px;
        border-radius: 10px;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.75);
        font-size: 13.5px;
        font-weight: 500;
        text-decoration: none;
        white-space: nowrap;
        transition: background 0.18s, color 0.18s;
        border-left: 3px solid transparent;
        position: relative;
        overflow: hidden;
      }

      .nav-item:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .nav-item.active-link {
        background: rgba(245, 134, 52, 0.18);
        border-left: 3px solid #f58634;
        color: #f9a05a;
        font-weight: 600;
      }

      .nav-item i {
        font-size: 16px;
        min-width: 20px;
        text-align: center;
        flex-shrink: 0;
      }

      .nav-item span {
        overflow: hidden;
        opacity: 1;
        transition: opacity 0.18s;
      }

      .sidebar.collapsed .nav-item {
        padding: 11px;
        margin: 2px 8px;
        justify-content: center;
        border-left: 3px solid transparent;
        overflow: visible;
      }

      .sidebar.collapsed .nav-item.active-link {
        border-left: 3px solid #f58634;
      }

      .sidebar.collapsed .nav-item span {
        opacity: 0;
        width: 0;
        overflow: hidden;
      }

      /* Tooltip for collapsed nav-item */
      .sidebar.collapsed .nav-item::after {
        content: attr(data-label);
        position: absolute;
        left: calc(100% + 12px);
        top: 50%;
        transform: translateY(-50%) translateX(-4px);
        background: #12295a;
        color: #ffffff;
        padding: 5px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.18s, transform 0.18s;
        box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        z-index: 400;
        border: 1px solid rgba(255,255,255,0.1);
      }

      .sidebar.collapsed .nav-item:hover::after {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }

      /* Dropdown wrapper */
      .nav-dropdown-wrapper {
        position: relative;
      }

      /* Dropdown toggle */
      .nav-item-dropdown {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        margin: 2px 8px;
        border-radius: 10px;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.75);
        font-size: 13.5px;
        font-weight: 500;
        white-space: nowrap;
        transition: background 0.18s, color 0.18s;
        border-left: 3px solid transparent;
        user-select: none;
      }

      .nav-item-dropdown:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .nav-item-dropdown.open {
        background: rgba(245, 134, 52, 0.12);
        color: #f9a05a;
      }

      .nav-item-dropdown i.icon-main {
        font-size: 16px;
        min-width: 20px;
        text-align: center;
        flex-shrink: 0;
      }

      .nav-item-dropdown .label {
        flex: 1;
        overflow: hidden;
        opacity: 1;
        transition: opacity 0.18s;
      }

      .nav-item-dropdown .arrow {
        font-size: 10px;
        transition: transform 0.2s;
        flex-shrink: 0;
        opacity: 0.6;
      }

      .nav-item-dropdown.open .arrow {
        transform: rotate(180deg);
      }

      .sidebar.collapsed .nav-item-dropdown {
        padding: 11px;
        margin: 2px 8px;
        justify-content: center;
        overflow: visible;
      }

      .sidebar.collapsed .nav-item-dropdown .label,
      .sidebar.collapsed .nav-item-dropdown .arrow {
        opacity: 0;
        width: 0;
        overflow: hidden;
      }

      /* Dropdown sub-items — expanded sidebar */
      .nav-submenu {
        overflow: hidden;
        max-height: 0;
        transition: max-height 0.28s ease;
      }

      .nav-submenu.open {
        max-height: 600px;
      }

      /* ── Flyout para sidebar colapsado ─────────────────────── */
      .sidebar.collapsed .nav-submenu {
        display: block;
        overflow: visible;
        max-height: none;
        position: absolute;
        left: calc(100% + 10px);
        top: 0;
        background: #12295a;
        border-radius: 12px;
        min-width: 195px;
        padding: 6px 0;
        box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08);
        opacity: 0;
        pointer-events: none;
        transform: translateX(-6px);
        transition: opacity 0.18s ease, transform 0.18s ease;
        z-index: 400;
      }

      /* Flecha decorativa del flyout */
      .sidebar.collapsed .nav-submenu::before {
        content: '';
        position: absolute;
        left: -6px;
        top: 14px;
        width: 0;
        height: 0;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-right: 6px solid #12295a;
      }

      .sidebar.collapsed .nav-dropdown-wrapper:hover .nav-submenu {
        opacity: 1;
        pointer-events: all;
        transform: translateX(0);
      }

      /* Label del flyout */
      .sidebar.collapsed .flyout-label {
        display: block;
        font-size: 9.5px;
        font-weight: 700;
        color: rgba(255,255,255,0.35);
        text-transform: uppercase;
        letter-spacing: 1.2px;
        padding: 6px 14px 4px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        margin-bottom: 4px;
      }

      .flyout-label {
        display: none;
      }

      .nav-subitem {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px 8px 40px;
        margin: 1px 6px;
        border-radius: 8px;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.7);
        font-size: 13px;
        font-weight: 400;
        text-decoration: none;
        white-space: nowrap;
        transition: background 0.15s, color 0.15s;
        border-left: 3px solid transparent;
      }

      .nav-subitem:hover {
        background: rgba(255, 255, 255, 0.09);
        color: #ffffff;
      }

      .nav-subitem.active-link {
        background: rgba(245, 134, 52, 0.15);
        border-left: 3px solid #f58634;
        color: #f9a05a;
        font-weight: 600;
      }

      .nav-subitem i {
        font-size: 13px;
        min-width: 16px;
        text-align: center;
        flex-shrink: 0;
        opacity: 0.65;
      }

      /* En flyout los subitems van sin indent extra */
      .sidebar.collapsed .nav-subitem {
        padding: 9px 14px;
        margin: 1px 6px;
      }

      /* Divider */
      .nav-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.07);
        margin: 8px 16px;
      }

      /* ── Header ───────────────────────────────────────────── */
      .top-header {
        height: 56px;
        min-height: 56px;
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.07);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        flex-shrink: 0;
        z-index: 50;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .menu-btn {
        width: 36px;
        height: 36px;
        background: transparent;
        border: none;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #64748b;
        font-size: 18px;
        transition: background 0.18s, color 0.18s;
      }

      .menu-btn:hover {
        background: #f1f5f9;
        color: #2b5290;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-badge {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .user-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2b5290, #1a3a6e);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(43, 82, 144, 0.35);
      }

      .user-greeting {
        font-size: 13.5px;
        font-weight: 500;
        color: #334155;
        white-space: nowrap;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: none;
      }

      @media (min-width: 480px) {
        .user-greeting { display: block; }
      }

      .logout-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        background: transparent;
        border: 1.5px solid #e2e8f0;
        border-radius: 9px;
        color: #64748b;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.18s, border-color 0.18s, color 0.18s;
      }

      .logout-btn:hover {
        background: #fff1f0;
        border-color: #fca5a5;
        color: #dc2626;
      }

      .logout-btn i {
        font-size: 14px;
      }

      .logout-btn span {
        display: none;
      }

      @media (min-width: 480px) {
        .logout-btn span { display: inline; }
      }

      /* ── Main area ────────────────────────────────────────── */
      .main-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .content-area {
        flex: 1;
        overflow-y: auto;
        background: #f1f5f9;
      }

      /* ── Mobile overlay ───────────────────────────────────── */
      .sidebar-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 90;
      }

      @media (max-width: 768px) {
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 100;
          transform: translateX(0);
          transition: transform 0.25s ease, width 0.25s ease;
        }

        .sidebar.collapsed {
          transform: translateX(-100%);
          width: 240px;
          min-width: 240px;
        }

        .sidebar-overlay.visible {
          display: block;
        }

        .sidebar-toggle {
          display: none;
        }
      }
    </style>

    <!-- Overlay for mobile -->
    <div
      class="sidebar-overlay"
      [class.visible]="!sidebarCollapsed && isMobile"
      (click)="sidebarCollapsed = true"
    ></div>

    <div class="shell-container">
      <!-- ── Sidebar ── -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed">

        <!-- Brand -->
        <div class="sidebar-brand">
          <div class="brand-icon"><img src="assets/logo.png" alt="ALGEBASA" /></div>
        </div>

        <!-- Desktop toggle -->
        <button
          class="sidebar-toggle"
          (click)="sidebarCollapsed = !sidebarCollapsed"
          [title]="sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'"
        >
          <i class="pi" [class.pi-chevron-left]="!sidebarCollapsed" [class.pi-chevron-right]="sidebarCollapsed"></i>
        </button>

        <!-- Navigation -->
        <nav class="sidebar-nav">

          <!-- Inicio -->
          <a
            class="nav-item"
            routerLink="/home"
            routerLinkActive="active-link"
            data-label="Inicio"
          >
            <i class="pi pi-home"></i>
            <span>Inicio</span>
          </a>

          <div class="nav-divider"></div>

          <!-- COMERCIAL section -->
          <div class="nav-section" *ngIf="showClientes">
            <span class="nav-section-title">COMERCIAL</span>

            <!-- Clientes & Contratos dropdown -->
            <div class="nav-dropdown-wrapper" *ngIf="(auth.canView('clientes') || auth.canView('contratos')) || isAdmin">
              <div
                class="nav-item-dropdown"
                [class.open]="comercialOpen"
                (click)="comercialOpen = !comercialOpen"
              >
                <i class="pi pi-briefcase icon-main"></i>
                <span class="label">Comercial</span>
                <i class="pi pi-chevron-down arrow"></i>
              </div>
              <div class="nav-submenu" [class.open]="comercialOpen">
                <span class="flyout-label">Comercial</span>
                <a
                  *ngIf="auth.canView('clientes') || isAdmin"
                  class="nav-subitem"
                  routerLink="/clientes/clientes"
                  routerLinkActive="active-link"
                >
                  <i class="pi pi-users"></i> Clientes
                </a>
                <a
                  *ngIf="auth.canView('contratos') || isAdmin"
                  class="nav-subitem"
                  routerLink="/clientes/contratos"
                  routerLinkActive="active-link"
                >
                  <i class="pi pi-file-edit"></i> Contratos
                </a>
              </div>
            </div>

            <!-- Catálogos dropdown -->
            <div class="nav-dropdown-wrapper" *ngIf="showCatalogos">
              <div
                class="nav-item-dropdown"
                [class.open]="catalogosOpen"
                (click)="catalogosOpen = !catalogosOpen"
              >
                <i class="pi pi-database icon-main"></i>
                <span class="label">Catálogos</span>
                <i class="pi pi-chevron-down arrow"></i>
              </div>
              <div class="nav-submenu" [class.open]="catalogosOpen">
                <span class="flyout-label">Catálogos</span>
                <a
                  *ngIf="auth.canView('empresas') || isAdmin"
                  class="nav-subitem"
                  routerLink="/clientes/empresas"
                  routerLinkActive="active-link"
                >
                  <i class="pi pi-building"></i> Empresas
                </a>
                <a class="nav-subitem" routerLink="/clientes/cat/personalidades-juridicas" routerLinkActive="active-link">
                  <i class="pi pi-id-card"></i> Personalidades Jurídicas
                </a>
                <a class="nav-subitem" routerLink="/clientes/cat/tipos-cliente" routerLinkActive="active-link">
                  <i class="pi pi-users"></i> Tipos de Cliente
                </a>
                <a class="nav-subitem" routerLink="/clientes/cat/tipos-contrato" routerLinkActive="active-link">
                  <i class="pi pi-file"></i> Tipos de Contrato
                </a>
                <a class="nav-subitem" routerLink="/clientes/cat/tipos-servicio" routerLinkActive="active-link">
                  <i class="pi pi-briefcase"></i> Tipos de Servicio
                </a>
                <a class="nav-subitem" routerLink="/clientes/cat/unidades-negocio" routerLinkActive="active-link">
                  <i class="pi pi-sitemap"></i> Unidades de Negocio
                </a>
                <a class="nav-subitem" routerLink="/clientes/cat/unidades-estrategicas" routerLinkActive="active-link">
                  <i class="pi pi-th-large"></i> Unidades Estratégicas
                </a>
                <a class="nav-subitem" routerLink="/clientes/cat/reglas-tipo-contrato" routerLinkActive="active-link">
                  <i class="pi pi-sliders-h"></i> Reglas Tipo Contrato
                </a>
              </div>
            </div>

          </div>

          <!-- Divider -->
          <div class="nav-divider" *ngIf="showClientes && showAlmacen"></div>

          <!-- ALMACÉN section -->
          <div class="nav-section" *ngIf="showAlmacen">
            <span class="nav-section-title">ALMACÉN</span>

            <!-- Checklists dropdown -->
            <div class="nav-dropdown-wrapper">
              <div
                class="nav-item-dropdown"
                [class.open]="almacenOpen"
                (click)="almacenOpen = !almacenOpen"
              >
                <i class="pi pi-warehouse icon-main"></i>
                <span class="label">Almacén</span>
                <i class="pi pi-chevron-down arrow"></i>
              </div>
              <div class="nav-submenu" [class.open]="almacenOpen">
                <span class="flyout-label">Almacén</span>
                <a class="nav-subitem" routerLink="/checklist" routerLinkActive="active-link">
                  <i class="pi pi-list-check"></i> Checklist de Entradas
                </a>
              </div>
            </div>

            <!-- Catálogos Almacén dropdown -->
            <div class="nav-dropdown-wrapper">
              <div
                class="nav-item-dropdown"
                [class.open]="catBodegaOpen"
                (click)="catBodegaOpen = !catBodegaOpen"
              >
                <i class="pi pi-database icon-main"></i>
                <span class="label">Catálogos</span>
                <i class="pi pi-chevron-down arrow"></i>
              </div>
              <div class="nav-submenu" [class.open]="catBodegaOpen">
                <span class="flyout-label">Catálogos</span>
                <a class="nav-subitem" routerLink="/catalogos/bodegas" routerLinkActive="active-link">
                  <i class="pi pi-building"></i> Bodegas
                </a>
                <a class="nav-subitem" routerLink="/catalogos/tipo-regimen" routerLinkActive="active-link">
                  <i class="pi pi-tag"></i> Tipos de Régimen
                </a>
                <a class="nav-subitem" routerLink="/catalogos/habilitacion" routerLinkActive="active-link">
                  <i class="pi pi-check-circle"></i> Habilitaciones
                </a>
                <a class="nav-subitem" routerLink="/catalogos/tipo-local" routerLinkActive="active-link">
                  <i class="pi pi-map-marker"></i> Tipos de Local
                </a>
                <a class="nav-subitem" routerLink="/catalogos/tipo-bodega" routerLinkActive="active-link">
                  <i class="pi pi-inbox"></i> Tipos de Bodega
                </a>
                <a class="nav-subitem" routerLink="/catalogos/region" routerLinkActive="active-link">
                  <i class="pi pi-globe"></i> Regiones
                </a>
                <a class="nav-subitem" routerLink="/catalogos/aduana" routerLinkActive="active-link">
                  <i class="pi pi-shield"></i> Aduanas
                </a>
                <a class="nav-subitem" routerLink="/catalogos/estado" routerLinkActive="active-link">
                  <i class="pi pi-map"></i> Estados
                </a>
                <a class="nav-subitem" routerLink="/catalogos/municipio" routerLinkActive="active-link">
                  <i class="pi pi-map"></i> Municipios
                </a>
                <a class="nav-subitem" routerLink="/catalogos/localidad" routerLinkActive="active-link">
                  <i class="pi pi-map-marker"></i> Localidades INEGI
                </a>
                <a class="nav-subitem" routerLink="/catalogos/colonia" routerLinkActive="active-link">
                  <i class="pi pi-home"></i> Colonias SEPOMEX
                </a>
              </div>
            </div>

          </div>

          <!-- Divider -->
          <div class="nav-divider" *ngIf="isAdmin"></div>

          <!-- ADMIN section -->
          <div class="nav-section" *ngIf="isAdmin">
            <span class="nav-section-title">ADMIN</span>

            <a
              class="nav-item"
              routerLink="/clientes/usuarios"
              routerLinkActive="active-link"
              data-label="Usuarios"
            >
              <i class="pi pi-user-edit"></i>
              <span>Usuarios</span>
            </a>

          </div>

        </nav>
      </aside>

      <!-- ── Main area ── -->
      <div class="main-area">

        <!-- Header -->
        <header class="top-header">
          <div class="header-left">
            <button class="menu-btn" (click)="toggleSidebar()" title="Menú">
              <i class="pi pi-bars"></i>
            </button>
          </div>

          <div class="header-right">
            <div class="user-badge">
              <div class="user-avatar">{{ userInitials }}</div>
              <span class="user-greeting">{{ currentUser()?.nombre }}</span>
            </div>
            <button class="logout-btn" (click)="auth.logout()">
              <i class="pi pi-power-off"></i>
              <span>Salir</span>
            </button>
          </div>
        </header>

        <!-- Content (remote MFEs load here) -->
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>

      </div>
    </div>
  `,
})
export class ShellLayoutComponent {
  auth = inject(AuthService);

  sidebarCollapsed = false;
  catalogosOpen = false;
  comercialOpen = false;
  almacenOpen = false;
  catBodegaOpen = false;
  isMobile = window.innerWidth <= 768;

  currentUser = computed(() => this.auth.currentUser());

  get isAdmin(): boolean {
    return this.currentUser()?.es_admin ?? false;
  }

  get showClientes(): boolean {
    return this.auth.canView('clientes') || this.isAdmin;
  }

  get showAlmacen(): boolean {
    return this.auth.canView('almacen') || this.isAdmin;
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

  get userInitials(): string {
    const nombre = this.currentUser()?.nombre ?? '';
    return nombre
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  private router = inject(Router);

  constructor() {
    // Listen for resize to track mobile state
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
      if (!this.isMobile) {
        this.sidebarCollapsed = false;
      }
    });

    // Start collapsed on mobile
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }

    // Auto-open dropdowns when navigating to their routes
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url = e.url as string;
      if (url.includes('/clientes/cat/') || url.includes('/clientes/empresas')) {
        this.catalogosOpen = true;
      }
      if (url.includes('/clientes/clientes') || url.includes('/clientes/contratos')) {
        this.comercialOpen = true;
      }
      if (url.includes('/checklist')) {
        this.almacenOpen = true;
      }
      if (url.includes('/catalogos/')) {
        this.catBodegaOpen = true;
      }
    });
    // Open on initial load
    const initialUrl = this.router.url;
    if (initialUrl.includes('/clientes/cat/') || initialUrl.includes('/clientes/empresas')) {
      this.catalogosOpen = true;
    }
    if (initialUrl.includes('/clientes/clientes') || initialUrl.includes('/clientes/contratos')) {
      this.comercialOpen = true;
    }
    if (initialUrl.includes('/checklist')) {
      this.almacenOpen = true;
    }
    if (initialUrl.includes('/catalogos/')) {
      this.catBodegaOpen = true;
    }
  }
}
