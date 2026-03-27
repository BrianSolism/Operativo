import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule, Table } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API } from '../api';
import { AuthService } from '../auth/auth.service';

interface Empresa {
  idempresa: number;
  nombre: string;
  razon_social: string;
  idpersonalidadjuridica?: number;
  activo?: number;
  personalidad?: string;
  unidades_negocio?: string;
}

interface UnidadNegocio {
  idunidadnegocio: number;
  descripcion: string;
}

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    FormsModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  template: `
    <div class="alg-container">

      <!-- ══ HEADER ══ -->
      <div class="alg-header">
        <div class="alg-header-diagonal"></div>
        <div class="alg-header-inner">
          <div class="alg-header-left">
            <div class="alg-icon-wrap">
              <i class="pi pi-building" style="font-size: 1.8rem; color: #f58634;"></i>
            </div>
            <div>
              <h1 class="alg-title">Empresas</h1>
              <p class="alg-subtitle">Gestiona y administra todas las empresas del grupo.</p>
            </div>
          </div>
          <div class="alg-header-right">
            <div class="alg-stat">
              <span class="alg-stat-num">{{ items().length }}</span>
              <span class="alg-stat-label">Total</span>
            </div>
            <button class="alg-btn-new" *ngIf="auth.can('empresas','crear')" (click)="openDialog()">
              <i class="pi pi-plus"></i>
              Nueva Empresa
            </button>
          </div>
        </div>
      </div>

      <!-- ══ TABLA ══ -->
      <div class="alg-card">
        <div class="alg-card-header">
          <div class="alg-card-header-bar"></div>
          <span class="alg-card-title">
            <i class="pi pi-list" style="margin-right: 0.5rem; color: #f58634;"></i>
            Catálogo de Empresas
          </span>
          <div class="alg-search-wrap">
            <i class="pi pi-search alg-search-icon"></i>
            <input
              pInputText type="text"
              [(ngModel)]="globalFilterValue"
              (ngModelChange)="table?.filterGlobal($event, 'contains')"
              placeholder="Buscar empresa..."
              class="alg-search-input"
            />
          </div>
        </div>

        <p-table #dt [value]="items()" [loading]="loading()" [paginator]="true" [rows]="10"
                 [rowsPerPageOptions]="[5, 10, 20]"
                 [globalFilterFields]="['nombre','razon_social','personalidad','unidades_negocio']">
          <ng-template pTemplate="header">
            <tr class="alg-table-header">
              <th>ID</th>
              <th>Nombre</th>
              <th>Razón Social</th>
              <th>Personalidad</th>
              <th>Unidades de Negocio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row let-i="rowIndex">
            <tr class="alg-row" [class.alg-row-alt]="i % 2 !== 0">
              <td><span class="alg-id">#{{row.idempresa}}</span></td>
              <td class="font-medium">{{row.nombre}}</td>
              <td>{{row.razon_social}}</td>
              <td><span class="alg-badge alg-badge-blue">{{row.personalidad}}</span></td>
              <td>
                <span *ngIf="row.unidades_negocio" class="alg-badge alg-badge-orange">{{row.unidades_negocio}}</span>
                <span *ngIf="!row.unidades_negocio" class="alg-empty-cell">Sin asignar</span>
              </td>
              <td>
                <span *ngIf="row.activo !== 0" class="alg-badge alg-badge-green">Activo</span>
                <span *ngIf="row.activo === 0" class="alg-badge alg-badge-gray">Inactivo</span>
              </td>
              <td>
                <button *ngIf="auth.can('empresas','editar')" class="alg-btn-edit" (click)="edit(row)" pTooltip="Editar" tooltipPosition="top">
                  <i class="pi pi-pencil"></i> Editar
                </button>
                <button *ngIf="auth.can('empresas','eliminar')" class="alg-btn-delete" (click)="del(row)" pTooltip="Eliminar" tooltipPosition="top">
                  <i class="pi pi-trash"></i> Eliminar
                </button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7" class="alg-empty">No hay empresas registradas</td></tr>
          </ng-template>
        </p-table>
      </div>

      <p-confirmDialog></p-confirmDialog>

      <!-- ══ DIALOG ══ -->
      <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width: '620px'}" [showHeader]="false" styleClass="alg-dialog">
        <!-- Header personalizado -->
        <div class="dlg-header">
          <div class="dlg-header-icon">
            <i class="pi pi-building"></i>
          </div>
          <div>
            <h2 class="dlg-title">{{ editItem() ? 'Editar Empresa' : 'Nueva Empresa' }}</h2>
            <p class="dlg-subtitle">{{ editItem() ? 'Modifica los datos de la empresa' : 'Completa los datos para registrar una empresa' }}</p>
          </div>
          <button class="dlg-close" (click)="dialog.set(false)"><i class="pi pi-times"></i></button>
        </div>

        <!-- Body -->
        <div class="dlg-body">
          <!-- Fila 1: Nombre + Razón Social -->
          <div class="dlg-grid-2">
            <div class="dlg-field">
              <label class="dlg-label"><i class="pi pi-tag dlg-label-icon"></i>Nombre</label>
              <div class="dlg-input-wrap">
                <input pInputText [(ngModel)]="form.nombre" class="dlg-input" placeholder="Nombre comercial" />
              </div>
            </div>
            <div class="dlg-field">
              <label class="dlg-label"><i class="pi pi-file dlg-label-icon"></i>Razón Social</label>
              <div class="dlg-input-wrap">
                <input pInputText [(ngModel)]="form.razon_social" class="dlg-input" placeholder="Razón social completa" />
              </div>
            </div>
          </div>

          <!-- Personalidad Jurídica -->
          <div class="dlg-field">
            <label class="dlg-label"><i class="pi pi-briefcase dlg-label-icon"></i>Personalidad Jurídica</label>
            <p-dropdown [options]="personalidades()" optionLabel="descripcion" optionValue="idpersonalidadjuridica"
                       [(ngModel)]="form.idpersonalidadjuridica" placeholder="Selecciona una opción"
                       styleClass="dlg-dropdown"></p-dropdown>
          </div>

          <!-- UDNs -->
          <div class="dlg-field dlg-udn-section">
            <label class="dlg-label"><i class="pi pi-sitemap dlg-label-icon"></i>Unidades de Negocio</label>
            <p class="dlg-hint">Selecciona todas las UDNs que pertenecen a esta empresa</p>
            <p-multiSelect
              [options]="unidades()"
              optionLabel="descripcion"
              optionValue="idunidadnegocio"
              [(ngModel)]="udnsSeleccionadas"
              placeholder="Selecciona una o más unidades..."
              styleClass="dlg-multiselect"
              [showClear]="true"
              [filter]="true"
              filterPlaceholder="Buscar unidad..."
              display="chip">
            </p-multiSelect>
            <div *ngIf="udnsSeleccionadas.length > 0" class="dlg-udn-count">
              <i class="pi pi-check-circle"></i> {{ udnsSeleccionadas.length }} unidad{{ udnsSeleccionadas.length > 1 ? 'es' : '' }} seleccionada{{ udnsSeleccionadas.length > 1 ? 's' : '' }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dlg-footer">
          <button class="dlg-btn-cancel" (click)="dialog.set(false)">
            <i class="pi pi-times"></i> Cancelar
          </button>
          <button class="dlg-btn-save" (click)="save()" [disabled]="saving()">
            <i class="pi pi-check"></i> {{ saving() ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    /* ── Dialog custom ── */
    ::ng-deep .alg-dialog .p-dialog-content { padding: 0 !important; border-radius: 16px !important; overflow: hidden; }
    ::ng-deep .alg-dialog { border-radius: 16px !important; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.25) !important; }

    .dlg-header {
      background: linear-gradient(135deg, #2b5290 0%, #1a3a6e 60%, #0f2347 100%);
      padding: 1.5rem 1.75rem; display: flex; align-items: center; gap: 1rem; position: relative;
    }
    .dlg-header-icon {
      width: 50px; height: 50px; background: rgba(255,255,255,0.12);
      border: 2px solid rgba(245,134,52,0.5); border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      font-size: 1.4rem; color: #f58634;
    }
    .dlg-title { color: white; font-size: 1.35rem; font-weight: 800; margin: 0; }
    .dlg-subtitle { color: rgba(255,255,255,0.6); font-size: 0.82rem; margin: 0.2rem 0 0; }
    .dlg-close {
      margin-left: auto; background: rgba(255,255,255,0.1); border: none;
      color: rgba(255,255,255,0.7); width: 34px; height: 34px; border-radius: 8px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; transition: background 0.15s;
    }
    .dlg-close:hover { background: rgba(255,255,255,0.2); color: white; }

    .dlg-body { padding: 1.5rem 1.75rem; background: white; display: flex; flex-direction: column; gap: 1.25rem; }

    .dlg-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .dlg-field { display: flex; flex-direction: column; gap: 0.45rem; }
    .dlg-label {
      font-size: 0.78rem; font-weight: 700; color: #2b5290;
      text-transform: uppercase; letter-spacing: 0.6px;
      display: flex; align-items: center; gap: 0.4rem;
    }
    .dlg-label-icon { color: #f58634; font-size: 0.75rem; }
    .dlg-hint { font-size: 0.78rem; color: #94a3b8; margin: -0.2rem 0 0.2rem; }

    .dlg-input-wrap { position: relative; }
    .dlg-input {
      width: 100%; padding: 0.65rem 0.9rem;
      border: 2px solid #e2e8f0; border-radius: 10px;
      font-size: 0.9rem; color: #374151; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }
    .dlg-input:focus { border-color: #2b5290; box-shadow: 0 0 0 3px rgba(43,82,144,0.1); }

    ::ng-deep .dlg-dropdown { width: 100% !important; border: 2px solid #e2e8f0 !important; border-radius: 10px !important; }
    ::ng-deep .dlg-dropdown:hover { border-color: #2b5290 !important; }
    ::ng-deep .dlg-dropdown.p-focus { border-color: #2b5290 !important; box-shadow: 0 0 0 3px rgba(43,82,144,0.1) !important; }
    ::ng-deep .dlg-dropdown .p-dropdown-label { padding: 0.65rem 0.9rem !important; font-size: 0.9rem !important; }

    .dlg-udn-section {
      background: #f8fafc; border-radius: 12px; padding: 1rem 1.1rem;
      border: 1.5px solid #e2e8f0;
    }
    ::ng-deep .dlg-multiselect { width: 100% !important; border: 2px solid #e2e8f0 !important; border-radius: 10px !important; background: white !important; }
    ::ng-deep .dlg-multiselect:hover { border-color: #2b5290 !important; }
    ::ng-deep .dlg-multiselect.p-focus { border-color: #2b5290 !important; box-shadow: 0 0 0 3px rgba(43,82,144,0.1) !important; }
    ::ng-deep .dlg-multiselect .p-multiselect-label { padding: 0.5rem 0.9rem !important; font-size: 0.88rem !important; }
    ::ng-deep .dlg-multiselect .p-multiselect-token {
      background: #2b5290 !important; color: white !important;
      border-radius: 20px !important; padding: 0.2rem 0.6rem !important;
      font-size: 0.75rem !important; font-weight: 600 !important;
    }
    ::ng-deep .dlg-multiselect .p-multiselect-token-icon { color: rgba(255,255,255,0.7) !important; }
    ::ng-deep .dlg-multiselect .p-multiselect-token-icon:hover { color: white !important; }
    ::ng-deep .p-multiselect-panel .p-multiselect-item.p-highlight { background: #eff6ff !important; color: #1e40af !important; }
    ::ng-deep .p-multiselect-panel .p-checkbox-box.p-highlight { background: #2b5290 !important; border-color: #2b5290 !important; }
    ::ng-deep .p-multiselect-panel .p-multiselect-filter-container .p-inputtext { border-radius: 8px !important; }

    .dlg-udn-count {
      margin-top: 0.5rem; font-size: 0.78rem; font-weight: 600;
      color: #166534; background: #dcfce7; padding: 0.3rem 0.75rem;
      border-radius: 20px; display: inline-flex; align-items: center; gap: 0.35rem;
    }

    .dlg-footer {
      padding: 1rem 1.75rem 1.25rem; background: #f8fafc;
      border-top: 1px solid #e2e8f0; display: flex; gap: 0.75rem; justify-content: flex-end;
    }
    .dlg-btn-cancel {
      background: transparent; color: #6b7280; border: 2px solid #e5e7eb;
      border-radius: 10px; padding: 0.65rem 1.4rem; font-weight: 600; cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.9rem;
      transition: border-color 0.15s, color 0.15s;
    }
    .dlg-btn-cancel:hover { border-color: #9ca3af; color: #374151; }
    .dlg-btn-save {
      background: linear-gradient(135deg, #ed5d37, #f58634); color: white; border: none;
      border-radius: 10px; padding: 0.65rem 1.6rem; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.9rem;
      box-shadow: 0 4px 16px rgba(237,93,55,0.4); transition: transform 0.15s, box-shadow 0.15s;
    }
    .dlg-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
    .dlg-btn-save:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(237,93,55,0.5); }
  `]
})
export class EmpresasComponent implements OnInit {
  @ViewChild('dt') table!: Table;

