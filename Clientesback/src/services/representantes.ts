import { pool } from '../index';

export const getRepresentantes = async () => {
  const [rows] = await pool.execute(`
    SELECT r.*, c.nombre as cliente_nombre
    FROM representante_cliente r
    JOIN cliente c ON r.idcliente = c.idcliente
    WHERE r.activo = 1
  `);
  return rows;
};

export const getRepresentantesPorCliente = async (idcliente: number) => {
  const [rows] = await pool.execute('SELECT * FROM representante_cliente WHERE idcliente = ? AND activo = 1', [idcliente]);
  return rows;
};

export const createRepresentante = async (data: any) => {
  const { idcliente, nombre, telefono, email } = data;
  const [result] = await pool.execute(
    'INSERT INTO representante_cliente (idcliente, nombre, telefono, email) VALUES (?, ?, ?, ?)',
    [idcliente, nombre, telefono ?? null, email ?? null]
  );
  return { idrepresentante: (result as any).insertId, ...data };
};

export const updateRepresentante = async (id: number, data: any) => {
  const { idcliente, nombre, telefono, email } = data;
  await pool.execute(
    'UPDATE representante_cliente SET idcliente = ?, nombre = ?, telefono = ?, email = ?, fecha_mod = NOW() WHERE idrepresentante = ?',
    [idcliente, nombre, telefono ?? null, email ?? null, id]
  );
  return { idrepresentante: id, ...data };
};

export const deleteRepresentante = async (id: number) => {
  await pool.execute('UPDATE representante_cliente SET activo = 0, fecha_mod = NOW() WHERE idrepresentante = ?', [id]);
};