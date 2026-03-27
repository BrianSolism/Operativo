import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule, Table } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { API } from '../api';
import { AuthService } from '../auth/auth.service';

// RFC mexicano: 3-4 letras + 6 dígitos de fecha + 3 alfanuméricos homoclave
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;

interface Cliente {
  idcliente: number;
  nombre: string;
  rfc: string;
  calle?: string;
  numero?: string;
  colonia?: string;
  cp?: string;
  ciudad?: string;
  estado?: string;
  pais?: string;
  idtipocliente?: number;
  idpersonalidadjuridica?: number;
  activo?: number;
  tipo_cliente_descripcion: string;
  personalidad_juridica_descripcion: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    FormsModule,
    TooltipModule,
    ConfirmDialogModule
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
              <i class="pi pi-users" style="font-size: 1.8rem; color: #f58634;"></i>
            </div>
            <div>
              <h1 class="alg-title">Clientes</h1>
              <p class="alg-subtitle">Crea, administra y consulta toda la información de tus clientes.</p>
            </div>
          </div>
          <div class="alg-header-right">
            <div class="alg-stat">
              <span class="alg-stat-num">{{ items().length }}</span>
              <span class="alg-stat-label">Total</span>
            </div>
            <button class="alg-btn-new" *ngIf="auth.can('clientes','crear')" (click)="openDialog()">
              <i class="pi pi-plus"></i>
              Nuevo Cliente
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
            Catálogo De Clientes
          </span>
          <div class="alg-search-wrap">
            <i class="pi pi-search alg-search-icon"></i>
            <input
              pInputText type="text"
              [(ngModel)]="globalFilterValue"
              (ngModelChange)="table?.filterGlobal($event, 'contains')"
              placeholder="Buscar por nombre, RFC, ciudad..."
              class="alg-search-input"
            />
          </div>
        </div>

        <p-table #dt [value]="items()" [loading]="loading()" [paginator]="true" [rows]="10"
                 [rowsPerPageOptions]="[5, 10, 20]"
                 [globalFilterFields]="['nombre','rfc','calle','colonia','ciudad','estado','cp']">
          <ng-template pTemplate="header">
            <tr class="alg-table-header">
              <th>ID</th>
              <th>Nombre</th>
              <th>RFC</th>
              <th>Dirección</th>
              <th>Tipo</th>
              <th>Personalidad</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row let-i="rowIndex">
            <tr class="alg-row" [class.alg-row-alt]="i % 2 !== 0">
              <td><span class="alg-id">#{{row.idcliente}}</span></td>
              <td class="font-medium">{{row.nombre}}</td>
              <td><span class="alg-mono">{{row.rfc}}</span></td>
              <td class="alg-addr-cell">
                <span *ngIf="row.calle">{{row.calle}} {{row.numero}}</span>
                <span *ngIf="row.colonia" class="alg-addr-sub">{{row.colonia}}</span>
                <span *ngIf="row.cp || row.ciudad" class="alg-addr-sub">
                  <span *ngIf="row.cp">CP {{row.cp}}</span>
                  <span *ngIf="row.cp && row.ciudad">, </span>
                  <span *ngIf="row.ciudad">{{row.ciudad}}</span>
                  <span *ngIf="row.estado">, {{row.estado}}</span>
                </span>
                <span *ngIf="!row.calle" class="alg-addr-empty">—</span>
              </td>
              <td><span class="alg-badge alg-badge-blue">{{row.tipo_cliente_descripcion}}</span></td>
              <td><span class="alg-badge alg-badge-orange">{{row.personalidad_juridica_descripcion}}</span></td>
              <td>
                <button *ngIf="auth.can('clientes','editar')" class="alg-btn-edit" (click)="edit(row)" pTooltip="Editar" tooltipPosition="top">
                  <i class="pi pi-pencil"></i> Editar
                </button>
                <button *ngIf="auth.can('clientes','eliminar')" class="alg-btn-delete" (click)="del(row)" pTooltip="Eliminar" tooltipPosition="top">
                  <i class="pi pi-trash"></i> Eliminar
                </button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7" class="alg-empty">No Hay Clientes Registrados</td></tr>
          </ng-template>
        </p-table>
      </div>

