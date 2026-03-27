import { pool } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import {
  ChecklistPayload,
  ChecklistRow,
  ChecklistListItem,
  ChecklistItem,
  ChecklistLote,
  EstadoChecklist,
} from '../models/checklist.model';

// ─────────────────────────────────────────────────────────────
//  Helper: snake_case → camelCase row
// ─────────────────────────────────────────────────────────────
function toCamel(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camel] = row[key];
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
//  Genera folio: YYYYMMDD-NNN  (consecutivo por día)
// ─────────────────────────────────────────────────────────────
async function generarFolio(conn: Awaited<ReturnType<typeof pool.getConnection>>): Promise<string> {
  const hoy  = new Date();
  const yyyy = hoy.getFullYear();
  const mm   = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd   = String(hoy.getDate()).padStart(2, '0');
  const fecha = `${yyyy}${mm}${dd}`;

  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM checklist_inspeccion WHERE DATE(creado_en) = CURDATE()`,
  );
  const consecutivo = ((rows[0] as { total: number }).total + 1);
  return `${fecha}-${String(consecutivo).padStart(3, '0')}`;
}

// ─────────────────────────────────────────────────────────────
//  CREATE
// ─────────────────────────────────────────────────────────────
export async function createChecklist(data: ChecklistPayload): Promise<number> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const folio = await generarFolio(conn);

    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO checklist_inspeccion
        (numero_checklist,
         material, codigo_pirelli, proveedor, sitio_produccion,
         fecha_llegada, hora_llegada, numero_orden, peso_neto_kg,
         lugar_inspeccion, factura, contenedor, codigo_cliente,
         inspeccion_realizada_por, ingreso_sap, calidad_proveedores_smq, fecha_registro,
         asignado_a_id, asignado_a_nombre,
         creado_por, creado_por_nombre,
         estado, confirma_contenedor, confirma_proveedor)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        folio,
        data.material           ?? null,
        data.codigoPirelli      ?? null,
        data.proveedor          ?? null,
        data.sitioProduccion    ?? null,
        data.fechaLlegada       || null,
        data.horaLlegada        || null,
        data.numeroOrden        ?? null,
        data.pesoNetoKg         ?? null,
        data.lugarInspeccion    ?? null,
        data.factura            ?? null,
        data.contenedor         ?? null,
        data.codigoCliente      ?? null,
        data.inspeccionRealizadaPor ?? null,
        data.ingresoSap         ?? null,
        data.calidadProveedoresSmq  ?? null,
        data.fechaRegistro      || null,
        data.asignadoAId        ?? null,
        data.asignadoANombre    ?? null,
        data.creadoPor          ?? null,
        data.creadoPorNombre    ?? null,
        data.estado             ?? 'PENDIENTE',
        data.confirmaContenedor != null ? (data.confirmaContenedor ? 1 : 0) : null,
        data.confirmaProveedor  != null ? (data.confirmaProveedor  ? 1 : 0) : null,
      ],
    );

    const checklistId = result.insertId;

    // Ítems
    for (const item of (data.items ?? [])) {
      if (!item.resultado) continue; // resultado es NOT NULL en BD
      await conn.execute(
        `INSERT INTO checklist_inspeccion_items
           (checklist_id, seccion, categoria, descripcion, resultado, comentarios)
         VALUES (?,?,?,?,?,?)`,
        [checklistId, item.seccion, item.categoria, item.descripcion, item.resultado, item.comentarios ?? null],
      );
    }

    // Lotes  (tabla real: checklist_inspeccion_lotes)
    for (const lote of (data.lotes ?? [])) {
      await conn.execute(
        `INSERT INTO checklist_inspeccion_lotes
           (checklist_id, codigo_sap, lote, descripcion,
            fecha_produccion, fecha_caducidad,
            cantidad, unidad, caja_x_conjunto, unidad_x_caja,
            peso_x_empaque, tipo)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          checklistId,
          lote.codigoSap       ?? null,
          lote.lote            ?? null,
          lote.descripcion     ?? null,
          lote.fechaProduccion || null,
          lote.fechaCaducidad  || null,
          lote.cantidad        ?? null,
          lote.unidad          ?? 'PALLETS',
          lote.cajaXConjunto   ?? null,
          lote.unidadXCaja     ?? null,
          lote.pesoXEmpaque    ?? null,
          lote.tipo            ?? 'fisico',
        ],
      );
    }

    // Notas
    for (const nota of (data.notasLote ?? [])) {
      if (typeof nota === 'string' && nota.trim()) {
        await conn.execute(
          'INSERT INTO checklist_inspeccion_notas_lote (checklist_id, nota) VALUES (?,?)',
          [checklistId, nota],
        );
      }
    }

    await conn.commit();
    return checklistId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────
