import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db';
import authRouter from './routes/auth';

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);
const rawOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
const CORS_ORIGIN: string | string[] = rawOrigin.includes(',')
  ? rawOrigin.split(',').map(s => s.trim())
  : rawOrigin;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AuthBack', port: PORT });
});

// ─── Startup: ensure 'almacen' module exists ──────────────────────────────────
async function ensureModules(): Promise<void> {
  try {
    await pool.query(
      "INSERT IGNORE INTO modulos (clave, nombre) VALUES ('almacen', 'Almacén / Checklists')"
    );
    console.log('[AuthBack] Módulo "almacen" verificado en la base de datos.');
  } catch (err) {
    console.error('[AuthBack] Error al verificar módulos:', err);
  }
}

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[AuthBack] Servicio de autenticación ALGEBASA corriendo en puerto ${PORT}`);
  await ensureModules();
});

export { pool };
export default app;
