import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { JWT_SECRET, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!password) {
      res.status(400).json({ error: 'La contraseña es requerida' });
      return;
    }

    // Support both { username, password } and { email, password }
    // If only email is provided, treat its value as the username to look up
    const lookupValue = username || email;

    if (!lookupValue) {
      res.status(400).json({ error: 'Se requiere username o email' });
      return;
    }

    const [rows] = await pool.query<any[]>(
      'SELECT idusuario, username, password_hash, nombre, es_admin, activo, rol FROM usuarios WHERE (username = ? OR username = ?) AND activo = 1',
      [lookupValue, lookupValue]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const user = rows[0] as {
      idusuario: number;
      username: string;
      password_hash: string;
      nombre: string;
      es_admin: boolean | number;
      activo: boolean | number;
      rol: string;
    };

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const es_admin = Boolean(user.es_admin);

    const rolMap: Record<string, string> = { '1': 'admin', '2': 'ejecutivo', '3': 'montacarguista' };
    const rolRaw  = String(user.rol ?? '');
    const rol     = rolMap[rolRaw] ?? (rolRaw || (es_admin ? 'admin' : 'ejecutivo'));

    const payload = {
      id:       user.idusuario,
      email:    user.username,
      rol,
      idusuario: user.idusuario,
      username:  user.username,
      es_admin,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id:       user.idusuario,
        email:    user.username,
        nombre:   user.nombre,
        rol,
        idusuario: user.idusuario,
        username:  user.username,
        es_admin,
      },
    });
  } catch (err) {
    console.error('[AuthBack] Error en /login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idusuario = req.user!.idusuario;

    const [rows] = await pool.query<any[]>(
      `SELECT u.idusuario, u.username, u.nombre, u.es_admin, u.rol,
              m.clave AS modulo,
              p.puede_ver, p.puede_crear, p.puede_editar, p.puede_eliminar
       FROM usuarios u
       LEFT JOIN permisos_usuario p ON p.idusuario = u.idusuario
       LEFT JOIN modulos m ON m.idmodulo = p.idmodulo
       WHERE u.idusuario = ?`,
      [idusuario]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const first = rows[0] as {
      idusuario: number;
      username: string;
      nombre: string;
      es_admin: boolean | number;
      rol: string;
      modulo: string | null;
      puede_ver: boolean | number | null;
      puede_crear: boolean | number | null;
      puede_editar: boolean | number | null;
      puede_eliminar: boolean | number | null;
    };

    const permisos: Record<
      string,
      { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }
    > = {};

    for (const row of rows as typeof first[]) {
      if (row.modulo) {
        permisos[row.modulo] = {
          ver: Boolean(row.puede_ver),
          crear: Boolean(row.puede_crear),
          editar: Boolean(row.puede_editar),
          eliminar: Boolean(row.puede_eliminar),
        };
      }
    }

    const rolMapMe: Record<string, string> = { '1': 'admin', '2': 'ejecutivo', '3': 'montacarguista' };
    const rolRawMe = String(first.rol ?? '');
    const rolMe = rolMapMe[rolRawMe] ?? (rolRawMe || (Boolean(first.es_admin) ? 'admin' : 'ejecutivo'));

    res.json({
      idusuario: first.idusuario,
      username: first.username,
      nombre: first.nombre,
      es_admin: Boolean(first.es_admin),
      rol: rolMe,
      permisos,
    });
  } catch (err) {
    console.error('[AuthBack] Error en /me:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
