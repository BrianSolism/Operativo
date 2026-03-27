-- Migración 002: Checklist dividido en 3 pasos
-- Solo agrega las columnas que realmente NO existen todavía.
--
-- Columnas que YA existen (NO agregar):
--   checklist_inspeccion:          estado, asignado_a_id, asignado_a_nombre, creado_por, creado_por_nombre
--   checklist_inspeccion_lotes:    peso_x_empaque, fecha_caducidad, caja_x_conjunto, unidad_x_caja
--
-- Tabla de lotes real: checklist_inspeccion_lotes  (NO checklist_lotes)

ALTER TABLE checklist_inspeccion
  ADD COLUMN codigo_cliente      VARCHAR(100) NULL AFTER contenedor,
  ADD COLUMN confirma_contenedor TINYINT(1)   NULL,
  ADD COLUMN confirma_proveedor  TINYINT(1)   NULL;
