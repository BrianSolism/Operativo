import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import checklistRoutes from './routes/checklist.routes';
import usuariosRoutes from './routes/usuarios.routes';
import { testConnection } from './config/database';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const rawOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
const CORS_ORIGIN: string | string[] = rawOrigin.includes(',')
  ? rawOrigin.split(',').map(s => s.trim())
  : rawOrigin;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/checklist', checklistRoutes);
app.use('/api/usuarios', usuariosRoutes);

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[Almacenback] Servicio de almacén corriendo en puerto ${PORT}`);
  await testConnection();
});
