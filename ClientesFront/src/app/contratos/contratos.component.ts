import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API } from '../api';
import { AuthService } from '../auth/auth.service';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessageModule } from 'primeng/message';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { StepperModule } from 'primeng/stepper';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';

interface Contrato {
  idcontrato: number;
  cliente_nombre: string;
  representante_nombre: string;
  tipo_servicio_descripcion: string;
  tipo_contrato_descripcion: string;
  unidad_negocio_descripcion: string;
  unidad_estrategica_descripcion: string;
  empresa_nombre: string;
  tipo_cliente_descripcion: string;
  personalidad_juridica_descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Cliente {
  idcliente: number;
  nombre: string;
  idpersonalidadjuridica: number;
  personalidad_juridica_descripcion: string;
}

interface Representante {
  idrepresentante: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
}

interface UnidadNegocio {
  idunidadnegocio: number;
  descripcion: string;
}

interface TipoServicio {
  idtiposervicio: number;
  descripcion: string;
}

interface ReglaResponse {
  idregla: number;
  idtipocontrato: number | null;
  tipo_contrato_descripcion: string | null;
  incluye_en_caratula: number;
}

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    MessageModule,
    ChipModule,
    TagModule,
    StepperModule,
    FormsModule,
    TooltipModule
  ],
  template: `
    <div class="alg-container">

      <!-- ══ HEADER ══ -->
      <div class="alg-header">
        <div class="alg-header-diagonal"></div>
        <div class="alg-header-inner">
          <div class="alg-header-left">
            <div class="alg-icon-wrap">
              <i class="pi pi-file-edit" style="font-size: 1.8rem; color: #f58634;"></i>
            </div>
            <div>
              <h1 class="alg-title">Contratos</h1>
              <p class="alg-subtitle">Gestiona y consulta todos los contratos del grupo</p>
            </div>
          </div>
          <div class="alg-header-right">
            <div class="alg-stat">
              <span class="alg-stat-num">{{ contratos().length }}</span>
              <span class="alg-stat-label">Total</span>
            </div>
            <button class="alg-btn-new" *ngIf="auth.can('contratos','crear')" (click)="showCreateDialog()">
              <i class="pi pi-plus"></i>
              Nuevo Contrato
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
            Catálogo de Contratos
          </span>
          <div class="alg-search-wrap">
            <i class="pi pi-search alg-search-icon"></i>
            <input
              pInputText type="text"
              [(ngModel)]="globalFilterValue"
              (ngModelChange)="dt.filterGlobal($event, 'contains')"
              placeholder="Buscar contrato..."
              class="alg-search-input"
            />
          </div>
        </div>

        <p-table #dt [value]="contratos()" [loading]="loading()" [paginator]="true" [rows]="10"
                 [rowsPerPageOptions]="[5, 10, 20]"
                 [globalFilterFields]="['cliente_nombre','representante_nombre','tipo_servicio_descripcion','tipo_contrato_descripcion','unidad_negocio_descripcion']">
          <ng-template pTemplate="header">
            <tr class="alg-table-header">
              <th>ID</th>
              <th>Cliente</th>
              <th>Representante</th>
              <th>Tipo Servicio</th>
              <th>Tipo Contrato</th>
              <th>Unidad Negocio</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-c let-i="rowIndex">
            <tr class="alg-row" [class.alg-row-alt]="i % 2 !== 0">
              <td><span class="alg-id">#{{ c.idcontrato }}</span></td>
              <td class="font-medium">{{ c.cliente_nombre }}</td>
              <td>{{ c.representante_nombre }}</td>
              <td><span class="alg-badge alg-badge-blue">{{ c.tipo_servicio_descripcion }}</span></td>
              <td><span class="alg-badge alg-badge-orange">{{ c.tipo_contrato_descripcion }}</span></td>
              <td>{{ c.unidad_negocio_descripcion }}</td>
              <td>{{ c.fecha_inicio | date:'dd/MM/yyyy' }}</td>
              <td>{{ c.fecha_fin | date:'dd/MM/yyyy' }}</td>
              <td>
                <button class="alg-btn-ver" (click)="viewContrato(c)" pTooltip="Ver detalle" tooltipPosition="top">
                  <i class="pi pi-eye"></i> Ver
                </button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="9" class="alg-empty">No hay contratos registrados</td></tr>
          </ng-template>
        </p-table>
      </div>

      <!-- ══ DIALOG CREAR ══ -->
      <p-dialog
        header="Nuevo Contrato"
        [(visible)]="createDialogVisible"
        [modal]="true"
        [style]="{ width: '70vw' }"
        [closable]="false"
      >
        <p-stepper>
          <p-stepperPanel header="Cliente">
            <ng-template pTemplate="content">
              <div class="alg-form-section">
                <label class="alg-label">Cliente</label>
                <p-dropdown
                  [options]="clientes()"
                  optionLabel="nombre"
                  optionValue="idcliente"
                  [(ngModel)]="newContrato.idcliente"
                  (onChange)="onClienteChange()"
                  placeholder="Seleccionar cliente"
                  appendTo="body"
                  class="w-full"
                ></p-dropdown>
                @if (selectedCliente()) {
                  <p-chip
                    [label]="selectedCliente()!.personalidad_juridica_descripcion"
                    class="mt-3"
                    styleClass="alg-chip"
                  ></p-chip>
                }
              </div>
            </ng-template>
          </p-stepperPanel>

          <p-stepperPanel header="Representante">
            <ng-template pTemplate="content">
              <div class="alg-form-section">

                <!-- Toggle modo -->
                <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;">
                  <button [class]="modoRep==='existente' ? 'alg-btn-save' : 'alg-btn-cancel'"
                    (click)="modoRep='existente'">
                    <i class="pi pi-users"></i> Seleccionar existente
                  </button>
                  <button [class]="modoRep==='nuevo' ? 'alg-btn-save' : 'alg-btn-cancel'"
                    (click)="modoRep='nuevo'; newContrato.idrepresentante=null">
                    <i class="pi pi-user-plus"></i> Agregar nuevo
                  </button>
                </div>

                <!-- Seleccionar existente -->
                @if (modoRep === 'existente') {
                  @if (representantes().length) {
                    <div>
                      <label class="alg-label">Representante</label>
                      <p-dropdown
                        [options]="representantes()"
                        optionLabel="nombre"
                        optionValue="idrepresentante"
                        [(ngModel)]="newContrato.idrepresentante"
                        (onChange)="onRepresentanteChange()"
                        placeholder="Seleccionar representante"
                        appendTo="body"
                        class="w-full">
                      </p-dropdown>
                      @if (repSeleccionado()) {
                        <div style="margin-top:1rem;padding:0.75rem 1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:0.85rem;color:#475569;">
                          @if (repSeleccionado()!.telefono) {
                            <div><i class="pi pi-phone" style="margin-right:0.4rem;color:#f58634;"></i>{{ repSeleccionado()!.telefono }}</div>
                          }
                          @if (repSeleccionado()!.email) {
                            <div style="margin-top:0.25rem;"><i class="pi pi-envelope" style="margin-right:0.4rem;color:#f58634;"></i>{{ repSeleccionado()!.email }}</div>
                          }
                        </div>
                      }
                    </div>
                  } @else {
                    <p-message severity="info" text="No hay representantes registrados para este cliente. Usa 'Agregar nuevo'."></p-message>
                  }
                }

                <!-- Crear nuevo -->
                @if (modoRep === 'nuevo') {
                  <div style="margin-bottom:1rem;">
                    <label class="alg-label">Nombre <span style="color:#ef4444">*</span></label>
                    <input pInputText [(ngModel)]="nuevoRep.nombre" class="w-full alg-input" placeholder="Nombre completo del representante" />
                  </div>
                  <div style="margin-bottom:1rem;">
                    <label class="alg-label">Teléfono</label>
                    <input pInputText [(ngModel)]="nuevoRep.telefono" class="w-full alg-input" placeholder="477 123 4567" />
                  </div>
                  <div>
                    <label class="alg-label">Correo electrónico</label>
                    <input pInputText [(ngModel)]="nuevoRep.email" class="w-full alg-input" placeholder="correo@empresa.com" />
                  </div>
                }

              </div>
            </ng-template>
          </p-stepperPanel>

          <p-stepperPanel header="Servicio y UDN">
            <ng-template pTemplate="content">
              <div class="alg-form-section">
                <div class="mb-4">
                  <label class="alg-label">Unidad de Negocio</label>
                  <p-dropdown
                    [options]="unidadesNegocio()"
                    optionLabel="descripcion"
                    optionValue="idunidadnegocio"
                    [(ngModel)]="newContrato.idunidadnegocio"
                    placeholder="Seleccionar UDN"
                    appendTo="body"
                    class="w-full"
                  ></p-dropdown>
                </div>
                <div class="mb-4">
                  <label class="alg-label">Tipo de Servicio</label>
                  <p-dropdown
                    [options]="tiposServicio()"
                    optionLabel="descripcion"
                    optionValue="idtiposervicio"
                    [(ngModel)]="newContrato.idtiposervicio"
                    (onChange)="onServicioChange()"
                    placeholder="Seleccionar servicio"
                    appendTo="body"
                    class="w-full"
                  ></p-dropdown>
                </div>
                @if (reglaError()) {
                  <p-message severity="error" [text]="reglaError()!"></p-message>
                } @else if (reglaData()) {
                  @if (reglaData()!.idtipocontrato) {
                    <p-tag [value]="reglaData()!.tipo_contrato_descripcion!" severity="warning" class="mt-2"></p-tag>
                  } @else if (reglaData()!.incluye_en_caratula) {
                    <p-message severity="info" text="Este servicio se incluye en la carátula del contrato principal"></p-message>
                  }
                }
              </div>
            </ng-template>
          </p-stepperPanel>

          <p-stepperPanel header="Fechas">
            <ng-template pTemplate="content">
              <div class="alg-form-section">
                <div class="mb-4">
                  <label class="alg-label">Fecha Inicio</label>
                  <p-calendar [(ngModel)]="newContrato.fecha_inicio" (onSelect)="onFechaInicioChange($event)" dateFormat="dd/mm/yy" appendTo="body" class="w-full"></p-calendar>
                </div>
                <div class="mb-4">
                  <label class="alg-label">Fecha Fin</label>
                  <p-calendar [(ngModel)]="newContrato.fecha_fin" (onSelect)="onFechaFinChange($event)" dateFormat="dd/mm/yy" appendTo="body" class="w-full"></p-calendar>
                </div>
                @if (fechaError()) {
                  <p-message severity="error" [text]="fechaError()!"></p-message>
                }
              </div>
            </ng-template>
          </p-stepperPanel>
        </p-stepper>

        <ng-template pTemplate="footer">
          <div class="flex gap-2 justify-end">
            <button class="alg-btn-cancel" (click)="hideCreateDialog()">
              <i class="pi pi-times"></i> Cancelar
            </button>
            <button class="alg-btn-save" (click)="createContrato()" [disabled]="!canSave()">
              <i class="pi pi-check"></i> Guardar
            </button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- ══ DIALOG DETALLE ══ -->
      <p-dialog
        header="Detalle del Contrato"
        [(visible)]="detailDialogVisible"
        [modal]="true"
        [style]="{ width: '60vw' }"
      >
        @if (selectedContrato()) {
          <div class="alg-detail">
            <div class="alg-detail-header">
              <span class="alg-detail-id">#{{ selectedContrato()!.idcontrato }}</span>
              <span class="alg-detail-cliente">{{ selectedContrato()!.cliente_nombre }}</span>
            </div>

            <!-- Sección: Organización -->
            <div class="alg-detail-section-sep">
              <i class="pi pi-sitemap" style="color:#f58634;"></i> Organización
            </div>
            <div class="alg-detail-grid">
              <div class="alg-detail-item">
                <span class="alg-detail-key"><i class="pi pi-building"></i> Empresa</span>
                <span class="alg-detail-val">{{ selectedContrato()!.empresa_nombre || '—' }}</span>
              </div>
              <div class="alg-detail-item">
                <span class="alg-detail-key"><i class="pi pi-sitemap"></i> UDN Estratégica</span>
                <span class="alg-detail-val">{{ selectedContrato()!.unidad_estrategica_descripcion || '—' }}</span>
              </div>
              <div class="alg-detail-item alg-detail-item-full">
                <span class="alg-detail-key"><i class="pi pi-th-large"></i> UDN Individual</span>
                <span class="alg-detail-val">{{ selectedContrato()!.unidad_negocio_descripcion }}</span>
              </div>
            </div>

            <!-- Sección: Cliente -->
            <div class="alg-detail-section-sep">
              <i class="pi pi-user" style="color:#f58634;"></i> Cliente
            </div>
            <div class="alg-detail-grid">
              <div class="alg-detail-item">
                <span class="alg-detail-key"><i class="pi pi-users"></i> Tipo de Cliente</span>
                <span class="alg-detail-val">{{ selectedContrato()!.tipo_cliente_descripcion || '—' }}</span>
              </div>
              <div class="alg-detail-item">
                <span class="alg-detail-key"><i class="pi pi-id-card"></i> Personalidad Jurídica</span>
                <span class="alg-detail-val">{{ selectedContrato()!.personalidad_juridica_descripcion || '—' }}</span>
              </div>
              <div class="alg-detail-item">
                <span class="alg-detail-key"><i class="pi pi-user"></i> Representante</span>
                <span class="alg-detail-val">{{ selectedContrato()!.representante_nombre || '—' }}</span>
              </div>
            </div>

            <!-- Sección: Contrato -->
            <div class="alg-detail-section-sep">
              <i class="pi pi-file-edit" style="color:#f58634;"></i> Contrato
            </div>
            <div class="alg-detail-grid">
              <div class="alg-detail-item">
                <span class="alg-detail-key"><i class="pi pi-tag"></i> Servicio</span>
                <span class="alg-badge alg-badge-blue">{{ selectedContrato()!.tipo_servicio_descripcion }}</span>
              </div>
              <div class="alg-detail-item">
                <span class="alg-detail-key"><i class="pi pi-file"></i> Tipo Contrato</span>
                <span class="alg-badge alg-badge-orange">{{ selectedContrato()!.tipo_contrato_descripcion || '—' }}</span>
              </div>
              <div class="alg-detail-item">
                <span class="alg-detail-key"><i class="pi pi-calendar"></i> Fecha Inicio</span>
                <span class="alg-detail-val">{{ selectedContrato()!.fecha_inicio | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="alg-detail-item">
                <span class="alg-detail-key"><i class="pi pi-calendar-times"></i> Fecha Fin</span>
                <span class="alg-detail-val">{{ selectedContrato()!.fecha_fin | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <!-- Servicios en Carátula -->
            <div class="alg-detail-section">
              <h3 class="alg-detail-section-title">
                <i class="pi pi-list" style="color: #f58634;"></i> Servicios en Carátula
              </h3>
              @if (serviciosCaratula().length > 0) {
                <div class="flex flex-wrap gap-2">
                  <p-chip *ngFor="let s of serviciosCaratula()" [label]="s.descripcion" styleClass="alg-chip"></p-chip>
                </div>
              } @else {
                <p class="alg-empty-small">No hay servicios adicionales en carátula</p>
              }
            </div>
          </div>
        }
      </p-dialog>
    </div>
  `,
  styles: [`
    /* ── Contratos: botón ver ── */
    .alg-btn-ver {
      background: linear-gradient(135deg, #2b5290, #1e3a8a);
      color: white; border: none; border-radius: 8px;
      padding: 0.4rem 0.9rem; font-size: 0.82rem; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;
      transition: opacity 0.15s;
    }
    .alg-btn-ver:hover { opacity: 0.85; }
    .alg-empty { text-align: center; color: #9ca3af; padding: 2rem; }

    /* ── Form dialogs ── */
    ::ng-deep .alg-chip.p-chip { background: #ffedd5 !important; color: #c2410c !important; font-weight: 600; }

    /* ── Detail dialog ── */
    .alg-detail { padding: 0.5rem; }
    .alg-detail-header {
      display: flex; align-items: center; gap: 1rem;
      background: linear-gradient(135deg, #2b5290, #1a3a6e);
      border-radius: 10px; padding: 1rem 1.5rem; margin-bottom: 1.25rem;
    }
    .alg-detail-id { font-size: 1.5rem; font-weight: 800; color: #f58634; }
    .alg-detail-cliente { font-size: 1.1rem; font-weight: 700; color: white; }
    .alg-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem; }
    .alg-detail-item {
      background: #f8fafc; border-radius: 8px; padding: 0.75rem 1rem;
      border-left: 3px solid #2b5290;
    }
    .alg-detail-key { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 0.3rem; }
    .alg-detail-val { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
    .alg-detail-section-sep {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
      color: #2b5290; background: #f1f5f9; border-radius: 6px;
      padding: 0.4rem 0.75rem; margin-bottom: 0.75rem;
    }
    .alg-detail-item-full { grid-column: 1 / -1; }
    .alg-detail-section { border-top: 2px solid #f1f5f9; padding-top: 1rem; }
    .alg-detail-section-title { font-weight: 700; color: #2b5290; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
    .alg-empty-small { color: #9ca3af; font-style: italic; font-size: 0.9rem; }
  `]
})
export class ContratosComponent implements OnInit {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  contratos = signal<Contrato[]>([]);
  clientes = signal<Cliente[]>([]);
  representantes = signal<Representante[]>([]);
  unidadesNegocio = signal<UnidadNegocio[]>([]);
  tiposServicio = signal<TipoServicio[]>([]);
  serviciosCaratula = signal<any[]>([]);

