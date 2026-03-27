import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../index';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/usuarios
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT idusuario, username, nombre, es_admin, activo, fecha_registro FROM usuarios ORDER BY idusuario'
    );
    res.json(rows);
  } catch { res.status(500).json({ message: 'Error al obtener usuarios' }); }
});

// GET /api/usuarios/:id/permisos
router.get('/:id/permisos', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.idmodulo, m.clave, m.nombre,
              COALESCE(p.puede_ver,      0) AS puede_ver,
              COALESCE(p.puede_crear,    0) AS puede_crear,
              COALESCE(p.puede_editar,   0) AS puede_editar,
              COALESCE(p.puede_eliminar, 0) AS puede_eliminar
       FROM modulos m
       LEFT JOIN permisos_usuario p ON p.idmodulo = m.idmodulo AND p.idusuario = ?
       ORDER BY m.idmodulo`,
      [req.params.id]
    );
    res.json(rows);
  } catch { res.status(500).json({ message: 'Error al obtener permisos' }); }
});

// POST /api/usuarios
router.post('/', async (req, res) => {
  const { username, password, nombre, es_admin } = req.body;
  if (!username || !password || !nombre)
    return res.status(400).json({ message: 'username, password y nombre son requeridos' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO usuarios (username, password_hash, nombre, es_admin) VALUES (?, ?, ?, ?)',
      [username, hash, nombre, es_admin ? 1 : 0]
    );
    res.json({ idusuario: result.insertId });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'El nombre de usuario ya existe' });
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', async (req, res) => {
  const { nombre, es_admin, activo, password } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE usuarios SET nombre=?, es_admin=?, activo=?, password_hash=? WHERE idusuario=?',
        [nombre, es_admin ? 1 : 0, activo ? 1 : 0, hash, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET nombre=?, es_admin=?, activo=? WHERE idusuario=?',
        [nombre, es_admin ? 1 : 0, activo ? 1 : 0, req.params.id]
      );
    }
    res.json({ ok: true });
  } catch { res.status(500).json({ message: 'Error al actualizar usuario' }); }
});

// PUT /api/usuarios/:id/permisos
router.put('/:id/permisos', async (req, res) => {
  const permisos: Array<{
    idmodulo: number;
    puede_ver: boolean;
    puede_crear: boolean;
    puede_editar: boolean;
    puede_eliminar: boolean;
  }> = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM permisos_usuario WHERE idusuario = ?', [req.params.id]);
    for (const p of permisos) {
      await conn.query(
        'INSERT INTO permisos_usuario (idusuario, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES (?, ?, ?, ?, ?, ?)',
        [req.params.id, p.idmodulo, p.puede_ver ? 1 : 0, p.puede_crear ? 1 : 0, p.puede_editar ? 1 : 0, p.puede_eliminar ? 1 : 0]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch {
    await conn.rollback();
    res.status(500).json({ message: 'Error al guardar permisos' });
  } finally {
    conn.release();
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  if (parseInt(req.params.id) === req.user!.idusuario)
    return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
  try {
    await pool.query('DELETE FROM usuarios WHERE idusuario = ?', [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ message: 'Error al eliminar usuario' }); }
});

export default router;
