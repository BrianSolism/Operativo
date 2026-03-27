// ────────────────────────────────────────────────────────────
//  Interfaces TypeScript — Checklist Pirelli
// ────────────────────────────────────────────────────────────

export type ResultadoItem =
  | 'CONFORME'
  | 'PARCIALMENTE_CONFORME'
  | 'NO_CONFORME'
  | 'SI'
  | 'NO'
  | 'NA';

export type SeccionItem =
  | 'ANTES_DESCARGA'
  | 'DURANTE_DESCARGA'
  | 'AUTORIZACION';

// Estado real del ENUM en la BD
export type EstadoChecklist =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'PENDIENTE_EJECUTIVO'
  | 'EN_VALIDACION'
  | 'COMPLETADO'
  | 'CON_DIFERENCIAS';

export interface ChecklistItem {
  id?:          number;
  checklistId?: number;
  seccion:      SeccionItem;
  categoria:    string;
  descripcion:  string;
  resultado:    ResultadoItem;
  comentarios?: string;
}

export interface ChecklistLote {
  id?:              number;
  checklistId?:     number;
  codigoSap?:       string;
  lote?:            string;
  descripcion?:     string;
  fechaProduccion?: string;   // 'YYYY-MM-DD'
  fechaCaducidad?:  string;   // 'YYYY-MM-DD'
  cantidad?:        number;
  unidad?:          string;
  cajaXConjunto?:   number;
  unidadXCaja?:     string;
  pesoXEmpaque?:    number;   // columna real: peso_x_empaque
  tipo?:            'fisico' | 'documental';
}

export interface ChecklistPayload {
  // Paso 1 — Ejecutivo
  contenedor?:         string;
  asignadoAId?:        number;   // columna real: asignado_a_id
  asignadoANombre?:    string;   // columna real: asignado_a_nombre
  creadoPor?:          number;   // columna real: creado_por
  creadoPorNombre?:    string;   // columna real: creado_por_nombre
  estado?:             EstadoChecklist;  // columna real: estado

  // Paso 2 — Montacarguista
  material:            string;
  codigoPirelli:       string;
  proveedor:           string;
  fechaLlegada?:       string;   // 'YYYY-MM-DD'
  horaLlegada?:        string;   // 'HH:MM'
  lugarInspeccion?:    string;
  inspeccionRealizadaPor?: string;

  // Paso 3 — Ejecutivo
  sitioProduccion?:        string;
  numeroOrden?:            string;
  pesoNetoKg?:             number;
  factura?:                string;
  codigoCliente?:          string;   // columna nueva (migración 002)
  ingresoSap?:             string;
  calidadProveedoresSmq?:  string;
  fechaRegistro?:          string;
  confirmaContenedor?:     boolean;  // columna nueva (migración 002)
  confirmaProveedor?:      boolean;  // columna nueva (migración 002)

  items:     ChecklistItem[];
  lotes:     ChecklistLote[];
  notasLote: string[];
}

export interface ChecklistRow extends ChecklistPayload {
  id:              number;
  numeroChecklist: string;
  creadoEn:        string;
  actualizadoEn:   string;
}

export interface ChecklistListItem {
  id:              number;
  numeroChecklist: string;
  material:        string;
  codigoPirelli:   string;
  proveedor:       string;
  contenedor:      string;
  fechaLlegada:    string;
  numeroOrden:     string;
  estado:          EstadoChecklist;
  asignadoAId:     number;
  asignadoANombre: string;
  creadoEn:        string;
}

