import { Router, Request, Response } from 'express';

const router = Router();
const QEQ_BASE = 'https://app.q-detect.com/api';

async function getQeqToken(): Promise<string> {
  const clientId = process.env.QEQ_CLIENT_ID;
  const secretId = process.env.QEQ_SECRET_ID;

  if (!clientId || !secretId) {
    throw new Error('QEQ_CLIENT_ID y QEQ_SECRET_ID no están configurados en .env');
  }

  const res = await fetch(
    `${QEQ_BASE}/token?client_id=${encodeURIComponent(clientId)}`,
    { headers: { Authorization: `Bearer ${secretId}` } }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error obteniendo token QeQ (${res.status}): ${body}`);
  }

  return await res.text();
}

router.get('/validar', async (req: Request, res: Response) => {
  try {
    const { nombre, rfc, curp } = req.query;

    if (!nombre && !rfc && !curp) {
      return res.status(400).json({
        success: false,
        status: 'Se requiere al menos nombre, RFC o CURP para validar'
      });
    }

    const token = await getQeqToken();
    const username = process.env.QEQ_USERNAME || '';
    const clientId = process.env.QEQ_CLIENT_ID!;

    const params = new URLSearchParams({ client_id: clientId, username, percent: '75' });
    if (nombre) params.append('name', nombre as string);
    if (rfc)    params.append('rfc',  rfc as string);
    if (curp)   params.append('curp', curp as string);

    const findRes = await fetch(`${QEQ_BASE}/find?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await findRes.json() as any;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      status: err.message || 'Error al conectar con Quién es Quién'
    });
  }
});

export default router;