  loading = signal(false);
  createDialogVisible = false;
  detailDialogVisible = false;
  globalFilterValue = '';

  selectedCliente = signal<Cliente | null>(null);
  selectedContrato = signal<Contrato | null>(null);
  reglaData = signal<ReglaResponse | null>(null);
  reglaError = signal<string | null>(null);
  fechaError = signal<string | null>(null);

  modoRep: 'existente' | 'nuevo' = 'existente';
  nuevoRep = { nombre: '', telefono: '', email: '' };

  repSeleccionado = signal<Representante | null>(null);

  newContrato = {
    idcliente: null as number | null,
    idrepresentante: null as number | null,
    idtiposervicio: null as number | null,
    idunidadnegocio: null as number | null,
    fecha_inicio: null as Date | null,
    fecha_fin: null as Date | null
  };

  ngOnInit() {
    this.loadContratos();
    this.loadClientes();
    this.loadUnidadesNegocio();
    this.loadTiposServicio();
  }

  loadContratos() {
    this.loading.set(true);
    this.http.get<Contrato[]>(`${API}/contratos`).subscribe({
      next: (data) => {
        this.contratos.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading contratos', error);
        this.loading.set(false);
      }
    });
  }

  loadClientes() {
    this.http.get<Cliente[]>(`${API}/clientes`).subscribe({
      next: (data) => this.clientes.set(data),
      error: (error) => console.error('Error loading clientes', error)
    });
  }

