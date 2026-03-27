import { pool } from '../../index';

export const getReglasTipoContrato = async () => {
  const [rows] = await pool.execute(`
    SELECT r.*,
           ts.descripcion as tipo_servicio_descripcion,
           pj.descripcion as personalidad_juridica_descripcion,
           tc.descripcion as tipo_contrato_descripcion
    FROM cat_regla_tipo_contrato r
    JOIN cat_tipo_servicio ts ON r.idtiposervicio = ts.idtiposervicio
    JOIN cat_personalidad_juridica pj ON r.idpersonalidadjuridica = pj.idpersonalidadjuridica
    LEFT JOIN cat_tipo_contrato tc ON r.idtipocontrato = tc.idtipocontrato
    WHERE r.activo = 1
  `);
  return rows;
};

export const getReglasWarnings = async () => {
  const [rows] = await pool.execute(`
    SELECT r.*, ts.descripcion as tipo_servicio_descripcion, pj.descripcion as personalidad_juridica_descripcion
    FROM cat_regla_tipo_contrato r
    JOIN cat_tipo_servicio ts ON r.idtiposervicio = ts.idtiposervicio
    JOIN cat_personalidad_juridica pj ON r.idpersonalidadjuridica = pj.idpersonalidadjuridica
    WHERE r.activo = 1 AND r.idtipocontrato IS NULL AND ts.incluye_en_caratula = 0
  `);
  return rows;
};

export const createReglaTipoContrato = async (data: any) => {
  const { idtiposervicio, idpersonalidadjuridica, idtipocontrato } = data;
  const [result] = await pool.execute(
    'INSERT INTO cat_regla_tipo_contrato (idtiposervicio, idpersonalidadjuridica, idtipocontrato) VALUES (?, ?, ?)',
    [idtiposervicio, idpersonalidadjuridica, idtipocontrato]
  );
  return { idregla: (result as any).insertId, ...data };
};

export const updateReglaTipoContrato = async (id: number, data: any) => {
  const { idtiposervicio, idpersonalidadjuridica, idtipocontrato } = data;
  await pool.execute(
    'UPDATE cat_regla_tipo_contrato SET idtiposervicio = ?, idpersonalidadjuridica = ?, idtipocontrato = ?, fecha_mod = NOW() WHERE idregla = ?',
    [idtiposervicio, idpersonalidadjuridica, idtipocontrato, id]
  );
  return { idregla: id, ...data };
};

export const deleteReglaTipoContrato = async (id: number) => {
  await pool.execute('UPDATE cat_regla_tipo_contrato SET activo = 0, fecha_mod = NOW() WHERE idregla = ?', [id]);
};