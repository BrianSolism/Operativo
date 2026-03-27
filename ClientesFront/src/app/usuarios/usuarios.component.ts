import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule, Table } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { API } from '../api';

interface Usuario {
  idusuario: number;
  username: string;
  nombre: string;
  es_admin: boolean;
  activo: boolean;
  fecha_registro: string;
}

interface Modulo {
  idmodulo: number;
  clave: string;
  nombre: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule,
    InputTextModule, PasswordModule, DropdownModule, CheckboxModule,
    TooltipModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="alg-container">

      <!-- HEADER -->
      <div class="alg-header">
        <div class="alg-header-diagonal"></div>
        <div class="alg-header-inner">
          <div class="alg-header-left">
            <div class="alg-icon-wrap">
              <i class="pi pi-users" style="font-size:1.8rem;color:#f58634;"></i>
            </div>
            <div>
              <span class="alg-eyebrow">Administración</span>
              <h1 class="alg-title">Gestión de Usuarios</h1>
              <p class="alg-subtitle">Administra usuarios y sus permisos por módulo.</p>
            </div>
          </div>
          <div class="alg-header-right">
            <div class="alg-stat">
              <span class="alg-stat-num">{{ usuarios().length }}</span>
              <span class="alg-stat-label">Usuarios</span>
            </div>
            <button class="alg-btn-new" (click)="openCreate()">
              <i class="pi pi-plus"></i> Nuevo usuario
            </button>
          </div>
        </div>
      </div>

      <!-- TABLA -->
      <div class="alg-card">
        <div class="alg-card-header">
          <div class="alg-card-header-bar"></div>
          <span class="alg-card-title">
            <i class="pi pi-list" style="margin-right:0.5rem;color:#f58634;"></i>
            Usuarios del sistema
          </span>
          <div class="alg-search-wrap">
            <i class="pi pi-search alg-search-icon"></i>
            <input pInputText type="text"
              [(ngModel)]="globalFilter"
              (ngModelChange)="dt.filterGlobal($event, 'contains')"
              placeholder="Buscar usuario..."
              class="alg-search-input" />
          </div>
        </div>

        <p-table #dt [value]="usuarios()" [loading]="loading()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm"
                 [globalFilterFields]="['username','nombre']">
          <ng-template pTemplate="header">
            <tr class="alg-table-header">
              <th>ID</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Registro</th>
              <th style="width:200px;text-align:center">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-u let-i="rowIndex">
            <tr class="alg-row" [class.alg-row-alt]="i % 2 !== 0">
              <td><span class="alg-id">{{ u.idusuario }}</span></td>
              <td><b>{{ u.username }}</b></td>
              <td>{{ u.nombre }}</td>
              <td>
                <span [class]="u.es_admin ? 'badge-admin' : 'badge-user'">
                  <i [class]="u.es_admin ? 'pi pi-shield' : 'pi pi-user'"></i>
                  {{ u.es_admin ? 'Administrador' : 'Usuario' }}
                </span>
              </td>
              <td>
                <span [class]="u.activo ? 'alg-status-active' : 'alg-status-inactive'">
                  <i [class]="u.activo ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>{{ u.fecha_registro | date:'dd MMM yyyy':'':'es-MX' }}</td>
              <td style="text-align:center">
                <div class="alg-action-btns">
                  <button class="alg-btn-edit" (click)="openEdit(u)" pTooltip="Editar" tooltipPosition="top">
                    <i class="pi pi-pencil"></i> Editar
                  </button>
                  <button class="alg-btn-permisos"
                    (click)="openPermisos(u)" pTooltip="Permisos" tooltipPosition="top">
                    <i class="pi pi-key"></i> Permisos
                  </button>
                  <button class="alg-btn-delete" (click)="del(u)" pTooltip="Eliminar" tooltipPosition="top">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7" class="alg-empty">Sin usuarios registrados</td></tr>
          </ng-template>
        </p-table>
      </div>