  loadUnidadesNegocio() {
    this.http.get<UnidadNegocio[]>(`${API}/cat/unidades-negocio`).subscribe({
      next: (data) => this.unidadesNegocio.set(data),
      error: (error) => console.error('Error loading unidades negocio', error)
    });
  }

  loadTiposServicio() {
    this.http.get<TipoServicio[]>(`${API}/cat/tipos-servicio`).subscribe({
      next: (data) => this.tiposServicio.set(data),
      error: (error) => console.error('Error loading tipos servicio', error)
    });
  }

  showCreateDialog() {
    this.createDialogVisible = true;
    this.resetForm();
  }

  hideCreateDialog() {
    this.createDialogVisible = false;
    this.resetForm();
  }

  resetForm() {
    this.newContrato = {
      idcliente: null,
      idrepresentante: null,
      idtiposervicio: null,
      idunidadnegocio: null,
      fecha_inicio: null,
      fecha_fin: null
    };
    this.selectedCliente.set(null);
    this.reglaData.set(null);
    this.reglaError.set(null);
    this.fechaError.set(null);
    this.modoRep = 'existente';
    this.nuevoRep = { nombre: '', telefono: '', email: '' };
    this.representantes.set([]);
    this.repSeleccionado.set(null);
  }

  onClienteChange() {
    const cliente = this.clientes().find(c => c.idcliente === this.newContrato.idcliente);
    this.selectedCliente.set(cliente || null);

    if (cliente) {
      this.loadRepresentantesPorCliente(cliente.idcliente);
      if (this.newContrato.idtiposervicio) {
        this.checkRegla();
      }
    } else {
      this.reglaData.set(null);
      this.reglaError.set(null);
    }
  }

