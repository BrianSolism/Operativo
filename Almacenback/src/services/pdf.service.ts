import PDFDocument from 'pdfkit';
import { Response }   from 'express';
import { ChecklistRow, ChecklistItem } from '../models/checklist.model';
import * as path from 'path';

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'pirelli.png');

// ─────────────────────────────────────────────────────────────
//  Paleta
// ─────────────────────────────────────────────────────────────
const C = {
  negro:        '#000000',
  seccion:      '#2b5290',   // azul columnas de resultado
  seccionTit:   '#1a3a6e',   // azul más oscuro — columna descripción en header
  catBg:        '#dbeafe',   // fondo fila categoría (azul claro — igual al HTML)
  catText:      '#1e40af',   // texto fila categoría
  rowAlt:       '#f8fafc',   // fila alternada (casi blanco — igual al HTML)
  blanco:       '#FFFFFF',
  borde:        '#000000',
  gris:         '#595959',
  azul:         '#1F3864',
  naranja:      '#C55A11',
};

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
function fmtFecha(val?: string | null): string {
  if (!val) return '';
  const d = val.toString().split('T')[0];
  const [y, m, dd] = d.split('-');
  if (!y || !m || !dd) return val.toString();
  return `${dd}.${m}.${y}`;
}
function fmtHora(val?: string | null): string {
  return val ? val.toString().substring(0, 5) : '';
}
function v(val?: string | number | null): string {
  return (val === undefined || val === null || val === '') ? '' : String(val);
}

// ─────────────────────────────────────────────────────────────
//  Dibujar texto en coordenadas absolutas (sin mover doc.y)
// ─────────────────────────────────────────────────────────────
function txt(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number, y: number,
  opts: {
    width?: number;
    align?: 'left' | 'center' | 'right';
    font?: string;
    size?: number;
    color?: string;
    italic?: boolean;
    underline?: boolean;
  } = {},
): void {
  const savedY = doc.y;
  doc.font(opts.font ?? (opts.italic ? 'Helvetica-Oblique' : 'Helvetica'))
     .fontSize(opts.size ?? 8)
     .fillColor(opts.color ?? C.negro)
     .text(text, x, y, {
       width:     opts.width,
       align:     opts.align ?? 'left',
       lineBreak: true,
       underline: opts.underline,
     });
  doc.y = savedY; // restaurar: no queremos flujo automático
}

function txtBold(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number, y: number,
  opts: { width?: number; align?: 'left' | 'center' | 'right'; size?: number; color?: string } = {},
): void {
  txt(doc, text, x, y, { ...opts, font: 'Helvetica-Bold' });
}

// ─────────────────────────────────────────────────────────────
//  Celda con fondo y borde
// ─────────────────────────────────────────────────────────────
function fillCell(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number, h: number,
  bg: string, borderColor = C.borde, lineW = 0.5,
): void {
  doc.rect(x, y, w, h).fill(bg);
  doc.rect(x, y, w, h).lineWidth(lineW).stroke(borderColor);
}

// ─────────────────────────────────────────────────────────────
//  Checkbox cuadrado con o sin X
// ─────────────────────────────────────────────────────────────
function drawCheckbox(
  doc: PDFKit.PDFDocument,
  cx: number, cy: number,   // centro del área de celda
  checked: boolean,
  size = 8,
): void {
  const bx = cx - size / 2;
  const by = cy - size / 2;
  doc.rect(bx, by, size, size).lineWidth(0.7).stroke(C.negro);
  if (checked) {
    txtBold(doc, 'X', bx - 1, by - 1, { width: size + 2, align: 'center', size: 8, color: C.negro });
  }
}