      <p-confirmDialog></p-confirmDialog>

      <!-- DIALOG CREAR/EDITAR USUARIO -->
      <p-dialog
        [header]="editUsuario() ? 'Editar usuario' : 'Nuevo usuario'"
        [visible]="dialogUser()" (visibleChange)="dialogUser.set($event)"
        [modal]="true" [style]="{width:'460px'}">

        <div style="padding:1rem 0.5rem;display:flex;flex-direction:column;gap:1.25rem;">
          <div>
            <label class="alg-label">Usuario</label>
            <input pInputText [(ngModel)]="form.username" placeholder="Nombre de usuario" class="w-full" style="border-radius:8px;" [disabled]="!!editUsuario()" />
          </div>
          <div>
            <label class="alg-label">Nombre completo</label>
            <input pInputText [(ngModel)]="form.nombre" placeholder="Nombre y apellidos" class="w-full" style="border-radius:8px;" />
          </div>
          <div>
            <label class="alg-label">{{ editUsuario() ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña' }}</label>
            <p-password [(ngModel)]="form.password" [feedback]="false" [toggleMask]="true"
              styleClass="w-full" inputStyleClass="w-full" [placeholder]="editUsuario() ? '••••••••' : 'Contraseña'">
            </p-password>
          </div>
          <div style="display:flex;gap:2rem;">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <p-checkbox [(ngModel)]="form.es_admin" [binary]="true" inputId="esAdmin"></p-checkbox>
              <label for="esAdmin" class="alg-label" style="cursor:pointer;margin:0;">Administrador</label>
            </div>
            <div *ngIf="editUsuario()" style="display:flex;align-items:center;gap:0.5rem;">
              <p-checkbox [(ngModel)]="form.activo" [binary]="true" inputId="activo"></p-checkbox>
              <label for="activo" class="alg-label" style="cursor:pointer;margin:0;">Activo</label>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="flex gap-2 justify-end">
            <button class="alg-btn-cancel" (click)="dialogUser.set(false)"><i class="pi pi-times"></i> Cancelar</button>
            <button class="alg-btn-save" (click)="saveUser()"><i class="pi pi-check"></i> Guardar</button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- DIALOG PERMISOS -->
      <p-dialog
        header="Permisos — {{ permUsuario()?.nombre }}"
        [visible]="dialogPermisos()" (visibleChange)="dialogPermisos.set($event)"
        [modal]="true" [style]="{width:'700px'}">

        <div style="padding:0.5rem 0;">
          <p style="font-size:0.82rem;color:#64748b;margin-bottom:1rem;">
            <i class="pi pi-info-circle" style="color:#f58634;"></i>
            Los usuarios <b>Administradores</b> tienen acceso total. Los permisos aplican sólo a usuarios no-admin.
          </p>

          <table class="perm-table">
            <thead>
              <tr>
                <th>Módulo</th>
                <th class="perm-center">
                  <div class="perm-col-header">
                    <span><i class="pi pi-eye"></i> Ver</span>
                    <button class="perm-col-toggle" (click)="toggleCol('puede_ver')"
                      [title]="allInCol('puede_ver') ? 'Desmarcar todos' : 'Marcar todos'">
                      <i [class]="allInCol('puede_ver') ? 'pi pi-check-square' : 'pi pi-stop'"></i>
                    </button>
                  </div>
                </th>
                <th class="perm-center">
                  <div class="perm-col-header">
                    <span><i class="pi pi-plus-circle"></i> Crear</span>
                    <button class="perm-col-toggle" (click)="toggleCol('puede_crear')"
                      [title]="allInCol('puede_crear') ? 'Desmarcar todos' : 'Marcar todos'">
                      <i [class]="allInCol('puede_crear') ? 'pi pi-check-square' : 'pi pi-stop'"></i>
                    </button>
                  </div>
                </th>
                <th class="perm-center">
                  <div class="perm-col-header">
                    <span><i class="pi pi-pencil"></i> Editar</span>
                    <button class="perm-col-toggle" (click)="toggleCol('puede_editar')"
                      [title]="allInCol('puede_editar') ? 'Desmarcar todos' : 'Marcar todos'">
                      <i [class]="allInCol('puede_editar') ? 'pi pi-check-square' : 'pi pi-stop'"></i>
                    </button>
                  </div>
                </th>
                <th class="perm-center">
                  <div class="perm-col-header">
                    <span><i class="pi pi-trash"></i> Eliminar</span>
                    <button class="perm-col-toggle" (click)="toggleCol('puede_eliminar')"
                      [title]="allInCol('puede_eliminar') ? 'Desmarcar todos' : 'Marcar todos'">
                      <i [class]="allInCol('puede_eliminar') ? 'pi pi-check-square' : 'pi pi-stop'"></i>
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of modulos; let i = index" [class.perm-row-alt]="i % 2 !== 0">
                <td class="perm-name">{{ m.nombre }}</td>
                <td class="perm-center"><p-checkbox [(ngModel)]="m.puede_ver"      [binary]="true"></p-checkbox></td>
                <td class="perm-center"><p-checkbox [(ngModel)]="m.puede_crear"    [binary]="true"></p-checkbox></td>
                <td class="perm-center"><p-checkbox [(ngModel)]="m.puede_editar"   [binary]="true"></p-checkbox></td>
                <td class="perm-center"><p-checkbox [(ngModel)]="m.puede_eliminar" [binary]="true"></p-checkbox></td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template pTemplate="footer">
          <div class="flex gap-2 justify-end" style="align-items:center;">
            <button class="perm-btn-all" (click)="toggleAll(true)">
              <i class="pi pi-check-square"></i> Marcar todo
            </button>
            <button class="perm-btn-all" style="background:#f1f5f9;color:#475569;" (click)="toggleAll(false)">
              <i class="pi pi-stop"></i> Desmarcar todo
            </button>
            <button class="alg-btn-cancel" (click)="dialogPermisos.set(false)"><i class="pi pi-times"></i> Cancelar</button>
            <button class="alg-btn-save" (click)="savePermisos()"><i class="pi pi-check"></i> Guardar permisos</button>
          </div>
        </ng-template>
      </p-dialog>

    </div>
  `,
  styles: [`
    .badge-admin {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.3rem 0.8rem; border-radius: 20px;
      font-size: 0.78rem; font-weight: 700;
      background: linear-gradient(135deg,#fef3c7,#fde68a); color: #92400e;
    }
    .badge-user {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.3rem 0.8rem; border-radius: 20px;
      font-size: 0.78rem; font-weight: 700;
      background: #eff6ff; color: #1d4ed8;
    }

    /* Tabla de permisos */
    .perm-table { width: 100%; border-collapse: collapse; }
    .perm-table th {
      background: linear-gradient(135deg, #2b5290, #1a3a6e);
      color: #fff; padding: 0.65rem 0.75rem;
      font-size: 0.78rem; font-weight: 700; letter-spacing: 0.04em;
    }
    .perm-table th:first-child { border-radius: 8px 0 0 0; }
    .perm-table th:last-child  { border-radius: 0 8px 0 0; }
    .perm-center { text-align: center; }
    .perm-name { padding: 0.6rem 0.75rem; font-size: 0.85rem; font-weight: 600; color: #1e293b; }
    .perm-row-alt { background: #f8fafc; }
    .perm-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; }

    .perm-col-header {
      display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
    }
    .perm-col-toggle {
      background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.35);
      border-radius: 5px; padding: 0.2rem 0.45rem; cursor: pointer;
      color: white; font-size: 0.78rem; line-height: 1;
      transition: background 0.15s;
    }
    .perm-col-toggle:hover { background: rgba(255,255,255,0.3); }

    .perm-btn-all {
      background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;
      border-radius: 6px; padding: 0.45rem 0.85rem; font-size: 0.8rem;
      font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;
    }
    .perm-btn-all:hover { background: #e0f2fe; }

    .alg-eyebrow {
      display: inline-block; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.12em;
      text-transform: uppercase; color: #f58634;
      background: rgba(245,134,52,0.15); border-radius: 999px; padding: 2px 10px; margin-bottom: 4px;
    }
    .alg-action-btns { display: flex; gap: 0.4rem; justify-content: center; }
    :host ::ng-deep .p-password { width: 100%; }
    :host ::ng-deep .p-password input { width: 100%; border-radius: 8px; }
  `]
})
export class UsuariosComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  usuarios = signal<Usuario[]>([]);
  globalFilter = '';
  modulos: Modulo[] = [];           // array simple: ngModel muta directamente
  loading  = signal(false);
  dialogUser    = signal(false);
  dialogPermisos = signal(false);
  editUsuario = signal<Usuario | null>(null);
  permUsuario = signal<Usuario | null>(null);
  form: any = {};

  constructor(private http: HttpClient, private confirm: ConfirmationService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any[]>(`${API}/usuarios`).subscribe(v => {
      // Castear TINYINT(0/1) a boolean para que p-checkbox funcione
      this.usuarios.set(v.map(u => ({ ...u, es_admin: !!u.es_admin, activo: !!u.activo })));
      this.loading.set(false);
    });
  }

  openCreate() {
    this.editUsuario.set(null);
    this.form = { es_admin: false, activo: true, username: '', nombre: '', password: '' };
    this.dialogUser.set(true);
  }

  openEdit(u: Usuario) {
    this.editUsuario.set(u);
    // Castear a boolean explícitamente
    this.form = { nombre: u.nombre, es_admin: !!u.es_admin, activo: !!u.activo, password: '' };
    this.dialogUser.set(true);
  }

  saveUser() {
    const u = this.editUsuario();
    const body = { ...this.form };
    if (!body.password) delete body.password;

    const req = u
      ? this.http.put(`${API}/usuarios/${u.idusuario}`, body)
      : this.http.post(`${API}/usuarios`, body);

    req.subscribe({ next: () => { this.load(); this.dialogUser.set(false); }, error: (e) => alert(e.error?.message ?? 'Error') });
  }

  openPermisos(u: Usuario) {
    this.permUsuario.set(u);
    this.http.get<any[]>(`${API}/usuarios/${u.idusuario}/permisos`).subscribe(m => {
      this.modulos = m.map(x => ({
        ...x,
        puede_ver:      !!x.puede_ver,
        puede_crear:    !!x.puede_crear,
        puede_editar:   !!x.puede_editar,
        puede_eliminar: !!x.puede_eliminar,
      }));
      this.dialogPermisos.set(true);
    });
  }

  savePermisos() {
    const u = this.permUsuario();
    if (!u) return;
    this.http.put(`${API}/usuarios/${u.idusuario}/permisos`, this.modulos).subscribe({
      next: () => this.dialogPermisos.set(false),
      error: () => alert('Error al guardar permisos')
    });
  }

  toggleAll(value: boolean) {
    this.modulos = this.modulos.map(m => ({
      ...m, puede_ver: value, puede_crear: value, puede_editar: value, puede_eliminar: value
    }));
  }

  allInCol(campo: string): boolean {
    return this.modulos.length > 0 && this.modulos.every(m => !!(m as any)[campo]);
  }

  toggleCol(campo: string) {
    const val = !this.allInCol(campo);
    this.modulos = this.modulos.map(m => ({ ...m, [campo]: val }));
  }

  del(u: Usuario) {
    this.confirm.confirm({
      message: `¿Eliminar al usuario <b>${u.nombre}</b>? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.http.delete(`${API}/usuarios/${u.idusuario}`).subscribe({
        next: () => this.load(),
        error: (e) => alert(e.error?.message ?? 'Error')
      })
    });
  }
}
