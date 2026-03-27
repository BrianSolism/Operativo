import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule }          from 'primeng/card';
import { InputTextModule }     from 'primeng/inputtext';
import { InputNumberModule }   from 'primeng/inputnumber';
import { CalendarModule }      from 'primeng/calendar';
import { RadioButtonModule }   from 'primeng/radiobutton';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule }        from 'primeng/button';
import { TableModule }         from 'primeng/table';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { ChipsModule }         from 'primeng/chips';
import { DropdownModule }      from 'primeng/dropdown';
import { StepsModule }         from 'primeng/steps';
import { CheckboxModule }      from 'primeng/checkbox';
import { TagModule }           from 'primeng/tag';

import { ChecklistService }   from '../checklist.service';
import { AuthService }        from '../../auth/auth.service';
import {
  ChecklistItem,
  ChecklistLote,
  EstadoChecklist,
  UsuarioItem,
  ITEMS_ANTES_DESCARGA,
  ITEMS_DURANTE_DESCARGA,
  ITEMS_AUTORIZACION,
  CATEGORIAS_SI_NO,
} from '../../shared/models/checklist.model';

@Component({
  selector: 'app-checklist-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    CardModule, InputTextModule, InputNumberModule, CalendarModule,
    RadioButtonModule, InputTextareaModule, ButtonModule, TableModule,
    ToastModule, DividerModule, ChipsModule, DropdownModule,
    StepsModule, CheckboxModule, TagModule,
  ],
  providers: [MessageService],
  templateUrl: './checklist-form.component.html',
})
export class ChecklistFormComponent implements OnInit {
  form!: FormGroup;
  loading  = false;
  editId?: number;

  // Paso activo en el stepper (0=paso1, 1=paso2, 2=paso3)
  currentStep = 0;

  userRol  = '';
  userName = '';
  userId   = 0;

  montacarguistas: { label: string; value: number }[] = [];

  readonly stepsItems = [
    { label: 'Alta Contenedor' },
    { label: 'Inspección Física' },
    { label: 'Validación Doc.' },
  ];

  readonly itemsAntes    = ITEMS_ANTES_DESCARGA;
  readonly itemsDurante  = ITEMS_DURANTE_DESCARGA;
  readonly itemsAutor    = ITEMS_AUTORIZACION;
  readonly categoriasSnNo = CATEGORIAS_SI_NO;

  readonly opcionesConf = [
    { label: 'Conforme',              value: 'CONFORME' },
    { label: 'Parcialmente Conforme', value: 'PARCIALMENTE_CONFORME' },
    { label: 'No Conforme',           value: 'NO_CONFORME' },
  ];
  readonly opcionesSino = [
    { label: 'Sí',  value: 'SI' },
    { label: 'No',  value: 'NO' },
    { label: 'N/A', value: 'NA' },
  ];
  readonly unidades = [
    { label: 'Pallets', value: 'PALLETS' },
    { label: 'Bultos',  value: 'BULTOS' },
    { label: 'Tambos',  value: 'TAMBOS' },
    { label: 'Sacos',   value: 'SACOS' },
    { label: 'Kg',      value: 'KG' },
  ];

  constructor(
    private fb:     FormBuilder,
    private svc:    ChecklistService,
    private auth:   AuthService,
    private route:  ActivatedRoute,
    private router: Router,
    private msg:    MessageService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.userRol  = (user?.rol ?? '').toLowerCase();
    this.userName = user?.nombre ?? '';
    this.userId   = user?.id    ?? 0;

    this.buildForm();

    if (this.userRol === 'ejecutivo' || this.userRol === 'admin') {
      this.svc.getUsuarios('3').subscribe({
        next: (users: UsuarioItem[]) => {
          this.montacarguistas = users.map(u => ({ label: u.nombre, value: u.id }));
        },
        error: (err) => {
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de montacarguistas' });
          console.error('getUsuarios error:', err);
        },
      });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = Number(id);
      this.loadExisting(this.editId);
    } else if (this.userRol === 'montacarguista') {
      // Montacarguista no crea checklists, redirigir al listado
      this.msg.add({ severity: 'warn', summary: 'Acceso', detail: 'Solo el ejecutivo puede crear checklists' });
      this.router.navigate(['/checklist']);
    } else {
      this.currentStep = 0;
    }
  }

  // ── Construcción del formulario ──────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      // Paso 1
      contenedor:        ['', Validators.required],
      asignadoAId:       [null, Validators.required],

      // Paso 2
      material:               ['', Validators.required],
      codigoPirelli:          ['', Validators.required],
      proveedor:              ['', Validators.required],
      fechaLlegada:           [null, Validators.required],
      horaLlegada:            [null],
      lugarInspeccion:        [''],
      inspeccionRealizadaPor: [''],