  onFechaInicioChange(date: Date) {
    const fin = new Date(date);
    fin.setFullYear(fin.getFullYear() + 1);
    this.newContrato.fecha_fin = fin;
  }

  loadRepresentantesPorCliente(idcliente: number) {
    this.http.get<Representante[]>(`${API}/representantes/por-cliente/${idcliente}`).subscribe({
      next: (data) => {
        this.representantes.set(data);
        this.modoRep = data.length ? 'existente' : 'nuevo';
        this.newContrato.idrepresentante = null;
        this.repSeleccionado.set(null);
      },
      error: () => {}
    });
  }

  onRepresentanteChange() {
    const rep = this.representantes().find(r => r.idrepresentante === this.newContrato.idrepresentante);
    this.repSeleccionado.set(rep ?? null);
  }

  onServicioChange() {
    if (this.newContrato.idtiposervicio && this.selectedCliente()) {
      this.checkRegla();
    }
  }

  checkRegla() {
    const params = new URLSearchParams({
      idtiposervicio: this.newContrato.idtiposervicio!.toString(),
      idpersonalidadjuridica: this.selectedCliente()!.idpersonalidadjuridica.toString()
    });

    this.http.get<ReglaResponse>(`${API}/contratos/regla?${params}`).subscribe({
      next: (data) => {
        this.reglaData.set(data);
        this.reglaError.set(null);
      },
      error: (error) => {
        this.reglaData.set(null);
        this.reglaError.set('Combinación de servicio y personalidad jurídica no válida');
      }
    });
  }