// ─────────────────────────────────────────────────────────────
//  Encabezado de página
// ─────────────────────────────────────────────────────────────
function drawPageHeader(
  doc: PDFKit.PDFDocument,
  marL: number, aw: number,
  numero: string,
): void {
  const y   = doc.page.margins.top;
  const bH  = 42;
  const lW  = 96;   // PIRELLI box
  const cW  = 100;  // código box
  const tW  = aw - lW - cW;

  // borde general
  doc.rect(marL, y, aw, bH).lineWidth(1).stroke(C.negro);

  // separador logo | título
  doc.moveTo(marL + lW, y).lineTo(marL + lW, y + bH).lineWidth(1).stroke(C.negro);
  // separador título | código
  doc.moveTo(marL + lW + tW, y).lineTo(marL + lW + tW, y + bH).lineWidth(1).stroke(C.negro);

  // ── PIRELLI (logo imagen) ──
  try {
    // Imagen centrada dentro del box del logo
    const imgH = bH - 14;
    const imgW = lW - 12;
    doc.image(LOGO_PATH, marL + 6, y + 3, { fit: [imgW, imgH], align: 'center', valign: 'center' });
  } catch {
    // fallback texto si no encuentra el archivo
    txtBold(doc, 'PIRELLI', marL + 4, y + 13, { size: 14, color: C.negro, width: lW - 8, align: 'center' });
  }
  txt(doc, 'Silao, México', marL + 2, y + bH - 12, { width: lW - 4, align: 'center', size: 7, font: 'Helvetica-Bold' });

  // ── Título central ──
  const tx = marL + lW + 4;
  txtBold(doc, numero + ' - INSPECCIÓN ANTES Y DURANTE LA DESCARGA',
    tx, y + 7, { width: tW - 8, align: 'center', size: 9.5 });
  txt(doc, 'Quality Standard MP054',
    tx, y + 22, { width: tW - 8, align: 'center', size: 8, color: '#1F3864' });

  // ── Código ──
  const cx2 = marL + lW + tW + 4;
  txtBold(doc, 'LV.99.MG.001.09',
    cx2, y + 15, { width: cW - 8, align: 'center', size: 8 });

  doc.y = y + bH + 2;
}

// ─────────────────────────────────────────────────────────────
//  Datos generales — tabla compacta
// ─────────────────────────────────────────────────────────────
function drawDatosGenerales(
  doc: PDFKit.PDFDocument,
  cl: ChecklistRow,
  marL: number, aw: number,
): void {
  const rH = 17; // altura de fila
  const startY = doc.y;

  const rows: { lbl: string; val: string }[][] = [
    [
      { lbl: 'MATERIAL:',            val: v(cl.material).toUpperCase() },
      { lbl: 'CÓDIGO PIRELLI:',      val: v(cl.codigoPirelli) },
      { lbl: 'PROVEEDOR:',           val: v(cl.proveedor).toUpperCase() },
    ],
    [
      { lbl: 'SITIO DE\nPRODUCCIÓN:', val: v(cl.sitioProduccion).toUpperCase() },
      { lbl: 'FECHA DE LLEGADA:',    val: fmtFecha(cl.fechaLlegada) },
      { lbl: 'HORA DE LLEGADA:',     val: fmtHora(cl.horaLlegada) },
    ],
    [
      { lbl: 'N° DE ORDEN:',         val: v(cl.numeroOrden) },
      { lbl: 'PESO NETO (kg):',      val: v(cl.pesoNetoKg) },
      { lbl: 'LUGAR DE INSPECCIÓN:', val: v(cl.lugarInspeccion).toUpperCase() },
    ],
    [
      { lbl: 'FACTURA:',             val: v(cl.factura) },
      { lbl: 'CONTENEDOR:',          val: v(cl.contenedor) },
      { lbl: '',                     val: '' },
    ],
  ];

  const colW = aw / 3;

  rows.forEach((row, ri) => {
    const ry = startY + ri * rH;
    const bg = ri % 2 === 0 ? C.blanco : C.rowAlt;

    row.forEach((cel, ci) => {
      const cx = marL + ci * colW;
      fillCell(doc, cx, ry, colW, rH, bg);
      if (cel.lbl) {
        txt(doc, cel.lbl, cx + 3, ry + 2, { size: 6.5, color: C.gris, width: colW - 6 });
        txtBold(doc, cel.val, cx + 3, ry + 9, { size: 8.5, width: colW - 6 });
      }
    });
  });

  doc.y = startY + rows.length * rH + 3;
}

// ─────────────────────────────────────────────────────────────
//  Encabezado de columnas de la tabla de ítems
// ─────────────────────────────────────────────────────────────
interface ColDef { w: number; label: string }

