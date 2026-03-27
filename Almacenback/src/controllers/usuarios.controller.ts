import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { poolClientes as pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface AuthRequest extends Request {
  user?: { id: number; email: string; rol: string };
}

// Mapeo numérico ↔ nombre de rol
const ROL_TO_STR: Record<string, string> = { '1': 'admin', '2': 'ejecutivo', '3': 'montacarguista' };
const STR_TO_ROL: Record<string, number>  = { admin: 1, ejecutivo: 2, montacarguista: 3 };

function toRolStr(val: unknown): string {
  const s = String(val ?? '');
  return ROL_TO_STR[s] ?? s;
}
function toRolNum(val: string | undefined): number | undefined {
  if (!val) return undefined;
  return STR_TO_ROL[val.toLowerCase()] ?? Number(val) ?? undefined;
}

// ─────────────────────────────────────────────────────────────
//  GET /api/usuarios  (con filtro opcional ?rol=montacarguista)
// ─────────────────────────────────────────────────────────────
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rol = req.query.rol as string | undefined;
    const params: unknown[] = [];
    let where = 'WHERE activo = 1';

    if (rol) {
      const num = parseInt(rol, 10);
      if (!isNaN(num)) {
        // Vino como número (ej: ?rol=3) — comparar por índice ENUM
        where += ' AND rol = ?';
        params.push(num);
      } else {
        // Vino como string (ej: ?rol=montacarguista) — comparar directo
        where += ' AND rol = ?';
        params.push(rol);
      }
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT idusuario AS id, nombre, username AS email, rol, activo FROM usuarios ${where} ORDER BY nombre`,
      params.length ? params : undefined,
    );
    const mapped = (rows as RowDataPacket[]).map(r => ({ ...r, rol: toRolStr(r.rol) }));
    res.json(mapped);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  POST /api/usuarios  (solo admin)
// ─────────────────────────────────────────────────────────────
export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }

    const { nombre, email, password, rol } = req.body as {
      nombre: string; email: string; password: string; rol: string;
    };

    if (!nombre || !email || !password || !rol) {
      res.status(400).json({ message: 'Todos los campos son requeridos' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO usuarios (nombre, username, password_hash, rol) VALUES (?,?,?,?)',
      [nombre, email, hash, rol],
    );
    res.status(201).json({ message: 'Usuario creado correctamente', id: result.insertId });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException & { code?: string }).code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'El email ya está registrado' });
      return;
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  PUT /api/usuarios/:id  (solo admin)
// ─────────────────────────────────────────────────────────────
export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }

    const id = parseInt(req.params.id, 10);
    const { nombre, email, password, rol } = req.body as {
      nombre?: string; email?: string; password?: string; rol?: string;
    };

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query<ResultSetHeader>(
        'UPDATE usuarios SET nombre=?, username=?, password_hash=?, rol=? WHERE idusuario=?',
        [nombre, email, hash, rol, id],
      );
    } else {
      await pool.query<ResultSetHeader>(
        'UPDATE usuarios SET nombre=?, username=?, rol=? WHERE idusuario=?',
        [nombre, email, rol, id],
      );
    }

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  PATCH /api/usuarios/:id/toggle  (solo admin)
// ─────────────────────────────────────────────────────────────
export async function toggle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }

    const id = parseInt(req.params.id, 10);
    await pool.execute(
      'UPDATE usuarios SET activo = NOT activo WHERE idusuario = ?',
      [id],
    );
    res.json({ message: 'Estado actualizado correctamente' });
  } catch (err) {
    next(err);
  }
}