  items = signal<Empresa[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialog = signal(false);
  form: Partial<Empresa> = {};
  editItem = signal<Empresa | undefined>(undefined);
  globalFilterValue = '';
  udnsSeleccionadas: number[] = [];

  personalidades = signal<any[]>([]);
  unidades = signal<UnidadNegocio[]>([]);

  constructor(private http: HttpClient, private confirm: ConfirmationService, public auth: AuthService) {}

  ngOnInit() {
    this.load();
    this.loadOptions();
  }

  load() {
    this.loading.set(true);
    this.http.get<Empresa[]>(`${API}/empresas`).subscribe(v => {
      this.items.set(v);
      this.loading.set(false);
    });
  }

  loadOptions() {
    this.http.get<any[]>(`${API}/cat/personalidades-juridicas`).subscribe(v => this.personalidades.set(v));
    this.http.get<UnidadNegocio[]>(`${API}/cat/unidades-negocio`).subscribe(v => this.unidades.set(v));
  }

  openDialog() {
    this.editItem.set(undefined);
    this.form = { activo: 1 };
    this.udnsSeleccionadas = [];
    this.dialog.set(true);
  }

  edit(item: Empresa) {
    this.editItem.set(item);
    this.form = { ...item };
    this.udnsSeleccionadas = [];
    // Cargar UDNs actuales de esta empresa
    this.http.get<any[]>(`${API}/empresas/${item.idempresa}/unidades-negocio`).subscribe(udns => {
      this.udnsSeleccionadas = udns.map(u => u.idunidadnegocio);
    });
    this.dialog.set(true);
  }

  save() {
    this.saving.set(true);
    const isNew = !this.editItem();

    const op = isNew
      ? this.http.post<Empresa>(`${API}/empresas`, this.form)
      : this.http.put<Empresa>(`${API}/empresas/${this.editItem()!.idempresa}`, this.form);

    op.subscribe({
      next: (empresa) => {
        const idempresa = isNew ? (empresa as any).idempresa : this.editItem()!.idempresa;
        this.syncUdns(idempresa, isNew);
      },
      error: () => this.saving.set(false)
    });
  }

  private syncUdns(idempresa: number, isNew: boolean) {
    if (isNew) {
      // Agregar todas las UDNs seleccionadas
      const requests = this.udnsSeleccionadas.map(id =>
        this.http.post(`${API}/empresas/${idempresa}/unidades-negocio`, { idunidadnegocio: id })
      );
      if (requests.length === 0) {
        this.finishSave();
        return;
      }
      forkJoin(requests).subscribe({ next: () => this.finishSave(), error: () => this.finishSave() });
    } else {
      // Sincronizar: cargar actuales y calcular diff
      this.http.get<any[]>(`${API}/empresas/${idempresa}/unidades-negocio`).subscribe(actuales => {
        const actualesIds = actuales.map(u => u.idunidadnegocio);
        const agregar = this.udnsSeleccionadas.filter(id => !actualesIds.includes(id));
        const quitar = actualesIds.filter(id => !this.udnsSeleccionadas.includes(id));

        const requests = [
          ...agregar.map(id => this.http.post(`${API}/empresas/${idempresa}/unidades-negocio`, { idunidadnegocio: id })),
          ...quitar.map(id => this.http.delete(`${API}/empresas/${idempresa}/unidades-negocio/${id}`))
        ];

        if (requests.length === 0) {
          this.finishSave();
          return;
        }
        forkJoin(requests).subscribe({ next: () => this.finishSave(), error: () => this.finishSave() });
      });
    }
  }

  private finishSave() {
    this.saving.set(false);
    this.load();
    this.dialog.set(false);
  }

  del(item: Empresa) {
    this.confirm.confirm({
      message: `¿Deseas eliminar la empresa <b>${item.nombre}</b>? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.http.delete(`${API}/empresas/${item.idempresa}`).subscribe(() => this.load())
    });
  }
}
