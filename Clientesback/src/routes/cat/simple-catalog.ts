import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../../index';

interface SimpleCatalogConfig {
  table: string;
  idField: string;
}

/**
 * Factory que genera un Router CRUD completo para catálogos simples
 * (sólo campo `descripcion`). Consolida los 5 catálogos idénticos en una sola función.
 */
export function createSimpleCatalogRouter({ table, idField }: SimpleCatalogConfig): Router {
  const router = Router();
  const validate = [body('descripcion').notEmpty().withMessage('Descripción es requerida')];

  router.get('/', async (_req, res) => {
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE activo = 1`);
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Error al obtener registros' });
    }
  });

  router.post('/', validate, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const [result] = await pool.execute(
        `INSERT INTO ${table} (descripcion) VALUES (?)`,
        [req.body.descripcion]
      );
      res.status(201).json({ [idField]: (result as any).insertId, ...req.body });
    } catch {
      res.status(500).json({ error: 'Error al crear registro' });
    }
  });

  router.put('/:id', validate, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      await pool.execute(
        `UPDATE ${table} SET descripcion = ?, fecha_mod = NOW() WHERE ${idField} = ?`,
        [req.body.descripcion, req.params.id]
      );
      res.json({ [idField]: parseInt(req.params.id), ...req.body });
    } catch {
      res.status(500).json({ error: 'Error al actualizar registro' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await pool.execute(
        `UPDATE ${table} SET activo = 0, fecha_mod = NOW() WHERE ${idField} = ?`,
        [req.params.id]
      );
      res.status(204).send();
    } catch {
      res.status(500).json({ error: 'Error al eliminar registro' });
    }
  });

  return router;
}
