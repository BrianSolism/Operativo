import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';

// PrimeNG
import { TableModule }         from 'primeng/table';
import { ButtonModule }        from 'primeng/button';
import { InputTextModule }     from 'primeng/inputtext';
import { CalendarModule }      from 'primeng/calendar';
import { ToastModule }         from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule }     from 'primeng/paginator';
import { CardModule }          from 'primeng/card';
import { TagModule }           from 'primeng/tag';
import { TooltipModule }       from 'primeng/tooltip';

import { ChecklistService }    from '../checklist.service';
import { AuthService }         from '../../auth/auth.service';
import { ChecklistListItem, EstadoChecklist } from '../../shared/models/checklist.model';

@Component({
  selector: 'app-checklist-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    TableModule, ButtonModule, InputTextModule, CalendarModule,
    ToastModule, ConfirmDialogModule, PaginatorModule, CardModule,
    TagModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './checklist-list.component.html',
})
export class ChecklistListComponent implements OnInit {
  checklists: ChecklistListItem[] = [];
  total     = 0;
  page      = 1;
  limit     = 10;
  loading   = false;

  userRol = '';
  userId  = 0;

  filtMaterial   = '';
  filtProveedor  = '';
  filtFechaDesde: Date | null = null;
  filtFechaHasta: Date | null = null;

  constructor(
    private svc:    ChecklistService,
    private auth:   AuthService,
    private router: Router,
    private msg:    MessageService,
    private conf:   ConfirmationService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.userRol = (user?.rol ?? '').toLowerCase();
    this.userId  = user?.id  ?? 0;
    this.load();
  }

  get isAdmin(): boolean { return this.userRol === 'admin'; }

  estadoLabel(estado: EstadoChecklist): string {
    switch (estado) {
      case 'PENDIENTE':           return 'Pendiente Inspección';
      case 'EN_PROCESO':          return 'En Inspección';
      case 'PENDIENTE_EJECUTIVO': return 'Pendiente Validación';
      case 'EN_VALIDACION':       return 'En Validación';
      case 'COMPLETADO':          return 'Completado';
      case 'CON_DIFERENCIAS':     return 'Con Diferencias';
      default:                    return estado;
    }
  }

  estadoSeverity(estado: EstadoChecklist): 'warning' | 'info' | 'success' | 'danger' | 'secondary' {
    switch (estado) {
      case 'PENDIENTE':           return 'warning';
      case 'EN_PROCESO':          return 'info';
      case 'PENDIENTE_EJECUTIVO': return 'warning';
      case 'EN_VALIDACION':       return 'info';
      case 'COMPLETADO':          return 'success';
      case 'CON_DIFERENCIAS':     return 'danger';
      default:                    return 'secondary';
    }
  }

  load(): void {
    this.loading = true;
    const filters = {
      material:   this.filtMaterial  || undefined,
      proveedor:  this.filtProveedor || undefined,
      fechaDesde: this.filtFechaDesde ? this.toIso(this.filtFechaDesde) : undefined,
      fechaHasta: this.filtFechaHasta ? this.toIso(this.filtFechaHasta) : undefined,
    };

    this.svc.list(this.page, this.limit, filters).subscribe({
      next: res => {
        this.checklists = res.data;
        this.total      = res.total;
        this.loading    = false;
      },
      error: () => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los checklists' });
      },
    });
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.page  = (event.page ?? 0) + 1;
    this.limit = event.rows ?? 10;
    this.load();
  }

  applyFilters(): void { this.page = 1; this.load(); }

  clearFilters(): void {
    this.filtMaterial = ''; this.filtProveedor = '';
    this.filtFechaDesde = null; this.filtFechaHasta = null;
    this.page = 1; this.load();
  }

  nuevo(): void    { this.router.navigate(['/checklist/nuevo']); }
  editar(id: number): void { this.router.navigate(['/checklist/editar', id]); }
  descargarPDF(id: number): void { this.svc.downloadPDF(id); }

  eliminar(id: number): void {
    this.conf.confirm({
      message: '¿Está seguro de eliminar este checklist?',
      header:  'Confirmar eliminación',
      icon:    'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.delete(id).subscribe({
          next: () => { this.msg.add({ severity: 'success', summary: 'Eliminado', detail: 'Checklist eliminado' }); this.load(); },
          error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      },
    });
  }

  private toIso(d: Date): string { return d.toISOString().split('T')[0]; }

  fmtFecha(val: string): string {
    if (!val) return '—';
    const [y, m, dd] = val.split('T')[0].split('-');
    return `${dd}/${m}/${y}`;
  }
}
