import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { TableModule }         from 'primeng/table';
import { ButtonModule }        from 'primeng/button';
import { InputTextModule }     from 'primeng/inputtext';
import { DropdownModule }      from 'primeng/dropdown';
import { DialogModule }        from 'primeng/dialog';
import { ToastModule }         from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule }           from 'primeng/tag';
import { PasswordModule }      from 'primeng/password';
import { CardModule }          from 'primeng/card';
import { TooltipModule }       from 'primeng/tooltip';

import { UsuariosService } from './usuarios.service';
import { UsuarioItem }     from '../shared/models/checklist.model';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    TableModule, ButtonModule, InputTextModule, DropdownModule,
    DialogModule, ToastModule, ConfirmDialogModule, TagModule,
    PasswordModule, CardModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuarios-list.component.html',
})
export class UsuariosListComponent implements OnInit {
  usuarios: UsuarioItem[] = [];
  loading  = false;
  showDialog = false;
  editId?: number;

  form!: FormGroup;

  readonly rolesOpciones = [
    { label: 'Ejecutivo',      value: 2 },
    { label: 'Montacarguista', value: 3 },
    { label: 'Administrador',  value: 1 },
  ];

  private readonly rolStrToNum: Record<string, number> = { admin: 1, ejecutivo: 2, montacarguista: 3 };

  constructor(
    private svc:  UsuariosService,
    private fb:   FormBuilder,
    private msg:  MessageService,
    private conf: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      password: [''],
      rol:      [2, Validators.required],
    });
  }

  load(): void {
    this.loading = true;
    this.svc.list().subscribe({
      next: u => { this.usuarios = u; this.loading = false; },
      error: () => { this.loading = false; this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los usuarios' }); },
    });
  }

  openNew(): void {
    this.editId = undefined;
    this.form.reset({ rol: 2 });
    this.form.get('password')?.setValidators(Validators.required);
    this.form.get('password')?.updateValueAndValidity();
    this.showDialog = true;
  }

  openEdit(u: UsuarioItem): void {
    this.editId = u.id;
    this.form.patchValue({ nombre: u.nombre, email: u.email, rol: this.rolStrToNum[u.rol] ?? 2, password: '' });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.showDialog = true;
  }

  saveUsuario(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.value;

    const obs$ = this.editId
      ? this.svc.update(this.editId, val)
      : this.svc.create(val);

    obs$.subscribe({
      next: res => {
        this.msg.add({ severity: 'success', summary: 'Éxito', detail: res.message });
        this.showDialog = false;
        this.load();
      },
      error: err => this.msg.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Error al guardar' }),
    });
  }

  toggleActivo(u: UsuarioItem): void {
    const accion = u.activo ? 'desactivar' : 'activar';
    this.conf.confirm({
      message: `¿Está seguro de ${accion} al usuario <b>${u.nombre}</b>?`,
      header: 'Confirmar',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.svc.toggle(u.id).subscribe({
          next: () => { this.msg.add({ severity: 'success', summary: 'OK', detail: `Usuario ${accion}do` }); this.load(); },
          error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
        });
      },
    });
  }

  rolLabel(rol: string): string {
    const num = this.rolStrToNum[rol];
    const found = this.rolesOpciones.find(r => r.value === num);
    return found?.label ?? rol;
  }

  rolSeverity(rol: string): 'info' | 'warning' | 'danger' | 'success' {
    switch (rol) {
      case 'admin':          return 'danger';
      case 'ejecutivo':      return 'info';
      case 'montacarguista': return 'warning';
      default:               return 'success';
    }
  }
}