function drawColHeader(
  doc: PDFKit.PDFDocument,
  y: number, marL: number,
  cols: ColDef[],
  titulo: string,
): number {
  const hH = 22;
  let x = marL;

  // Primera columna: título de sección — azul más oscuro
  fillCell(doc, x, y, cols[0].w, hH, C.seccionTit, C.seccionTit);
  txtBold(doc, titulo, x + 4, y + 4, { size: 8, color: C.blanco, width: cols[0].w - 8 });
  x += cols[0].w;

  // Columnas de resultado — azul estándar
  for (let i = 1; i < cols.length; i++) {
    fillCell(doc, x, y, cols[i].w, hH, C.seccion, C.seccion);
    txtBold(doc, cols[i].label, x + 2, y + 3, { size: 7, color: C.blanco, width: cols[i].w - 4, align: 'center' });
    x += cols[i].w;
  }

  return hH;
}

// ─────────────────────────────────────────────────────────────
//  Columnas  (total = 519pt = aw)
//  HTML colgroup NORMAL: CONF=95px PARC=110px NC=95px COMENT=200px
//  HTML colgroup AUTOR : SI=80px  NO=80px   COMENT=240px
// ─────────────────────────────────────────────────────────────
const DESC_W = 246; // ~47.5% de 519pt — alineado con Checklist.html

const COLS_NORMAL: ColDef[] = [
  { w: DESC_W, label: '' },
  { w: 52,  label: 'CONFORME' },          // proporcional a 95px
  { w: 60,  label: 'PARCIALMENTE\nCONFORME' }, // proporcional a 110px
  { w: 52,  label: 'NO\nCONFORME' },     // proporcional a 95px (igual a CONF)
  { w: 109, label: 'COMENTARIOS\n/ NOTAS' },   // proporcional a 200px
];
// 246+52+60+52+109 = 519 ✓

// SI/NO/NA: mismas posiciones/anchos que CONFORME/PARC/NC
const COLS_SINO: ColDef[] = [
  { w: DESC_W, label: '' },
  { w: 52,  label: 'SI' },
  { w: 60,  label: 'NO' },
  { w: 52,  label: 'N/A' },
  { w: 109, label: 'COMENTARIOS\n/ NOTAS' },
];
// 246+52+60+52+109 = 519 ✓

// AUTORIZACIÓN: 4 cols — SI y NO mismo ancho (HTML: 80px / 80px), COMENT proporcional a 240px
const COLS_AUTOR: ColDef[] = [
  { w: DESC_W, label: '' },
  { w: 55,  label: 'SI' },   // proporcional a 80px
  { w: 55,  label: 'NO' },   // proporcional a 80px
  { w: 163, label: 'COMENTARIOS\n/ NOTAS' }, // proporcional a 240px
];
// 246+55+55+163 = 519 ✓

function useSinoForItem(item: ChecklistItem): boolean {
  return item.categoria === 'APROBACIÓN DE LABORATORIO'
      || item.categoria === 'DAÑO CAUSADO POR EL TRANSPORTE'
      || item.seccion   === 'AUTORIZACION';
}

// ─────────────────────────────────────────────────────────────
//  Fila de ítem con checkboxes reales
// ─────────────────────────────────────────────────────────────
function isChecked(item: ChecklistItem, col: 'C' | 'PC' | 'NC' | 'SI' | 'NO' | 'NA'): boolean {
  const r = item.resultado;
  return (col === 'C'  && r === 'CONFORME')
      || (col === 'PC' && r === 'PARCIALMENTE_CONFORME')
      || (col === 'NC' && r === 'NO_CONFORME')
      || (col === 'SI' && r === 'SI')
      || (col === 'NO' && r === 'NO')
      || (col === 'NA' && r === 'NA');
}

