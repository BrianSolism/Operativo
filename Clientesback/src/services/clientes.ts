import { pool } from '../index';

export const getClientes = async () => {
  const [rows] = await pool.execute(`
    SELECT c.*, tc.descripcion as tipo_cliente_descripcion, pj.descripcion as personalidad_juridica_descripcion
    FROM cliente c
    LEFT JOIN cat_tipo_cliente tc ON c.idtipocliente = tc.idtipocliente
    LEFT JOIN cat_personalidad_juridica pj ON c.idpersonalidadjuridica = pj.idpersonalidadjuridica
    WHERE c.activo = 1
  `);
  return rows;
};

export const createCliente = async (data: any) => {
  const { nombre, rfc, calle, numero, colonia, cp, ciudad, estado, pais, idtipocliente, idpersonalidadjuridica } = data;
  const [result] = await pool.execute(
    'INSERT INTO cliente (nombre, rfc, calle, numero, colonia, cp, ciudad, estado, pais, idtipocliente, idpersonalidadjuridica) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nombre, rfc, calle ?? null, numero ?? null, colonia ?? null, cp ?? null, ciudad ?? null, estado ?? null, pais ?? 'México', idtipocliente, idpersonalidadjuridica]
  );
  return { idcliente: (result as any).insertId, ...data };
};

export const updateCliente = async (id: number, data: any) => {
  const { nombre, rfc, calle, numero, colonia, cp, ciudad, estado, pais, idtipocliente, idpersonalidadjuridica } = data;
  await pool.execute(
    'UPDATE cliente SET nombre = ?, rfc = ?, calle = ?, numero = ?, colonia = ?, cp = ?, ciudad = ?, estado = ?, pais = ?, idtipocliente = ?, idpersonalidadjuridica = ?, fecha_mod = NOW() WHERE idcliente = ?',
    [nombre, rfc, calle ?? null, numero ?? null, colonia ?? null, cp ?? null, ciudad ?? null, estado ?? null, pais ?? 'México', idtipocliente, idpersonalidadjuridica, id]
  );
  return { idcliente: id, ...data };
};

export const deleteCliente = async (id: number) => {
  await pool.execute('UPDATE cliente SET activo = 0, fecha_mod = NOW() WHERE idcliente = ?', [id]);
};