      // Paso 3
      sitioProduccion:        [''],
      numeroOrden:            [''],
      pesoNetoKg:             [null],
      factura:                [''],
      codigoCliente:          [''],
      ingresoSap:             [''],
      calidadProveedoresSmq:  [''],
      fechaRegistro:          [null],
      confirmaContenedor:     [false],
      confirmaProveedor:      [false],

      // Ítems (FormArray)
      itemsAntes:   this.buildItemsArray(ITEMS_ANTES_DESCARGA),
      itemsDurante: this.buildItemsArray(ITEMS_DURANTE_DESCARGA),
      itemsAutor:   this.buildItemsArray(ITEMS_AUTORIZACION),

      // Lotes y Notas
      lotes:     this.fb.array([]),
      notasLote: [[]],
    });
  }

  private buildItemsArray(defs: typeof ITEMS_ANTES_DESCARGA): FormArray {
    return this.fb.array(
      defs.map(item =>
        this.fb.group({
          seccion:     [item.seccion],
          categoria:   [item.categoria],
          descripcion: [item.descripcion],
          resultado:   [null, Validators.required],
          comentarios: [''],
        }),
      ),
    );
  }

  private fillFechaHoraActual(): void {
    const now = new Date();
    this.form.patchValue({ fechaLlegada: now, horaLlegada: now });
  }

  // ── Getters ──────────────────────────────────────────────
  get itemsAntesArr():   FormArray { return this.form.get('itemsAntes')   as FormArray; }
  get itemsDuranteArr(): FormArray { return this.form.get('itemsDurante') as FormArray; }
  get itemsAutorArr():   FormArray { return this.form.get('itemsAutor')   as FormArray; }
  get lotesArr():        FormArray { return this.form.get('lotes')        as FormArray; }

  usaSiNo(categoria: string): boolean {
    return this.categoriasSnNo.includes(categoria);
  }

  // Alerta caducidad: algún lote tiene fecha_caducidad < fechaLlegada + 3 meses
  caducidadInsuficiente(): boolean {
    const fechaLlegada = this.form.get('fechaLlegada')?.value as Date | null;
    if (!fechaLlegada) return false;
    const llegada = fechaLlegada instanceof Date ? fechaLlegada : new Date(fechaLlegada);
    const limite = new Date(llegada);
    limite.setMonth(limite.getMonth() + 3);

    for (const loteCtrl of this.lotesArr.controls) {
      const fc = loteCtrl.get('fechaCaducidad')?.value;
      if (!fc) continue;
      const cad = fc instanceof Date ? fc : new Date(fc);
      if (cad < limite) return true;
    }
    return false;
  }

  // ── Lotes ────────────────────────────────────────────────
  addLote(): void {
    this.lotesArr.push(this.fb.group({
      codigoSap:       [''],
      lote:            ['', Validators.required],
      descripcion:     [''],
      fechaProduccion: [null],
      fechaCaducidad:  [null],
      cantidad:        [null, [Validators.required, Validators.min(1)]],
      unidad:          ['PALLETS'],
      cajaXConjunto:   [null],
      unidadXCaja:     [''],
      pesoXEmpaque:    [null],
      tipo:            ['fisico'],
    }));
  }

  removeLote(i: number): void {
    this.lotesArr.removeAt(i);
  }

  // ── Estado → paso del stepper ────────────────────────────
  private estadoToStep(estado: EstadoChecklist): number {
    switch (estado) {
      case 'PENDIENTE':           return this.userRol === 'montacarguista' ? 1 : 0;
      case 'EN_PROCESO':          return this.userRol === 'montacarguista' ? 1 : -1;
      case 'PENDIENTE_EJECUTIVO': return this.userRol === 'montacarguista' ? 1 : 2;
      case 'EN_VALIDACION':       return 2;
      case 'COMPLETADO':          return 2;
      case 'CON_DIFERENCIAS':     return 2;
      default:                    return 0;
    }
  }

  // ── Carga de datos existentes (edición) ──────────────────
  private loadExisting(id: number): void {
    this.svc.getById(id).subscribe({
      next: cl => {
        this.currentStep = this.estadoToStep(cl.estado ?? 'PENDIENTE');

        this.form.patchValue({
          contenedor:             cl.contenedor          ?? '',
          asignadoAId:            cl.asignadoAId         ?? null,
          material:               cl.material            ?? '',
          codigoPirelli:          cl.codigoPirelli       ?? '',
          proveedor:              cl.proveedor           ?? '',
          sitioProduccion:        cl.sitioProduccion     ?? '',
          fechaLlegada:           cl.fechaLlegada  ? new Date(cl.fechaLlegada)  : null,
          horaLlegada:            cl.horaLlegada   ? new Date(`1970-01-01T${cl.horaLlegada}`) : null,
          numeroOrden:            cl.numeroOrden         ?? '',
          pesoNetoKg:             cl.pesoNetoKg          ?? null,
          lugarInspeccion:        cl.lugarInspeccion     ?? '',
          factura:                cl.factura             ?? '',
          codigoCliente:          cl.codigoCliente       ?? '',
          inspeccionRealizadaPor: cl.inspeccionRealizadaPor ?? '',
          ingresoSap:             cl.ingresoSap          ?? '',
          calidadProveedoresSmq:  cl.calidadProveedoresSmq  ?? '',
          fechaRegistro:          cl.fechaRegistro ? new Date(cl.fechaRegistro) : null,
          confirmaContenedor:     !!cl.confirmaContenedor,
          confirmaProveedor:      !!cl.confirmaProveedor,
          notasLote:              cl.notasLote ?? [],
        });

        // Montacarguista: si aún no hay fecha, rellenar con la actual
        if (this.userRol === 'montacarguista' && !cl.fechaLlegada) {
          this.fillFechaHoraActual();
        }

        // Ejecutivo en paso 3: auto-llenar "inspección realizada por" con su nombre
        if ((this.userRol === 'ejecutivo' || this.userRol === 'admin') && !cl.inspeccionRealizadaPor) {
          this.form.patchValue({ inspeccionRealizadaPor: this.userName });
        }

        this.patchItemsArray(this.itemsAntesArr,   cl.items.filter(i => i.seccion === 'ANTES_DESCARGA'));
        this.patchItemsArray(this.itemsDuranteArr, cl.items.filter(i => i.seccion === 'DURANTE_DESCARGA'));
        this.patchItemsArray(this.itemsAutorArr,   cl.items.filter(i => i.seccion === 'AUTORIZACION'));

        while (this.lotesArr.length) this.lotesArr.removeAt(0);
        cl.lotes.forEach(l => {
          this.lotesArr.push(this.fb.group({
            codigoSap:       [l.codigoSap],
            lote:            [l.lote, Validators.required],
            descripcion:     [l.descripcion],
            fechaProduccion: [l.fechaProduccion ? new Date(l.fechaProduccion) : null],
            fechaCaducidad:  [(l as ChecklistLote).fechaCaducidad  ? new Date((l as ChecklistLote).fechaCaducidad!) : null],
            cantidad:        [l.cantidad, [Validators.required, Validators.min(1)]],
            unidad:          [l.unidad ?? 'PALLETS'],
            cajaXConjunto:   [(l as ChecklistLote).cajaXConjunto ?? null],
            unidadXCaja:     [(l as ChecklistLote).unidadXCaja   ?? ''],
            pesoXEmpaque:    [(l as ChecklistLote).pesoXEmpaque  ?? null],
            tipo:            [(l as ChecklistLote).tipo ?? 'fisico'],
          }));
        });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el checklist' }),
    });
  }

  private patchItemsArray(arr: FormArray, items: ChecklistItem[]): void {
    items.forEach((item, i) => {
      if (arr.at(i)) {
        arr.at(i).patchValue({ resultado: item.resultado, comentarios: item.comentarios ?? '' });
      }
    });
  }

  // ── Paso → estado BD ─────────────────────────────────────
  private resolveEstado(savingStep: number, completar: boolean): EstadoChecklist {
    if (completar) return 'COMPLETADO';
    switch (savingStep) {
      case 0: return 'PENDIENTE';
      case 1: return 'EN_PROCESO';
      case 2: return 'PENDIENTE_EJECUTIVO';  // montacarguista avanza al siguiente
      default: return 'EN_VALIDACION';
    }
  }

  // ── Serialización ────────────────────────────────────────
  private buildPayload(estado: EstadoChecklist) {
    const v = this.form.value;

    const formatDate = (d: Date | string | null): string => {
      if (!d) return '';
      const dt = d instanceof Date ? d : new Date(d);
      return dt.toISOString().split('T')[0];
    };
    const formatTime = (d: Date | null): string => {
      if (!d) return '';
      const dt = d instanceof Date ? d : new Date(d);
      return dt.toTimeString().substring(0, 5);
    };

    const allItems: ChecklistItem[] = [
      ...v.itemsAntes,
      ...v.itemsDurante,
      ...v.itemsAutor,
    ];

    // Buscar nombre del montacarguista seleccionado
    const mont = this.montacarguistas.find(m => m.value === v.asignadoAId);

    const lotes: ChecklistLote[] = (v.lotes as ChecklistLote[]).map(l => ({
      ...l,
      fechaProduccion: formatDate(l.fechaProduccion as unknown as Date),
      fechaCaducidad:  formatDate(l.fechaCaducidad  as unknown as Date),
    }));

    return {
      contenedor:             v.contenedor,
      asignadoAId:            v.asignadoAId,
      asignadoANombre:        mont?.label ?? '',
      creadoPor:              this.userId,
      creadoPorNombre:        this.userName,
      estado,
      material:               v.material,
      codigoPirelli:          v.codigoPirelli,
      proveedor:              v.proveedor,
      sitioProduccion:        v.sitioProduccion,
      fechaLlegada:           formatDate(v.fechaLlegada),
      horaLlegada:            formatTime(v.horaLlegada),
      numeroOrden:            v.numeroOrden,
      pesoNetoKg:             v.pesoNetoKg,
      lugarInspeccion:        v.lugarInspeccion,
      factura:                v.factura,
      codigoCliente:          v.codigoCliente,
      inspeccionRealizadaPor: v.inspeccionRealizadaPor,
      ingresoSap:             v.ingresoSap,
      calidadProveedoresSmq:  v.calidadProveedoresSmq,
      fechaRegistro:          formatDate(v.fechaRegistro),
      confirmaContenedor:     v.confirmaContenedor,
      confirmaProveedor:      v.confirmaProveedor,
      items:                  allItems,
      lotes,
      notasLote:              v.notasLote ?? [],
    };
  }

  // ── Guardar paso parcial ──────────────────────────────────
  saveStep(nextVisualStep: number): void {
    this.loading = true;
    // nextVisualStep es el step DESTINO en el stepper (0,1,2)
    // El estado que se guarda corresponde al step ACTUAL que se está terminando
    const estadoGuardar = this.resolveEstado(this.currentStep, false);
    // Si está avanzando al siguiente, marcar como "avanzado"
    const estadoFinal: EstadoChecklist =
      nextVisualStep > this.currentStep
        ? this.resolveEstado(nextVisualStep - 1, false) === 'EN_PROCESO'
          ? 'PENDIENTE_EJECUTIVO'
          : estadoGuardar
        : estadoGuardar;

    // Montacarguista guardando paso 2 → pasa a PENDIENTE_EJECUTIVO
    let estadoPayload: EstadoChecklist = estadoGuardar;
    if (this.currentStep === 1 && this.userRol === 'montacarguista') {
      estadoPayload = 'PENDIENTE_EJECUTIVO';
    }

    const payload = this.buildPayload(estadoPayload);

    const obs$ = this.editId
      ? this.svc.update(this.editId, payload)
      : this.svc.create(payload);

    obs$.subscribe({
      next: res => {
        this.loading = false;
        this.msg.add({ severity: 'success', summary: 'Guardado', detail: 'Cambios guardados' });

        // Después de guardar: ejecutivo (paso 1) y montacarguista (paso 2) regresan al listado
        if (
          (this.currentStep === 0 && (this.userRol === 'ejecutivo' || this.userRol === 'admin')) ||
          (this.currentStep === 1 && this.userRol === 'montacarguista')
        ) {
          setTimeout(() => this.router.navigate(['/checklist']), 800);
          return;
        }

        if (!this.editId) {
          this.editId = (res as unknown as { id: number }).id;
          this.router.navigate(['/checklist/editar', this.editId], { replaceUrl: true });
        }
        void estadoFinal;
        if (nextVisualStep !== this.currentStep) {
          this.currentStep = nextVisualStep;
        }
      },
      error: err => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Error al guardar' });
      },
    });
  }

  // ── Guardar y completar (paso 3 final) ───────────────────
  save(generatePDF = false): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msg.add({ severity: 'warn', summary: 'Atención', detail: 'Completa todos los campos requeridos' });
      return;
    }

    this.loading = true;
    const payload = this.buildPayload('COMPLETADO');

    const obs$ = this.editId
      ? this.svc.update(this.editId, payload)
      : this.svc.create(payload);

    obs$.subscribe({
      next: res => {
        this.loading = false;
        this.msg.add({ severity: 'success', summary: 'Éxito', detail: 'Checklist completado correctamente' });
        const id = this.editId ?? (res as unknown as { id: number }).id;
        if (generatePDF && id) this.svc.downloadPDF(id);
        setTimeout(() => this.router.navigate(['/checklist']), 1200);
      },
      error: err => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Error al guardar' });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/checklist']);
  }
}