function drawItemRow(
  doc: PDFKit.PDFDocument,
  y: number, marL: number,
  cols: ColDef[],
  item: ChecklistItem | null,          // null = fila de categoría
  label: string,                        // texto principal
  bg: string,
  cols_type: 'normal' | 'sino' | 'autor',
): number {
  // calcular altura
  const descW = cols[0].w - 6;
  doc.fontSize(7.5);
  const textH = item ? doc.heightOfString(label, { width: descW }) : 10;
  const minH  = item ? 14 : 12;
  const h     = Math.max(minH, textH + 5);

  let x = marL;

  // Celda descripción
  fillCell(doc, x, y, cols[0].w, h, bg);

  if (!item) {
    // fila de categoría — fondo azul claro + texto azul oscuro (igual al HTML .tr-cat)
    const totalW = cols.reduce((s, c) => s + c.w, 0);
    fillCell(doc, x, y, totalW, h, C.catBg, '#bfdbfe');
    txtBold(doc, label, x + 4, y + 2, { size: 7.5, width: totalW - 8, color: C.catText });
    return h;
  }

  // descripción del ítem
  txt(doc, label, x + 4, y + 2, { size: 7.5, width: descW });
  x += cols[0].w;

  // Checkboxes
  const checkSize = 8;

  if (cols_type === 'normal') {
    const checks: ('C' | 'PC' | 'NC')[] = ['C', 'PC', 'NC'];
    for (let i = 0; i < 3; i++) {
      fillCell(doc, x, y, cols[i + 1].w, h, bg);
      const cx = x + cols[i + 1].w / 2;
      const cy = y + h / 2;
      drawCheckbox(doc, cx, cy, isChecked(item, checks[i]), checkSize);
      x += cols[i + 1].w;
    }
    // Comentarios
    fillCell(doc, x, y, cols[4].w, h, bg);
    txt(doc, item.comentarios ?? '', x + 3, y + 2, { size: 7, width: cols[4].w - 6 });

  } else if (cols_type === 'sino') {
    // col[1]=SI, col[2]=NO, col[3]=NA — mismas posiciones que CONFORME/PARC/NC
    const sinoChecks: ('SI' | 'NO' | 'NA')[] = ['SI', 'NO', 'NA'];
    for (let i = 0; i < 3; i++) {
      fillCell(doc, x, y, cols[i + 1].w, h, bg);
      drawCheckbox(doc, x + cols[i + 1].w / 2, y + h / 2, isChecked(item, sinoChecks[i]), checkSize);
      x += cols[i + 1].w;
    }
    // col[4]: Comentarios
    fillCell(doc, x, y, cols[4].w, h, bg);
    txt(doc, item.comentarios ?? '', x + 3, y + 2, { size: 7, width: cols[4].w - 6 });

  } else {
    // autor: SI / NO / COMENTARIOS
    const checks2: ('SI' | 'NO')[] = ['SI', 'NO'];
    for (let i = 0; i < 2; i++) {
      fillCell(doc, x, y, cols[i + 1].w, h, bg);
      const cx = x + cols[i + 1].w / 2;
      const cy = y + h / 2;
      drawCheckbox(doc, cx, cy, isChecked(item, checks2[i]), checkSize);
      x += cols[i + 1].w;
    }
    fillCell(doc, x, y, cols[3].w, h, bg);
    txt(doc, item.comentarios ?? '', x + 3, y + 2, { size: 7, width: cols[3].w - 6 });
  }

  return h;
}

