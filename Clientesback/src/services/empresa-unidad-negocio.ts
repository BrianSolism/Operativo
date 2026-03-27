import { pool } from '../index';

export const getUnidadesByEmpresa = async (idempresa: number) => {
  const [rows] = await pool.execute(`
    SELECT eun.idempresaunidadnegocio, eun.idunidadnegocio, un.descripcion
    FROM empresa_unidad_negocio eun
    JOIN cat_unidad_negocio un ON eun.idunidadnegocio = un.idunidadnegocio
    WHERE eun.idempresa = ? AND eun.activo = 1
    ORDER BY un.descripcion
  `, [idempresa]);
  return rows;
};

export const addUnidadToEmpresa = async (idempresa: number, idunidadnegocio: number) => {
  const [existing] = await pool.execute(
    'SELECT idempresaunidadnegocio, activo FROM empresa_unidad_negocio WHERE idempresa = ? AND idunidadnegocio = ?',
    [idempresa, idunidadnegocio]
  );
  const rows = existing as any[];

  if (rows.length > 0) {
    await pool.execute(
      'UPDATE empresa_unidad_negocio SET activo = 1, fecha_mod = NOW() WHERE idempresa = ? AND idunidadnegocio = ?',
      [idempresa, idunidadnegocio]
    );
    return { idempresaunidadnegocio: rows[0].idempresaunidadnegocio, idempresa, idunidadnegocio };
  }

  const [result] = await pool.execute(
    'INSERT INTO empresa_unidad_negocio (idempresa, idunidadnegocio) VALUES (?, ?)',
    [idempresa, idunidadnegocio]
  );
  return { idempresaunidadnegocio: (result as any).insertId, idempresa, idunidadnegocio };
};

export const removeUnidadFromEmpresa = async (idempresa: number, idunidadnegocio: number) => {
  await pool.execute(
    'UPDATE empresa_unidad_negocio SET activo = 0, fecha_mod = NOW() WHERE idempresa = ? AND idunidadnegocio = ?',
    [idempresa, idunidadnegocio]
  );
};