      <p-confirmDialog></p-confirmDialog>

      <!-- ══ DIALOG ══ -->
      <p-dialog header="{{editItem()? 'Editar Cliente':'Nuevo Cliente'}}" [visible]="dialog()" (visibleChange)="dialog.set($event)" [modal]="true" [style]="{width: '640px'}">
        <div class="alg-form">

          <!-- Nombre -->
          <div class="alg-form-section">
            <label class="alg-label">
              <i class="pi pi-building" style="color:#f58634; margin-right:4px;"></i>
              Nombre
            </label>
            <input pInputText [(ngModel)]="form.nombre" class="w-full alg-input"
                   placeholder="Ej: Empresa ABC S.A. de C.V." />
          </div>

          <!-- RFC con validación -->
          <div class="alg-form-section">
            <label class="alg-label">
              <i class="pi pi-id-card" style="color:#f58634; margin-right:4px;"></i>
              RFC
              <span class="alg-label-hint">Personas físicas: 13 chars · personas morales: 12 chars</span>
            </label>
            <div class="alg-rfc-wrap">
              <input pInputText
                [(ngModel)]="form.rfc"
                (ngModelChange)="onRfcChange($event)"
                (blur)="rfcTouched = true"
                [class.alg-input-error]="rfcTouched && !!rfcError"
                [class.alg-input-ok]="rfcTouched && !rfcError && !!form.rfc"
                class="w-full alg-input alg-rfc-input"
                placeholder="Ej: ABC123456XYZ"
                maxlength="13"
              />
              <span class="alg-rfc-counter"
                    [class.alg-counter-ok]="(form.rfc?.length === 12 || form.rfc?.length === 13)"
                    [class.alg-counter-err]="rfcTouched && !!rfcError">
                {{ (form.rfc || '').length }}/13
              </span>
              @if (rfcTouched && !rfcError && form.rfc) {
                <span class="alg-rfc-icon alg-icon-ok"><i class="pi pi-check-circle"></i></span>
              }
              @if (rfcTouched && rfcError) {
                <span class="alg-rfc-icon alg-icon-err"><i class="pi pi-times-circle"></i></span>
              }
            </div>
            @if (rfcTouched && rfcError) {
              <div class="alg-msg alg-msg-error">
                <i class="pi pi-exclamation-triangle"></i> {{ rfcError }}
              </div>
            }
            @if (rfcTouched && !rfcError && form.rfc) {
              <div class="alg-msg alg-msg-ok">
                <i class="pi pi-check"></i> RFC Válido — {{ rfcTipo }}
              </div>
            }
          </div>

          <!-- ══ Quién es Quién ══ -->
          <div class="alg-section-sep">
            <i class="pi pi-shield"></i> Validación Quién es Quién
          </div>
          <div class="alg-form-section">
            <button class="alg-btn-qeq"
                    [disabled]="(!form.nombre && !form.rfc) || qeqLoading()"
                    (click)="validarQeQ()">
              @if (qeqLoading()) {
                <i class="pi pi-spin pi-spinner"></i> Validando...
              } @else {
                <i class="pi pi-search"></i> Validar en Quién es Quién
              }
            </button>

