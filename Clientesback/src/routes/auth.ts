import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../index';
import { requireAuth, AuthRequest, JWT_SECRET } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM usuarios WHERE username = ? AND activo = 1',
      [username]
    );
    if (!rows.length) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { idusuario: user.idusuario, username: user.username, es_admin: !!user.es_admin },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.idusuario, u.username, u.nombre, u.es_admin,
              m.clave AS modulo,
              p.puede_ver, p.puede_crear, p.puede_editar, p.puede_eliminar
       FROM usuarios u
       LEFT JOIN permisos_usuario p ON p.idusuario = u.idusuario
       LEFT JOIN modulos m ON m.idmodulo = p.idmodulo
       WHERE u.idusuario = ?`,
      [req.user!.idusuario]
    );

    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });

    const { idusuario, username, nombre, es_admin } = rows[0];
    const permisos: Record<string, any> = {};

    rows.forEach(row => {
      if (row.modulo) {
        permisos[row.modulo] = {
          ver:      !!row.puede_ver,
          crear:    !!row.puede_crear,
          editar:   !!row.puede_editar,
          eliminar: !!row.puede_eliminar,
        };
      }
    });

    res.json({ idusuario, username, nombre, es_admin: !!es_admin, permisos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;