// Ítems predeterminados del formulario
export const DEFAULT_ITEMS: Omit<ChecklistItem, 'resultado'>[] = [
  // ── ANTES DE LA DESCARGA ──────────────────────────────────
  { seccion: 'ANTES_DESCARGA', categoria: 'DOCUMENTOS', descripcion: 'Todos los documentos fueron entregados (certificado de análisis, relación de contenido o packing list, factura, etc.)' },
  { seccion: 'ANTES_DESCARGA', categoria: 'DOCUMENTOS', descripcion: 'Declaración de sostenibilidad ISCC PLUS' },
  { seccion: 'ANTES_DESCARGA', categoria: 'DOCUMENTOS', descripcion: 'Material coincide con el ordenado' },
  { seccion: 'ANTES_DESCARGA', categoria: 'DOCUMENTOS', descripcion: 'Material identificado con el sitio de producción (en documentación)' },
  { seccion: 'ANTES_DESCARGA', categoria: 'RELACIÓN DE CONTENIDO O PACKING LIST', descripcion: 'Documento recibido' },
  { seccion: 'ANTES_DESCARGA', categoria: 'RELACIÓN DE CONTENIDO O PACKING LIST', descripcion: 'Documento coincide con los lotes recibidos' },
  { seccion: 'ANTES_DESCARGA', categoria: 'CERTIFICADO DE ANÁLISIS / REPORTE DE CALIDAD', descripcion: 'Documento(s) recibido(s) y completo(s) (indica el código Pirelli, fecha de producción, fecha de caducidad, etc.)' },
  { seccion: 'ANTES_DESCARGA', categoria: 'PESO NETO INDICADO EN DOCUMENTOS', descripcion: 'Peso neto coincide con la cantidad ordenada (±1%)' },
  { seccion: 'ANTES_DESCARGA', categoria: 'APROBACIÓN DE LABORATORIO', descripcion: 'Aprobación de laboratorio de materia prima para descargar (aplica para aceites, inflamables y material a descargarse en silos)' },
  // ── DURANTE LA DESCARGA ───────────────────────────────────
  { seccion: 'DURANTE_DESCARGA', categoria: 'RELACIÓN DE CONTENIDO O PACKING LIST', descripcion: 'Ítems en documento coinciden con los recibidos' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'RELACIÓN DE CONTENIDO O PACKING LIST', descripcion: 'Ítems faltantes o incorrectos' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'IDENTIFICACIÓN (ETIQUETAS)', descripcion: 'Incluye el sitio de producción' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'IDENTIFICACIÓN (ETIQUETAS)', descripcion: 'Incluye el nombre comercial del material' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'IDENTIFICACIÓN (ETIQUETAS)', descripcion: 'Incluye el número de lote - fecha de producción' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'IDENTIFICACIÓN (ETIQUETAS)', descripcion: 'Incluye el código Pirelli' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'CONDICIONES DEL EMPAQUE', descripcion: 'Resultado general de las condiciones del empaque' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'CONDICIONES DEL EMPAQUE', descripcion: 'Tipo de no conformidad: Empaque abierto / roto / dañado / reparado' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'CONDICIONES DEL EMPAQUE', descripcion: 'Tipo de no conformidad: Con madera / metal / clavos / agua / moho / otros' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'NÚMERO DE LOTES RECIBIDOS EN LA ENTREGA', descripcion: 'Máximo 2 lotes recibidos en la entrega' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'CADUCIDAD', descripcion: 'Material con mínimo 3 meses de vida residual' },
  { seccion: 'DURANTE_DESCARGA', categoria: 'DAÑO CAUSADO POR EL TRANSPORTE', descripcion: 'Daño causado por el transporte' },
  // ── AUTORIZACIÓN ──────────────────────────────────────────
  { seccion: 'AUTORIZACION', categoria: 'AUTORIZACIÓN PARA ALMACENAR EL MATERIAL', descripcion: 'Se autoriza almacenar el material' },
  { seccion: 'AUTORIZACION', categoria: 'AUTORIZACIÓN PARA ALMACENAR EL MATERIAL', descripcion: 'Se requiere intervención de calidad proveedores (SMQ)' },
  { seccion: 'AUTORIZACION', categoria: 'AUTORIZACIÓN PARA ALMACENAR EL MATERIAL', descripcion: 'Si no se autoriza almacenar el material, es enviado inmediatamente al APNC' },
];