            @if (qeqBuscado() && !qeqLoading()) {
              @if (qeqError()) {
                <div class="alg-qeq-warn">
                  <i class="pi pi-exclamation-triangle"></i> {{ qeqError() }}
                </div>
              } @else if (qeqResultados().length === 0) {
                <div class="alg-qeq-clean">
                  <i class="pi pi-check-circle"></i>
                  <span>Sin coincidencias en listas de riesgo</span>
                </div>
              } @else {
                <div class="alg-qeq-alert">
                  <div class="alg-qeq-alert-header">
                    <i class="pi pi-exclamation-triangle"></i>
                    <strong>¡Atención!</strong>&nbsp;{{ qeqResultados().length }} coincidencia(s) encontrada(s)
                  </div>
                  <div class="alg-qeq-results-body">
                    @for (r of qeqResultados(); track $index) {
                      <div class="alg-qeq-result">
                        <div class="alg-qeq-result-name">
                          {{ r.NOMBRECOMP || ((r.NOMBRE || '') + ' ' + (r.PATERNO || '') + ' ' + (r.MATERNO || '')).trim() }}
                        </div>
                        <div class="alg-qeq-result-meta">
                          @if (r.LISTA) {
                            <span class="alg-qeq-tag alg-qeq-tag-lista">{{ r.LISTA }}</span>
                          }
                          @if (r.CATEGORIA_RIESGO) {
                            <span class="alg-qeq-tag alg-qeq-tag-cat">{{ r.CATEGORIA_RIESGO }}</span>
                          }
                          @if (r.COINCIDENCIA) {
                            <span class="alg-qeq-tag alg-qeq-tag-pct">{{ r.COINCIDENCIA }}% coincidencia</span>
                          }
                          @if (r.ESTATUS) {
                            <span class="alg-qeq-tag alg-qeq-tag-est">{{ r.ESTATUS }}</span>
                          }
                        </div>
                        @if (r.PUESTO || r.DEPENDENCIA) {
                          <div class="alg-qeq-result-detail">
                            @if (r.PUESTO) { <span>{{ r.PUESTO }}</span> }
                            @if (r.DEPENDENCIA) { <span class="alg-qeq-dep">{{ r.DEPENDENCIA }}</span> }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>

          <!-- Separador Dirección -->
          <div class="alg-section-sep">
            <i class="pi pi-map-marker"></i> Dirección
          </div>

          <!-- Calle + Número -->
          <div class="alg-form-row">
            <div style="flex:3; min-width:0;">
              <label class="alg-label">Calle <span class="alg-required">*</span></label>
              <input pInputText [(ngModel)]="form.calle" class="w-full alg-input" placeholder="Nombre de la calle" />
            </div>
            <div style="flex:1; min-width:0;">
              <label class="alg-label">Número</label>
              <input pInputText [(ngModel)]="form.numero" class="w-full alg-input" placeholder="123 Int. A" />
            </div>
          </div>

          <!-- Colonia + CP -->
          <div class="alg-form-row">
            <div style="flex:2; min-width:0;">
              <label class="alg-label">Colonia</label>
              <p-dropdown *ngIf="cpColonias.length"
                [options]="cpColonias"
                [(ngModel)]="form.colonia"
                placeholder="— Selecciona colonia —"
                [filter]="true" filterPlaceholder="Buscar..."
                appendTo="body"
                class="w-full" styleClass="alg-dd">
              </p-dropdown>
              <input *ngIf="!cpColonias.length" pInputText [(ngModel)]="form.colonia" class="w-full alg-input" placeholder="Nombre de la colonia" />
            </div>
            <div style="flex:1; min-width:0;">
              <label class="alg-label">
                C.P.
                <i *ngIf="cpLoading" class="pi pi-spin pi-spinner" style="font-size:0.75rem; color:#f58634; margin-left:4px;"></i>
              </label>
              <input pInputText [(ngModel)]="form.cp" (ngModelChange)="onCpChange($event)"
                     class="w-full alg-input" placeholder="37000" maxlength="5" />
              <div *ngIf="cpError" class="alg-cp-error">{{ cpError }}</div>
            </div>
          </div>

          <!-- Ciudad + Estado -->
          <div class="alg-form-row">
            <div style="flex:1; min-width:0;">
              <label class="alg-label">Ciudad</label>
              <input pInputText [(ngModel)]="form.ciudad" class="w-full alg-input" placeholder="Ciudad" />
            </div>
            <div style="flex:1; min-width:0;">
              <label class="alg-label">Estado</label>
              <input pInputText [(ngModel)]="form.estado" class="w-full alg-input" placeholder="Estado" />
            </div>
          </div>

          <!-- País -->
          <div class="alg-form-section">
            <label class="alg-label">País</label>
            <input pInputText [(ngModel)]="form.pais" class="w-full alg-input" placeholder="México" />
          </div>

          <!-- Separador Clasificación -->
          <div class="alg-section-sep">
            <i class="pi pi-tag"></i> Clasificación
          </div>

          <!-- Dropdowns en fila -->
          <div class="alg-form-row">
            <div class="alg-form-col">
              <label class="alg-label">Tipo De Cliente</label>
              <p-dropdown
                [options]="tiposCliente()"
                optionLabel="descripcion"
                optionValue="idtipocliente"
                [(ngModel)]="form.idtipocliente"
                placeholder="— Selecciona —"
                appendTo="body"
                class="w-full"
                styleClass="alg-dd">
              </p-dropdown>
            </div>
            <div class="alg-form-col">
              <label class="alg-label">Personalidad Jurídica</label>
              <p-dropdown
                [options]="personalidades()"
                optionLabel="descripcion"
                optionValue="idpersonalidadjuridica"
                [(ngModel)]="form.idpersonalidadjuridica"
                placeholder="— Selecciona —"
                appendTo="body"
                class="w-full"
                styleClass="alg-dd">
              </p-dropdown>
            </div>
          </div>

        </div>
        <ng-template pTemplate="footer">
          <div class="alg-footer-btns">
            <button class="alg-btn-cancel" (click)="dialog.set(false)">
              <i class="pi pi-times"></i> Cancelar
            </button>
            <button class="alg-btn-save" (click)="save()" [disabled]="!formValido()">
              <i class="pi pi-check"></i> Guardar
            </button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    /* ── Form dialog ── */
    .alg-form { padding: 0.5rem 0.25rem; }
    .alg-form-section { margin-bottom: 1.25rem; }
    .alg-form-row { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
    .alg-form-col { flex: 1; min-width: 0; }
    .alg-label { display: flex; align-items: center; gap: 4px; }
    .alg-label-hint {
      margin-left: auto; font-size: 0.72rem; font-weight: 400;
      color: #94a3b8; text-transform: none; letter-spacing: 0;
    }
    .alg-required { color: #ef4444; font-size: 0.9rem; }

    /* ── Separador de sección ── */
    .alg-section-sep {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.72rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.08em; color: #64748b;
      border-top: 2px solid #f1f5f9; padding-top: 0.9rem; margin-bottom: 1rem;
    }
    .alg-section-sep .pi { color: #f58634; font-size: 0.85rem; }
    .alg-required { color: #ef4444; }

    /* ── CP helpers ── */
    .alg-cp-error { font-size: 0.75rem; color: #ef4444; margin-top: 3px; }

    /* ── Tabla: celda dirección ── */
    .alg-addr-cell { line-height: 1.4; }
    .alg-addr-sub { display: block; font-size: 0.78rem; color: #6b7280; }
    .alg-addr-empty { color: #94a3b8; font-style: italic; }

    /* ── Inputs generales ── */
    .alg-input {
      border: 2px solid #e2e8f0 !important; border-radius: 10px !important;
      padding: 0.6rem 0.9rem !important; font-size: 0.92rem !important;
      transition: border-color 0.2s, box-shadow 0.2s !important;
    }
    .alg-input:focus {
      border-color: #f58634 !important;
      box-shadow: 0 0 0 3px rgba(245,134,52,0.15) !important;
      outline: none !important;
    }

    /* ── RFC ── */
    .alg-rfc-wrap { position: relative; }
    .alg-rfc-input {
      padding-right: 5.5rem !important;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-family: 'Courier New', monospace !important;
      font-size: 0.95rem !important;
      font-weight: 600 !important;
    }
    .alg-input-error {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
    }
    .alg-input-ok {
      border-color: #22c55e !important;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.12) !important;
    }
    .alg-rfc-counter {
      position: absolute; right: 2.4rem; top: 50%; transform: translateY(-50%);
      font-size: 0.72rem; font-weight: 700; color: #94a3b8;
      background: #f1f5f9; padding: 1px 6px; border-radius: 4px;
    }
    .alg-counter-ok { color: #16a34a; background: #dcfce7; }
    .alg-counter-err { color: #dc2626; background: #fee2e2; }
    .alg-rfc-icon {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      font-size: 1rem;
    }
    .alg-icon-ok { color: #22c55e; }
    .alg-icon-err { color: #ef4444; }

    /* ── Mensajes de validación ── */
    .alg-msg {
      margin-top: 0.4rem; font-size: 0.8rem; font-weight: 600;
      display: flex; align-items: center; gap: 0.35rem;
      padding: 0.4rem 0.7rem; border-radius: 7px;
    }
    .alg-msg-error { color: #dc2626; background: #fef2f2; border-left: 3px solid #ef4444; }
    .alg-msg-ok    { color: #15803d; background: #f0fdf4; border-left: 3px solid #22c55e; }

    /* ── Dropdown estilo Algebasa ── */
    ::ng-deep .alg-dd {
      width: 100% !important;
      border: 2px solid #e2e8f0 !important;
      border-radius: 10px !important;
      transition: border-color 0.2s, box-shadow 0.2s !important;
    }
    ::ng-deep .alg-dd:not(.p-disabled):hover { border-color: #2b5290 !important; }
    ::ng-deep .alg-dd.p-focus,
    ::ng-deep .alg-dd.p-inputwrapper-focus {
      border-color: #f58634 !important;
      box-shadow: 0 0 0 3px rgba(245,134,52,0.15) !important;
    }
    ::ng-deep .alg-dd .p-dropdown-label {
      padding: 0.6rem 0.9rem !important; font-size: 0.92rem !important; color: #374151 !important;
    }
    ::ng-deep .alg-dd .p-dropdown-label.p-placeholder { color: #94a3b8 !important; }
    ::ng-deep .alg-dd .p-dropdown-trigger { color: #2b5290 !important; width: 2.5rem !important; }
    ::ng-deep .alg-dd .p-dropdown-trigger .p-dropdown-trigger-icon { font-size: 0.8rem !important; }
    ::ng-deep .p-dropdown-panel .p-dropdown-items-wrapper {
      border-radius: 10px !important; box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
    }
    ::ng-deep .p-dropdown-panel .p-dropdown-item {
      padding: 0.6rem 1rem !important; font-size: 0.9rem !important;
      color: #374151 !important; transition: background 0.15s !important;
    }
    ::ng-deep .p-dropdown-panel .p-dropdown-item:hover { background: #eff6ff !important; color: #2b5290 !important; }
    ::ng-deep .p-dropdown-panel .p-dropdown-item.p-highlight {
      background: linear-gradient(135deg, #2b5290, #1a3a6e) !important; color: white !important;
    }
    ::ng-deep .p-dropdown-panel .p-dropdown-header {
      background: #f8fafc !important; border-bottom: 1px solid #e2e8f0 !important;
    }

    /* ── Footer ── */
    .alg-footer-btns { display: flex; gap: 0.75rem; justify-content: flex-end; }

    /* ── Quién es Quién ── */
    .alg-btn-qeq {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      width: 100%; padding: 0.65rem 1.2rem;
      background: linear-gradient(135deg, #1e3a6e, #2b5290);
      color: white; border: none; border-radius: 10px;
      font-size: 0.875rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .alg-btn-qeq:hover:not(:disabled) {
      background: linear-gradient(135deg, #2b5290, #1a3a6e);
      transform: translateY(-1px); box-shadow: 0 4px 14px rgba(43,82,144,0.35);
    }
    .alg-btn-qeq:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    .alg-qeq-clean {
      margin-top: 0.75rem; padding: 0.7rem 1rem;
      background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px;
      color: #15803d; display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.85rem; font-weight: 600;
    }
    .alg-qeq-warn {
      margin-top: 0.75rem; padding: 0.7rem 1rem;
      background: #fefce8; border: 1.5px solid #fde047; border-radius: 10px;
      color: #854d0e; display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.85rem; font-weight: 600;
    }
    .alg-qeq-alert {
      margin-top: 0.75rem; border: 2px solid #fca5a5; border-radius: 10px; overflow: hidden;
    }
    .alg-qeq-alert-header {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: white; padding: 0.6rem 1rem; font-size: 0.85rem;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .alg-qeq-results-body { max-height: 220px; overflow-y: auto; }
    .alg-qeq-result {
      padding: 0.7rem 1rem; border-bottom: 1px solid #fecaca; background: white;
    }
    .alg-qeq-result:last-child { border-bottom: none; }
    .alg-qeq-result-name { font-weight: 700; font-size: 0.88rem; color: #1f2937; margin-bottom: 0.35rem; }
    .alg-qeq-result-meta { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
    .alg-qeq-tag {
      font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .alg-qeq-tag-lista { background: #fee2e2; color: #dc2626; }
    .alg-qeq-tag-cat   { background: #fef3c7; color: #92400e; }
    .alg-qeq-tag-pct   { background: #eff6ff; color: #1d4ed8; }
    .alg-qeq-tag-est   { background: #f3f4f6; color: #374151; }
    .alg-qeq-result-detail { font-size: 0.76rem; color: #6b7280; display: flex; flex-direction: column; gap: 2px; }
    .alg-qeq-dep { color: #9ca3af; }
  `]
})
export class ClientesComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  items = signal<Cliente[]>([]);
  loading = signal(false);
  dialog = signal(false);
  form: Partial<Cliente> = {};
  editItem = signal<Cliente|undefined>(undefined);
  globalFilterValue = '';

  tiposCliente = signal<any[]>([]);
  personalidades = signal<any[]>([]);

  rfcTouched = false;
  cpLoading = false;
  cpError = '';
  cpColonias: string[] = [];
  private cpTimer: any;

  qeqLoading  = signal(false);
  qeqResultados = signal<any[]>([]);
  qeqError    = signal('');
  qeqBuscado  = signal(false);

  get rfcError(): string {
    const rfc = (this.form.rfc || '').trim();
    if (!rfc) return 'El RFC Es Obligatorio.';
    if (rfc.length < 12) return 'El RFC debe tener al menos 12 caracteres.';
    if (rfc.length > 13) return 'El RFC no puede exceder 13 caracteres.';
    if (!RFC_REGEX.test(rfc)) return 'Formato inválido. Use letras, dígitos de fecha (AAMMDD) y homoclave.';
    return '';
  }

  get rfcTipo(): string {
    const len = (this.form.rfc || '').length;
    if (len === 12) return 'Persona Moral';
    if (len === 13) return 'Persona Física';
    return '';
  }

  formValido(): boolean {
    return !!(
      this.form.nombre?.trim() &&
      this.form.rfc?.trim() &&
      !this.rfcError &&
      this.form.calle?.trim() &&
      this.form.idtipocliente &&
      this.form.idpersonalidadjuridica
    );
  }

  onRfcChange(value: string) {
    this.form.rfc = value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, '');
    this.rfcTouched = true;
  }

  onCpChange(value: string) {
    this.cpError = '';
    this.cpColonias = [];
    clearTimeout(this.cpTimer);
    const cp = value.replace(/\D/g, '');
    this.form.cp = cp;
    if (cp.length === 5) {
      this.cpLoading = true;
      this.cpTimer = setTimeout(() => this.buscarCp(cp), 600);
    }
  }

  validarQeQ() {
    this.qeqLoading.set(true);
    this.qeqError.set('');
    this.qeqResultados.set([]);
    this.qeqBuscado.set(false);

    const params: any = {};
    if (this.form.nombre?.trim()) params['nombre'] = this.form.nombre.trim();
    if (this.form.rfc?.trim())    params['rfc']    = this.form.rfc.trim();

    this.http.get<any>(`${API}/quien-es-quien/validar`, { params }).subscribe({
      next: (res) => {
        this.qeqLoading.set(false);
        this.qeqBuscado.set(true);
        if (res.success && res.data?.length) {
          this.qeqResultados.set(res.data);
        } else if (!res.success && res.status && res.status !== 'No results') {
          this.qeqError.set(res.status);
        }
      },
      error: () => {
        this.qeqLoading.set(false);
        this.qeqBuscado.set(true);
        this.qeqError.set('No se pudo conectar con Quién es Quién. Verifique la configuración.');
      }
    });
  }

  buscarCp(cp: string) {
    this.http.get<{ colonias: string[]; ciudad: string; estado: string }>(`${API}/cp/${cp}`).subscribe({
      next: (data) => {
        this.cpLoading = false;
        this.cpColonias = data.colonias ?? [];
        if (this.cpColonias.length === 1) this.form.colonia = this.cpColonias[0];
        this.form.ciudad = data.ciudad;
        this.form.estado = data.estado;
        if (!this.form.pais) this.form.pais = 'México';
      },
      error: () => {
        this.cpLoading = false;
        this.cpError = 'C.P. no encontrado';
      }
    });
  }

  constructor(private http: HttpClient, private confirm: ConfirmationService, public auth: AuthService) {}

  ngOnInit() {
    this.load();
    this.loadOptions();
  }

  load() {
    this.loading.set(true);
    this.http.get<Cliente[]>(`${API}/clientes`).subscribe(v => { this.items.set(v); this.loading.set(false); });
  }

  loadOptions() {
    this.http.get<any[]>(`${API}/cat/tipos-cliente`).subscribe(v => this.tiposCliente.set(v));
    this.http.get<any[]>(`${API}/cat/personalidades-juridicas`).subscribe(v => this.personalidades.set(v));
  }

  private resetQeq() {
    this.qeqLoading.set(false);
    this.qeqResultados.set([]);
    this.qeqError.set('');
    this.qeqBuscado.set(false);
  }

  openDialog() {
    this.editItem.set(undefined);
    this.form = { activo: 1, pais: 'México' } as Partial<Cliente>;
    this.rfcTouched = false;
    this.cpError = '';
    this.cpColonias = [];
    this.resetQeq();
    this.dialog.set(true);
  }

  edit(item: Cliente) {
    this.editItem.set(item);
    this.form = { ...item };
    this.rfcTouched = false;
    this.cpError = '';
    this.cpColonias = [];
    this.resetQeq();
    this.dialog.set(true);
  }

  save() {
    this.rfcTouched = true;
    if (!this.formValido()) return;
    const isNew = !this.editItem();
    const op = isNew
      ? this.http.post<Cliente>(`${API}/clientes`, this.form)
      : this.http.put<Cliente>(`${API}/clientes/${this.editItem()!.idcliente}`, this.form);
    op.subscribe(() => { this.load(); this.dialog.set(false); });
  }

  del(item: Cliente) {
    this.confirm.confirm({
      message: `¿Deseas eliminar al cliente <b>${item.nombre}</b>? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.http.delete(`${API}/clientes/${item.idcliente}`).subscribe(() => this.load())
    });
  }
}
