import { pool } from '../index';

export const getContratos = async () => {
  const [rows] = await pool.execute(`
    SELECT c.*, cl.nombre as cliente_nombre, r.nombre as representante_nombre,
           ts.descripcion as tipo_servicio_descripcion, tc.descripcion as tipo_contrato_descripcion,
           un.descripcion as unidad_negocio_descripcion,
           ue.descripcion as unidad_estrategica_descripcion,
           (SELECT e.nombre FROM empresa_unidad_negocio eun
            JOIN empresa e ON eun.idempresa = e.idempresa
            WHERE eun.idunidadnegocio = c.idunidadnegocio AND eun.activo = 1 LIMIT 1) as empresa_nombre,
           ctc.descripcion as tipo_cliente_descripcion,
           pj.descripcion as personalidad_juridica_descripcion
    FROM contrato c
    LEFT JOIN cliente cl ON c.idcliente = cl.idcliente
    LEFT JOIN representante_cliente r ON c.idrepresentante = r.idrepresentante
    LEFT JOIN cat_tipo_servicio ts ON c.idtiposervicio = ts.idtiposervicio
    LEFT JOIN cat_tipo_contrato tc ON c.idtipocontrato = tc.idtipocontrato
    LEFT JOIN cat_unidad_negocio un ON c.idunidadnegocio = un.idunidadnegocio
    LEFT JOIN cat_unidad_negocio_estrategico ue ON un.idunidadestrategico = ue.idunidadestrategico
    LEFT JOIN cat_tipo_cliente ctc ON cl.idtipocliente = ctc.idtipocliente
    LEFT JOIN cat_personalidad_juridica pj ON cl.idpersonalidadjuridica = pj.idpersonalidadjuridica
    WHERE c.activo = 1
  `);
  return rows;
};

export const getContratosStats = async () => {
  const [rows] = await pool.execute(`
    SELECT ts.descripcion as tipo_servicio, COUNT(*) as count
    FROM contrato c
    JOIN cat_tipo_servicio ts ON c.idtiposervicio = ts.idtiposervicio
    WHERE c.activo = 1
    GROUP BY c.idtiposervicio, ts.descripcion
    ORDER BY count DESC
  `);
  return rows;
};

export const getReglaTipoContrato = async (idtiposervicio: number, idpersonalidadjuridica: number) => {
  const [rows] = await pool.execute(`
    SELECT r.*, tc.descripcion as tipo_contrato_descripcion, ts.incluye_en_caratula
    FROM cat_regla_tipo_contrato r
    LEFT JOIN cat_tipo_contrato tc ON r.idtipocontrato = tc.idtipocontrato
    LEFT JOIN cat_tipo_servicio ts ON r.idtiposervicio = ts.idtiposervicio
    WHERE r.idtiposervicio = ? AND r.idpersonalidadjuridica = ? AND r.activo = 1
  `, [idtiposervicio, idpersonalidadjuridica]);

  const resultRows = rows as any[];
  if (resultRows.length === 0) {
    throw new Error('Regla no encontrada');
  }

  return resultRows[0];
};

export const getServiciosCaratula = async (idcontrato: number) => {
  const [rows] = await pool.execute(`
    SELECT csc.*, ts.descripcion as tipo_servicio_descripcion
    FROM contrato_servicio_caratula csc
    JOIN cat_tipo_servicio ts ON csc.idtiposervicio = ts.idtiposervicio
    WHERE csc.idcontrato = ? AND csc.activo = 1
  `, [idcontrato]);
  return rows;
};

export const createContrato = async (data: any) => {
  const { idcliente, idrepresentante, idtiposervicio, idunidadnegocio, fecha_inicio, fecha_fin } = data;

  // Obtener personalidad jurídica del cliente
  const [clienteRows] = await pool.execute('SELECT idpersonalidadjuridica FROM cliente WHERE idcliente = ?', [idcliente]);
  const clienteResult = clienteRows as any[];
  if (clienteResult.length === 0) {
    throw new Error('Cliente no encontrado');
  }
  const idpersonalidadjuridica = clienteResult[0].idpersonalidadjuridica;

  // Obtener regla
  const regla = await getReglaTipoContrato(idtiposervicio, idpersonalidadjuridica);

  let idtipocontrato = null;
  let idregla = regla.idregla;

  if (regla.idtipocontrato) {
    idtipocontrato = regla.idtipocontrato;
  } else if (regla.incluye_en_caratula) {
    // No asignar tipo_contrato, se maneja en carátula
  } else {
    throw new Error('Combinación no válida');
  }

  const [result] = await pool.execute(
    'INSERT INTO contrato (idcliente, idrepresentante, idtiposervicio, idtipocontrato, idunidadnegocio, idregla, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [idcliente, idrepresentante, idtiposervicio, idtipocontrato, idunidadnegocio, idregla, fecha_inicio, fecha_fin]
  );

  return { idcontrato: (result as any).insertId, ...data, idtipocontrato, idregla };
};

export const updateContrato = async (id: number, data: any) => {
  const { idcliente, idrepresentante, idtiposervicio, idunidadnegocio, fecha_inicio, fecha_fin } = data;
  await pool.execute(
    'UPDATE contrato SET idcliente = ?, idrepresentante = ?, idtiposervicio = ?, idunidadnegocio = ?, fecha_inicio = ?, fecha_fin = ?, fecha_mod = NOW() WHERE idcontrato = ?',
    [idcliente, idrepresentante, idtiposervicio, idunidadnegocio, fecha_inicio, fecha_fin, id]
  );
  return { idcontrato: id, ...data };
};

export const deleteContrato = async (id: number) => {
  await pool.execute('UPDATE contrato SET activo = 0, fecha_mod = NOW() WHERE idcontrato = ?', [id]);
};