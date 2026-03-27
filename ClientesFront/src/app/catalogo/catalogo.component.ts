import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { HttpClient } from '@angular/common/http';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CrudService } from '../services/crud.service';
import { API } from '../api';
import { AuthService } from '../auth/auth.service';

const ID_MAP: Record<string, string> = {
  'personalidades-juridicas':  'idpersonalidadjuridica',
  'tipos-cliente':             'idtipocliente',
  'tipos-contrato':            'idtipocontrato',
  'tipos-servicio':            'idtiposervicio',
  'unidades-negocio':          'idunidadnegocio',
  'unidades-estrategicas':     'idunidadestrategico',
};

interface CatalogoItem {
  id?: number;
  descripcion?: string;
  activo?: 0 | 1;
  fecha_registro?: string;
  fecha_mod?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    DropdownModule,
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
              <i class="pi pi-database" style="font-size: 1.8rem; color: #f58634;"></i>
            </div>
            <div>
              <span class="alg-eyebrow">Catálogo</span>
              <h1 class="alg-title capitalize">{{ titulo }}</h1>
              <p class="alg-subtitle">Administra y gestiona los registros de este catálogo.</p>
            </div>
          </div>
          <div class="alg-header-right">
            <div class="alg-stat">
              <span class="alg-stat-num">{{ items().length }}</span>
              <span class="alg-stat-label">Registros</span>
            </div>
            <button class="alg-btn-new" *ngIf="auth.can(base,'crear')" (click)="openDialog()">
              <i class="pi pi-plus"></i> Nuevo registro
            </button>
          </div>
        </div>
      </div>

      <!-- ══ TABLA ══ -->
      <div class="alg-card">
        <div class="alg-card-header">
          <div class="alg-card-header-bar"></div>
          <span class="alg-card-title">
            <i class="pi pi-list" style="margin-right:0.5rem;color:#f58634;"></i>
            <span class="capitalize">{{ titulo }}</span>
          </span>
        </div>

