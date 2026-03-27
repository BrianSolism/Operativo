import { pool } from '../../index';

export const getUnidadesNegocio = async () => {
  const [rows] = await pool.execute('SELECT * FROM cat_unidad_negocio WHERE activo = 1');
  return rows;
};

export const createUnidadNegocio = async (data: any) => {
  const { descripcion, idunidadestrategico = null, es_multicliente = 0 } = data;
  const [result] = await pool.execute(
    'INSERT INTO cat_unidad_negocio (descripcion, idunidadestrategico, es_multicliente) VALUES (?, ?, ?)',
    [descripcion, idunidadestrategico, es_multicliente]
  );
  return { idunidadnegocio: (result as any).insertId, ...data };
};

export const updateUnidadNegocio = async (id: number, data: any) => {
  const { descripcion, idunidadestrategico = null, es_multicliente = 0 } = data;
  await pool.execute(
    'UPDATE cat_unidad_negocio SET descripcion = ?, idunidadestrategico = ?, es_multicliente = ?, fecha_mod = NOW() WHERE idunidadnegocio = ?',
    [descripcion, idunidadestrategico, es_multicliente, id]
  );
  return { idunidadnegocio: id, ...data };
};

export const deleteUnidadNegocio = async (id: number) => {
  await pool.execute('UPDATE cat_unidad_negocio SET activo = 0, fecha_mod = NOW() WHERE idunidadnegocio = ?', [id]);
};