//  LIST (paginado)
// ─────────────────────────────────────────────────────────────
export async function listChecklists(
  page = 1,
  limit = 10,
  filters: {
    material?:       string;
    proveedor?:      string;
    fechaDesde?:     string;
    fechaHasta?:     string;
    asignadoAId?:    number;
    estado?:         EstadoChecklist;
  } = {},
): Promise<{ data: ChecklistListItem[]; total: number; page: number; limit: number }> {
  const offset = (page - 1) * limit;
  const conditions: string[] = ['eliminado = 0'];
  const params: unknown[] = [];

  if (filters.material) {
    conditions.push('material LIKE ?');
    params.push(`%${filters.material}%`);
  }
  if (filters.proveedor) {
    conditions.push('proveedor LIKE ?');
    params.push(`%${filters.proveedor}%`);
  }
  if (filters.fechaDesde) {
    conditions.push('fecha_llegada >= ?');
    params.push(filters.fechaDesde);
  }
  if (filters.fechaHasta) {
    conditions.push('fecha_llegada <= ?');
    params.push(filters.fechaHasta);
  }
  if (filters.asignadoAId != null) {
    conditions.push('asignado_a_id = ?');
    params.push(filters.asignadoAId);
  }
  if (filters.estado) {
    conditions.push('estado = ?');
    params.push(filters.estado);
  }

  const where    = `WHERE ${conditions.join(' AND ')}`;
  const qParams  = params.length ? params : undefined;

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM checklist_inspeccion ${where}`,
    qParams,
  );
  const total = (countRows[0] as { total: number }).total;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, numero_checklist, material, codigo_pirelli, proveedor,
            contenedor, fecha_llegada, numero_orden, estado,
            asignado_a_id, asignado_a_nombre, creado_en
     FROM checklist_inspeccion ${where}
     ORDER BY creado_en DESC
     LIMIT ${limit} OFFSET ${offset}`,
    qParams,
  );

  return {
    data: (rows as Record<string, unknown>[]).map(r => toCamel(r) as unknown as ChecklistListItem),
    total,
    page,
    limit,
  };
}

// ─────────────────────────────────────────────────────────────
//  GET BY ID
// ─────────────────────────────────────────────────────────────
export async function getChecklistById(id: number): Promise<ChecklistRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM checklist_inspeccion WHERE id = ? AND eliminado = 0',
    [id],
  );
  if (!rows.length) return null;

  const row = toCamel(rows[0] as Record<string, unknown>) as unknown as ChecklistRow;

  const [items] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM checklist_inspeccion_items WHERE checklist_id = ? ORDER BY id',
    [id],
  );
  const [lotes] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM checklist_inspeccion_lotes WHERE checklist_id = ? ORDER BY id',
    [id],
  );
  const [notas] = await pool.execute<RowDataPacket[]>(
    'SELECT nota FROM checklist_inspeccion_notas_lote WHERE checklist_id = ? ORDER BY id',
    [id],
  );

  row.items     = (items as Record<string, unknown>[]).map(r => toCamel(r) as unknown as ChecklistItem);
  row.lotes     = (lotes as Record<string, unknown>[]).map(r => toCamel(r) as unknown as ChecklistLote);
  row.notasLote = (notas as { nota: string }[]).map(n => n.nota);

  return row;
}