// ─────────────────────────────────────────────────────────────
//  Sección completa
// ─────────────────────────────────────────────────────────────
function drawSeccion(
  doc: PDFKit.PDFDocument,
  titulo: string,
  items: ChecklistItem[],
  marL: number, aw: number,
  isAutorizacion = false,
): void {
  const cols      = isAutorizacion ? COLS_AUTOR : COLS_NORMAL;
  const cols_type = isAutorizacion ? 'autor' : 'normal';
  const pageBot   = doc.page.height - doc.page.margins.bottom;

  if (doc.y > pageBot - 60) doc.addPage();

  const hH = drawColHeader(doc, doc.y, marL, cols, titulo);
  doc.y += hH;

  let prevCat = '';
  let rowIdx  = 0;

  for (const item of items) {
    if (doc.y > pageBot - 20) {
      doc.addPage();
      const hh2 = drawColHeader(doc, doc.y, marL, cols, titulo + ' (cont.)');
      doc.y += hh2;
    }

    const isSino = useSinoForItem(item);
    const activeCols      = isAutorizacion ? COLS_AUTOR : isSino ? COLS_SINO : COLS_NORMAL;
    const active_cols_type = isAutorizacion ? 'autor' : isSino ? 'sino' : 'normal';

    // Fila de categoría si cambia (solo para secciones no-autorización)
    if (!isAutorizacion && item.categoria !== prevCat) {
      // si cambió tipo de columnas, redibujar encabezado de subgrupo si necesario
      const catH = drawItemRow(doc, doc.y, marL, activeCols, null, item.categoria, C.catBg, active_cols_type);
      doc.y  += catH;
      prevCat = item.categoria;
      rowIdx  = 0;
    }

    // Ítem especial AUTORIZACION: nota sin checkboxes
    if (isAutorizacion && item.descripcion.toLowerCase().startsWith('si no se autoriza')) {
      const noteW = aw;
      doc.fontSize(7.5);
      const noteH = Math.max(14, doc.heightOfString(item.descripcion, { width: noteW - 8 }) + 6);
      const ny = doc.y;
      fillCell(doc, marL, ny, noteW, noteH, C.rowAlt);
      txt(doc, item.descripcion, marL + 6, ny + 3, { size: 7.5, width: noteW - 12, italic: true });
      doc.y += noteH;
      rowIdx++;
      continue;
    }

    const bg = rowIdx % 2 === 0 ? C.blanco : C.rowAlt;
    const rh = drawItemRow(doc, doc.y, marL, activeCols, item, item.descripcion, bg, active_cols_type);
    doc.y   += rh;
    rowIdx++;
  }
}

// ─────────────────────────────────────────────────────────────
//  Footer — firmas
// ─────────────────────────────────────────────────────────────
function drawFooter(
  doc: PDFKit.PDFDocument,
  cl: ChecklistRow,
  marL: number, _aw: number,
): void {
  if (doc.y > doc.page.height - doc.page.margins.bottom - 75) doc.addPage();

  const y  = doc.y + 6;
  const fH = 52;
  // proporciones del HTML: 180 / 102 / 137 / 100 = 519pt total
  const cols = [
    { lbl: 'Inspección realizada por:',                                            val: v(cl.inspeccionRealizadaPor), w: 180 },
    { lbl: 'Ingreso en SAP:\n(Pirelli)',                                            val: v(cl.ingresoSap),            w: 102 },
    { lbl: 'Calidad Proveedores (SMQ)\n(llenar sólo si se requiere intervención)', val: v(cl.calidadProveedoresSmq), w: 137 },
    { lbl: 'Fecha\n(dd/mm/aaaa)',                                                   val: fmtFecha(cl.fechaRegistro ?? cl.fechaLlegada), w: 100 },
  ];

  let fx = marL;
  cols.forEach((col) => {
    const x = fx;
    fillCell(doc, x, y, col.w, fH, C.blanco);
    txt(doc, col.lbl, x + 3, y + 3, { size: 6.5, color: C.gris, width: col.w - 6 });
    // línea de firma
    doc.moveTo(x + 4, y + fH - 14).lineTo(x + col.w - 4, y + fH - 14).lineWidth(0.5).stroke(C.negro);
    txtBold(doc, col.val, x + 3, y + fH - 12, { size: 8, width: col.w - 6, align: 'center' });
    fx += col.w;
  });

  doc.y = y + fH + 4;
}

