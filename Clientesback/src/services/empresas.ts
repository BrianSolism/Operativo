import { pool } from '../index';

export const getEmpresas = async () => {
  const [rows] = await pool.execute(`
    SELECT e.idempresa, e.nombre, e.razon_social, e.idpersonalidadjuridica, e.activo,
           pj.descripcion as personalidad,
           GROUP_CONCAT(un.descripcion ORDER BY un.descripcion SEPARATOR ', ') as unidades_negocio
    FROM empresa e
    LEFT JOIN cat_personalidad_juridica pj ON e.idpersonalidadjuridica = pj.idpersonalidadjuridica
    LEFT JOIN empresa_unidad_negocio eun ON e.idempresa = eun.idempresa AND eun.activo = 1
    LEFT JOIN cat_unidad_negocio un ON eun.idunidadnegocio = un.idunidadnegocio
    WHERE e.activo = 1
    GROUP BY e.idempresa, e.nombre, e.razon_social, e.idpersonalidadjuridica, e.activo, pj.descripcion
  `);
  return rows;
};

export const createEmpresa = async (data: any) => {
  const { nombre, razon_social, idpersonalidadjuridica } = data;
  const [result] = await pool.execute(
    'INSERT INTO empresa (nombre, razon_social, idpersonalidadjuridica) VALUES (?, ?, ?)',
    [nombre, razon_social, idpersonalidadjuridica]
  );
  return { idempresa: (result as any).insertId, ...data };
};

export const updateEmpresa = async (id: number, data: any) => {
  const { nombre, razon_social, idpersonalidadjuridica } = data;
  await pool.execute(
    'UPDATE empresa SET nombre = ?, razon_social = ?, idpersonalidadjuridica = ?, fecha_mod = NOW() WHERE idempresa = ?',
    [nombre, razon_social, idpersonalidadjuridica, id]
  );
  return { idempresa: id, ...data };
};

export const deleteEmpresa = async (id: number) => {
  await pool.execute('UPDATE empresa SET activo = 0, fecha_mod = NOW() WHERE idempresa = ?', [id]);
};