// ─────────────────────────────────────────────────────────────
//  UPDATE
// ─────────────────────────────────────────────────────────────
export async function updateChecklist(id: number, data: ChecklistPayload): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE checklist_inspeccion SET
         material=?, codigo_pirelli=?, proveedor=?, sitio_produccion=?,
         fecha_llegada=?, hora_llegada=?, numero_orden=?, peso_neto_kg=?,
         lugar_inspeccion=?, factura=?, contenedor=?, codigo_cliente=?,
         inspeccion_realizada_por=?, ingreso_sap=?, calidad_proveedores_smq=?, fecha_registro=?,
         asignado_a_id=?, asignado_a_nombre=?,
         estado=?, confirma_contenedor=?, confirma_proveedor=?,
         actualizado_por=?, actualizado_por_nombre=?
       WHERE id=?`,
      [
        data.material           ?? null,
        data.codigoPirelli      ?? null,
        data.proveedor          ?? null,
        data.sitioProduccion    ?? null,
        data.fechaLlegada       || null,
        data.horaLlegada        || null,
        data.numeroOrden        ?? null,
        data.pesoNetoKg         ?? null,
        data.lugarInspeccion    ?? null,
        data.factura            ?? null,
        data.contenedor         ?? null,
        data.codigoCliente      ?? null,
        data.inspeccionRealizadaPor ?? null,
        data.ingresoSap         ?? null,
        data.calidadProveedoresSmq  ?? null,
        data.fechaRegistro      || null,
        data.asignadoAId        ?? null,
        data.asignadoANombre    ?? null,
        data.estado             ?? 'PENDIENTE',
        data.confirmaContenedor != null ? (data.confirmaContenedor ? 1 : 0) : null,
        data.confirmaProveedor  != null ? (data.confirmaProveedor  ? 1 : 0) : null,
        data.creadoPor          ?? null,   // actualizado_por = quien hace el update
        data.creadoPorNombre    ?? null,
        id,
      ],
    );

    // Reemplazar ítems, lotes y notas
    await conn.execute('DELETE FROM checklist_inspeccion_items WHERE checklist_id=?', [id]);
    await conn.execute('DELETE FROM checklist_inspeccion_lotes WHERE checklist_id=?', [id]);
    await conn.execute('DELETE FROM checklist_inspeccion_notas_lote WHERE checklist_id=?', [id]);

    for (const item of (data.items ?? [])) {
      if (!item.resultado) continue;
      await conn.execute(
        `INSERT INTO checklist_inspeccion_items (checklist_id, seccion, categoria, descripcion, resultado, comentarios)
         VALUES (?,?,?,?,?,?)`,
        [id, item.seccion, item.categoria, item.descripcion, item.resultado, item.comentarios ?? null],
      );
    }
    for (const lote of (data.lotes ?? [])) {
      await conn.execute(
        `INSERT INTO checklist_inspeccion_lotes
           (checklist_id, codigo_sap, lote, descripcion,
            fecha_produccion, fecha_caducidad,
            cantidad, unidad, caja_x_conjunto, unidad_x_caja,
            peso_x_empaque, tipo)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          lote.codigoSap       ?? null,
          lote.lote            ?? null,
          lote.descripcion     ?? null,
          lote.fechaProduccion || null,
          lote.fechaCaducidad  || null,
          lote.cantidad        ?? null,
          lote.unidad          ?? 'PALLETS',
          lote.cajaXConjunto   ?? null,
          lote.unidadXCaja     ?? null,
          lote.pesoXEmpaque    ?? null,
          lote.tipo            ?? 'fisico',
        ],
      );
    }
    for (const nota of (data.notasLote ?? [])) {
      if (typeof nota === 'string' && nota.trim()) {
        await conn.execute(
          'INSERT INTO checklist_inspeccion_notas_lote (checklist_id, nota) VALUES (?,?)',
          [id, nota],
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────
//  DELETE (soft delete)
// ─────────────────────────────────────────────────────────────
export async function deleteChecklist(id: number): Promise<void> {
  await pool.execute(
    'UPDATE checklist_inspeccion SET eliminado=1, eliminado_en=NOW() WHERE id=?',
    [id],
  );
}