// ─────────────────────────────────────────────────────────────
//  Página de lotes
// ─────────────────────────────────────────────────────────────
function drawPaginaLotes(
  doc: PDFKit.PDFDocument,
  cl: ChecklistRow,
  marL: number, aw: number,
  numero: string,
): void {
  doc.addPage();
  drawPageHeader(doc, marL, aw, numero);

  const cols: ColDef[] = [
    { w: 80,       label: 'CÓDIGO SAP' },
    { w: 80,       label: 'LOTE' },
    { w: aw - 350, label: 'DESCRIPCIÓN' },
    { w: 90,       label: 'FECHA PRODUCCIÓN\n(dd/mm/aaaa)' },
    { w: 100,      label: 'CANTIDAD' },
  ];

  const hH = drawColHeader(doc, doc.y, marL, cols, 'DETALLE DE LOTES RECIBIDOS');
  doc.y += hH;

  let total = 0;
  cl.lotes.forEach((lote, i) => {
    const bg   = i % 2 === 0 ? C.blanco : C.rowAlt;
    const vals = [
      v(lote.codigoSap),
      v(lote.lote),
      v(lote.descripcion),
      fmtFecha(lote.fechaProduccion),
      `${v(lote.cantidad)} ${lote.unidad ?? 'PALLETS'}`,
    ];
    // dibujar fila de datos
    const y0 = doc.y;
    doc.fontSize(7.5);
    const descH = doc.heightOfString(vals[2], { width: cols[2].w - 6 });
    const rH    = Math.max(14, descH + 5);
    let x = marL;
    vals.forEach((val, vi) => {
      fillCell(doc, x, y0, cols[vi].w, rH, bg);
      txt(doc, val, x + 3, y0 + 2, { size: 7.5, width: cols[vi].w - 6 });
      x += cols[vi].w;
    });
    doc.y += rH;
    total += Number(lote.cantidad) || 0;
  });

  // fila total
  const y0 = doc.y;
  const rH = 14;
  let x = marL;
  ['', '', 'TOTAL', '', String(total)].forEach((val, vi) => {
    fillCell(doc, x, y0, cols[vi].w, rH, C.catBg);
    txtBold(doc, val, x + 3, y0 + 2, { size: 8, width: cols[vi].w - 6, align: vi === 4 ? 'center' : 'left' });
    x += cols[vi].w;
  });
  doc.y = y0 + rH + 8;

  // Notas
  if (cl.notasLote?.length) {
    txtBold(doc, 'Notas:', marL, doc.y, { size: 8 });
    doc.y += 12;
    cl.notasLote.forEach(nota => {
      txt(doc, `• ${nota}`, marL + 10, doc.y, { size: 7.5, width: aw - 10, color: '#444444' });
      doc.y += doc.heightOfString(nota, { width: aw - 10 }) + 4;
    });
  }
}

// ─────────────────────────────────────────────────────────────
//  Función pública
// ─────────────────────────────────────────────────────────────
export function generatePDF(cl: ChecklistRow, res: Response): void {
  const doc = new PDFDocument({
    size:    'A4',
    layout:  'portrait',
    margins: { top: 45, bottom: 35, left: 38, right: 38 },
    bufferPages: true,
  });

  const marL = doc.page.margins.left;
  const aw   = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const numero = `CHECKLIST ${cl.numeroChecklist ?? cl.id}`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="checklist_${cl.id}_${cl.fechaLlegada}.pdf"`);
  doc.pipe(res);

  // ── Página 1 ──
  drawPageHeader(doc, marL, aw, numero);
  drawDatosGenerales(doc, cl, marL, aw);

  const itemsAntes   = cl.items.filter(i => i.seccion === 'ANTES_DESCARGA');
  const itemsDurante = cl.items.filter(i => i.seccion === 'DURANTE_DESCARGA');
  const itemsAutor   = cl.items.filter(i => i.seccion === 'AUTORIZACION');

  drawSeccion(doc, 'INSPECCIÓN ANTES DE LA DESCARGA',           itemsAntes,   marL, aw);
  drawSeccion(doc, 'INSPECCIÓN DURANTE LA DESCARGA',            itemsDurante, marL, aw);
  drawSeccion(doc, 'AUTORIZACIÓN PARA ALMACENAR EL MATERIAL',   itemsAutor,   marL, aw, true);

  drawFooter(doc, cl, marL, aw);

  if (cl.lotes?.length || cl.notasLote?.length) {
    drawPaginaLotes(doc, cl, marL, aw, numero);
  }

  // ── Numeración de páginas ──
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const savedY2 = doc.y;
    doc.font('Helvetica').fontSize(7).fillColor('#888888')
       .text(
         `Página ${i - range.start + 1} de ${range.count}`,
         marL,
         doc.page.height - doc.page.margins.bottom - 10,
         { width: aw, align: 'right' },
       );
    doc.y = savedY2;
  }

  doc.end();
}
