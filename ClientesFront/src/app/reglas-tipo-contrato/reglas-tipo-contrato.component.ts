import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { API } from '../api';
import { AuthService } from '../auth/auth.service';

interface Regla {
  idregla: number;
  idtiposervicio: number;
  idpersonalidadjuridica: number;
  idtipocontrato: number | null;
  tipo_servicio_descripcion: string;
  personalidad_juridica_descripcion: string;
  tipo_contrato_descripcion: string | null;
  activo: number;
}

@Component({
  selector: 'app-reglas-tipo-contrato',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule,
    DropdownModule, TagModule, TooltipModule, ConfirmDialogModule
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
              <i class="pi pi-sitemap" style="font-size:1.8rem;color:#f58634;"></i>
            </div>
            <div>
              <span class="alg-eyebrow">Catálogo</span>
              <h1 class="alg-title">Reglas de Tipo de Contrato</h1>
              <p class="alg-subtitle">Define qué tipo de contrato corresponde a cada combinación de servicio y personalidad jurídica.</p>
            </div>
          </div>
          <div class="alg-header-right">
            <div class="alg-stat">
              <span class="alg-stat-num">{{ reglas().length }}</span>
              <span class="alg-stat-label">Reglas</span>
            </div>
            <button class="alg-btn-new" *ngIf="auth.can('cat/reglas-tipo-contrato','crear')" (click)="openDialog()">
              <i class="pi pi-plus"></i> Nueva Regla
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
            Reglas configuradas
          </span>
        </div>

        <p-table [value]="reglas()" [loading]="loading()" [paginator]="true" [rows]="10"
                 [rowsPerPageOptions]="[5,10,20]" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr class="alg-table-header">
              <th style="width:60px">ID</th>
              <th>Tipo de Servicio</th>
              <th>Personalidad Jurídica</th>
              <th>Tipo de Contrato</th>
              <th style="width:140px;text-align:center">Acciones</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-row let-i="rowIndex">
            <tr class="alg-row" [class.alg-row-alt]="i % 2 !== 0">
              <td><span class="alg-id">{{ row.idregla }}</span></td>
              <td>{{ row.tipo_servicio_descripcion }}</td>
              <td>{{ row.personalidad_juridica_descripcion }}</td>
              <td>
                <p-tag *ngIf="row.tipo_contrato_descripcion; else sinContrato"
                  [value]="row.tipo_contrato_descripcion" severity="warning"></p-tag>
                <ng-template #sinContrato>
                  <span style="color:#94a3b8;font-style:italic;font-size:0.82rem;">— Carátula —</span>
                </ng-template>
              </td>
              <td style="text-align:center">
                <div class="alg-action-btns">
                  <button *ngIf="auth.can('cat/reglas-tipo-contrato','editar')"
                    class="alg-btn-edit" (click)="edit(row)" pTooltip="Editar" tooltipPosition="top">
                    <i class="pi pi-pencil"></i> Editar
                  </button>
                  <button *ngIf="auth.can('cat/reglas-tipo-contrato','eliminar')"
                    class="alg-btn-delete" (click)="del(row)" pTooltip="Eliminar" tooltipPosition="top">
                    <i class="pi pi-trash"></i> Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="alg-empty">
                <i class="pi pi-inbox" style="font-size:2.5rem;color:#d1d5db;display:block;margin-bottom:0.75rem;"></i>
                No hay reglas configuradas
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- DIALOG -->
      <p-dialog
        [header]="editItem() ? 'Editar Regla' : 'Nueva Regla'"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '480px' }"
        [breakpoints]="{ '768px': '95vw' }">

        <div style="padding:1.25rem 0.5rem;">

          <div style="margin-bottom:1.25rem;">
            <label class="alg-label">Tipo de Servicio <span style="color:#ef4444">*</span></label>
            <p-dropdown
              [options]="tiposServicio()"
              optionLabel="descripcion"
              optionValue="idtiposervicio"
              [(ngModel)]="form.idtiposervicio"
              placeholder="— Selecciona —"
              appendTo="body"
              class="w-full" styleClass="alg-dd">
            </p-dropdown>
          </div>

          <div style="margin-bottom:1.25rem;">
            <label class="alg-label">Personalidad Jurídica <span style="color:#ef4444">*</span></label>
            <p-dropdown
              [options]="personalidades()"
              optionLabel="descripcion"
              optionValue="idpersonalidadjuridica"
              [(ngModel)]="form.idpersonalidadjuridica"
              placeholder="— Selecciona —"
              appendTo="body"
              class="w-full" styleClass="alg-dd">
            </p-dropdown>
          </div>

          <div style="margin-bottom:1.25rem;">
            <label class="alg-label">Tipo de Contrato <span style="color:#94a3b8;font-weight:400;">(opcional — vacío = Carátula)</span></label>
            <p-dropdown
              [options]="tiposContrato()"
              optionLabel="descripcion"
              optionValue="idtipocontrato"
              [(ngModel)]="form.idtipocontrato"
              placeholder="— Ninguno (Carátula) —"
              [showClear]="true"
              appendTo="body"
              class="w-full" styleClass="alg-dd">
            </p-dropdown>
          </div>

        </div>

        <ng-template pTemplate="footer">
          <div class="flex gap-2 justify-end">
            <button class="alg-btn-cancel" (click)="dialogVisible = false">
              <i class="pi pi-times"></i> Cancelar
            </button>
            <button class="alg-btn-save" (click)="save()" [disabled]="!form.idtiposervicio || !form.idpersonalidadjuridica">
              <i class="pi pi-check"></i> Guardar
            </button>
          </div>
        </ng-template>
      </p-dialog>

      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .alg-eyebrow {
      display: inline-block; font-size:0.7rem; font-weight:800; letter-spacing:0.12em;
      text-transform:uppercase; color:#f58634;
      background:rgba(245,134,52,0.15); border-radius:999px; padding:2px 10px; margin-bottom:4px;
    }
    .alg-action-btns { display:flex; gap:0.5rem; justify-content:center; }
    .alg-label { font-size:0.78rem; letter-spacing:0.5px; }
  `]
})
export class ReglasTipoContratoComponent implements OnInit {
  private http = inject(HttpClient);
  private confirm = inject(ConfirmationService);
  auth = inject(AuthService);

  reglas = signal<Regla[]>([]);
  loading = signal(false);
  tiposServicio = signal<any[]>([]);
  personalidades = signal<any[]>([]);
  tiposContrato = signal<any[]>([]);

  dialogVisible = false;
  editItem = signal<Regla | undefined>(undefined);
  form: Partial<Regla> = {};

  ngOnInit() {
    this.load();
    this.http.get<any[]>(`${API}/cat/tipos-servicio`).subscribe(v => this.tiposServicio.set(v));
    this.http.get<any[]>(`${API}/cat/personalidades-juridicas`).subscribe(v => this.personalidades.set(v));
    this.http.get<any[]>(`${API}/cat/tipos-contrato`).subscribe(v => this.tiposContrato.set(v));
  }

  load() {
    this.loading.set(true);
    this.http.get<Regla[]>(`${API}/cat/reglas-tipo-contrato`).subscribe({
      next: (data) => { this.reglas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openDialog() {
    this.editItem.set(undefined);
    this.form = { idtipocontrato: null };
    this.dialogVisible = true;
  }

  edit(item: Regla) {
    this.editItem.set(item);
    this.form = { ...item };
    this.dialogVisible = true;
  }

  save() {
    if (!this.form.idtiposervicio || !this.form.idpersonalidadjuridica) return;
    const payload = {
      idtiposervicio: this.form.idtiposervicio,
      idpersonalidadjuridica: this.form.idpersonalidadjuridica,
      idtipocontrato: this.form.idtipocontrato ?? null
    };
    const op = this.editItem()
      ? this.http.put(`${API}/cat/reglas-tipo-contrato/${this.editItem()!.idregla}`, payload)
      : this.http.post(`${API}/cat/reglas-tipo-contrato`, payload);
    op.subscribe(() => { this.load(); this.dialogVisible = false; });
  }

  del(item: Regla) {
    this.confirm.confirm({
      message: `¿Deseas eliminar la regla <b>${item.tipo_servicio_descripcion} + ${item.personalidad_juridica_descripcion}</b>?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.http.delete(`${API}/cat/reglas-tipo-contrato/${item.idregla}`).subscribe(() => this.load())
    });
  }
}