        <p-table [value]="items()" [loading]="loading()" [paginator]="true" [rows]="10"
                 [rowsPerPageOptions]="[5,10,20]" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr class="alg-table-header">
              <th *ngFor="let col of columns">{{ col.label }}</th>
              <th style="width:140px;text-align:center">Acciones</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-row let-i="rowIndex">
            <tr class="alg-row" [class.alg-row-alt]="i % 2 !== 0">
              <td *ngFor="let col of columns">
                <ng-container *ngIf="col.type === 'boolean'; else defaultCell">
                  <span [class]="row[col.field] ? 'alg-status-active' : 'alg-status-inactive'">
                    <i [class]="row[col.field] ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                    {{ row[col.field] ? 'Activo' : 'Inactivo' }}
                  </span>
                </ng-container>
                <ng-template #defaultCell>
                  <span [class]="col.field.startsWith('id') ? 'alg-id' : ''">
                    {{ formatCell(row[col.field], col.type) }}
                  </span>
                </ng-template>
              </td>
              <td style="text-align:center">
                <div class="alg-action-btns">
                  <button *ngIf="auth.can(base,'editar')" class="alg-btn-edit" (click)="edit(row)" pTooltip="Editar" tooltipPosition="top">
                    <i class="pi pi-pencil"></i> Editar
                  </button>
                  <button *ngIf="auth.can(base,'eliminar')" class="alg-btn-delete" (click)="del(row)" pTooltip="Eliminar" tooltipPosition="top">
                    <i class="pi pi-trash"></i> Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td [attr.colspan]="columns.length + 1" class="alg-empty">
                <i class="pi pi-inbox" style="font-size:2.5rem;color:#d1d5db;display:block;margin-bottom:0.75rem;"></i>
                Sin registros en este catálogo
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- ══ DIALOG ══ -->
      <p-dialog
        [header]="editItem() ? 'Editar registro' : 'Nuevo registro'"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '480px' }"
        [breakpoints]="{ '768px': '95vw' }">

        <div class="alg-form-section" style="padding:1.25rem 0.5rem;">
          <div *ngFor="let col of formFields" style="margin-bottom:1.25rem;">
            <label class="alg-label">{{ col.label }}</label>
            <input pInputText *ngIf="col.type === 'text'"
              [(ngModel)]="form[col.field]"
              [placeholder]="'Ingresa ' + col.label.toLowerCase()"
              class="w-full" style="border-radius:8px;" />
            <p-dropdown *ngIf="col.type === 'boolean'"
              [options]="[{ label: '✓  Activo', value: 1 }, { label: '✗  Inactivo', value: 0 }]"
              [(ngModel)]="form[col.field]"
              class="w-full">
            </p-dropdown>
            <p-dropdown *ngIf="col.type === 'dropdown'"
              [options]="dropdownOptions[col.field] || []"
              [(ngModel)]="form[col.field]"
              [placeholder]="'Selecciona ' + col.label.toLowerCase()"
              optionLabel="label"
              optionValue="value"
              class="w-full">
            </p-dropdown>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="flex gap-2 justify-end">
            <button class="alg-btn-cancel" (click)="dialogVisible = false">
              <i class="pi pi-times"></i> Cancelar
            </button>
            <button class="alg-btn-save" (click)="save()">
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
      display: inline-block;
      font-size: 0.7rem; font-weight: 800; letter-spacing: 0.12em;
      text-transform: uppercase; color: #f58634;
      background: rgba(245,134,52,0.15); border-radius: 999px;
      padding: 2px 10px; margin-bottom: 4px;
    }
    /* Badges estado */
    .alg-status-active, .alg-status-inactive {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.3rem 0.8rem; border-radius: 20px;
      font-size: 0.78rem; font-weight: 700;
    }
    .alg-status-active { background: #dcfce7; color: #166534; }
    .alg-status-inactive { background: #fee2e2; color: #991b1b; }

    /* Botones acción */
    .alg-action-btns { display: flex; gap: 0.5rem; justify-content: center; }
    /* Label override: tamaño ligeramente menor */
    .alg-label { font-size: 0.78rem; letter-spacing: 0.5px; }
  `]
})
export class CatalogoComponent implements OnInit {
  titulo = '';
  base = '';
  items = signal<CatalogoItem[]>([]);
  loading = signal(false);
  dialogVisible = false;
  form: any = {};
  editItem = signal<CatalogoItem | undefined>(undefined);

  columns: Array<{ field: string; label: string; type?: string }> = [];
  formFields: Array<{ field: string; label: string; type: string }> = [];
  dropdownOptions: Record<string, { label: string; value: any }[]> = {};

  private service: CrudService<CatalogoItem>;

  constructor(private route: ActivatedRoute, crud: CrudService<CatalogoItem>, private http: HttpClient, private confirm: ConfirmationService, public auth: AuthService) {
    this.service = crud;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(p => {
      const name = p.get('name')!;
      this.base = `cat/${name}`;
      this.titulo = name.replace(/-/g, ' ');
      this.service.useBase(this.base);
      const idField = ID_MAP[name] ?? ('id' + name.replace(/-/g, ''));
      this.columns = [
        { field: idField, label: 'ID' },
        { field: 'descripcion', label: 'Descripción', type: 'text' },
        { field: 'activo', label: 'Estado', type: 'boolean' },
        { field: 'fecha_registro', label: 'Registro', type: 'date' },
        { field: 'fecha_mod', label: 'Modificado', type: 'date' }
      ];
      this.formFields = [
        { field: 'descripcion', label: 'Descripción', type: 'text' },
        { field: 'activo', label: 'Estado', type: 'boolean' }
      ];
      this.dropdownOptions = {};

      if (name === 'unidades-negocio') {
        this.formFields.splice(1, 0, { field: 'idunidadestrategico', label: 'Unidad estratégica', type: 'dropdown' });
        this.http.get<any[]>(`${API}/cat/unidades-estrategicas`).subscribe(v => {
          this.dropdownOptions['idunidadestrategico'] = v.map(x => ({ label: x.descripcion, value: x.idunidadestrategico }));
        });
      }

      this.load();
    });
  }

  formatCell(value: any, type?: string): string {
    if (value === null || value === undefined || value === '') return '—';
    if (type === 'date') return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    return value;
  }

  load() {
    this.loading.set(true);
    this.service.list().subscribe(v => {
      this.items.set(v);
      this.loading.set(false);
    });
  }

  openDialog() {
    this.editItem.set(undefined);
    this.form = { activo: 1 };
    this.dialogVisible = true;
  }

  edit(item: CatalogoItem) {
    this.editItem.set(item);
    this.form = { ...item };
    this.dialogVisible = true;
  }

  save() {
    const isNew = !this.editItem();
    const name = this.base.replace('cat/', '');
    const idKey = ID_MAP[name] ?? ('id' + name.replace(/-/g, ''));
    const op = isNew
      ? this.service.create(this.form)
      : this.service.update((this.editItem() as any)[idKey], this.form);
    op.subscribe(() => {
      this.load();
      this.dialogVisible = false;
    });
  }

  del(item: CatalogoItem) {
    const name = this.base.replace('cat/', '');
    const idKey = ID_MAP[name] ?? ('id' + name.replace(/-/g, ''));
    const id = (item as any)[idKey];
    this.confirm.confirm({
      message: `¿Deseas eliminar <b>${item['descripcion'] ?? 'este registro'}</b>? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.service.remove(id).subscribe(() => this.load())
    });
  }
}