  onFechaFinChange(date: Date) {
    if (this.newContrato.fecha_inicio) {
      const inicio = new Date(this.newContrato.fecha_inicio);
      this.fechaError.set(date <= inicio ? 'La fecha de fin debe ser posterior a la fecha de inicio' : null);
    }
  }

  canSave(): boolean {
    return !!(
      this.newContrato.idcliente &&
      this.newContrato.idunidadnegocio &&
      this.newContrato.idtiposervicio &&
      this.newContrato.fecha_inicio &&
      this.newContrato.fecha_fin &&
      !this.fechaError() &&
      this.reglaData() &&
      !this.reglaError()
    );
  }

  createContrato() {
    if (!this.canSave()) return;

    const doPost = (idrepresentante: number | null) => {
      const contratoData = {
        ...this.newContrato,
        idrepresentante,
        fecha_inicio: (this.newContrato.fecha_inicio as Date).toISOString().split('T')[0],
        fecha_fin: (this.newContrato.fecha_fin as Date).toISOString().split('T')[0]
      };
      this.http.post(`${API}/contratos`, contratoData).subscribe({
        next: () => { this.loadContratos(); this.hideCreateDialog(); },
        error: (error) => {
          if (error.error?.error) this.reglaError.set(error.error.error);
        }
      });
    };

    if (this.modoRep === 'nuevo' && this.nuevoRep.nombre.trim()) {
      this.http.post<any>(`${API}/representantes`, {
        idcliente: this.newContrato.idcliente,
        nombre: this.nuevoRep.nombre.trim(),
        telefono: this.nuevoRep.telefono || null,
        email: this.nuevoRep.email || null
      }).subscribe({
        next: (rep) => doPost(rep.idrepresentante),
        error: () => doPost(this.newContrato.idrepresentante)
      });
    } else {
      doPost(this.newContrato.idrepresentante);
    }
  }

  viewContrato(contrato: Contrato) {
    this.selectedContrato.set(contrato);
    this.detailDialogVisible = true;

    // Load servicios en carátula
    this.http.get(`${API}/contratos/${contrato.idcontrato}/servicios-caratula`).subscribe({
      next: (data: any) => this.serviciosCaratula.set(data),
      error: (error) => console.error('Error loading servicios caratula', error)
    });
  }
}