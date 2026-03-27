import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  getUnidadesNegocio as getUnidadesService,
  createUnidadNegocio as createUnidadService,
  updateUnidadNegocio as updateUnidadService,
  deleteUnidadNegocio as deleteUnidadService,
} from '../../services/cat/unidades-negocio';

export const getUnidadesNegocio = async (_req: Request, res: Response) => {
  try {
    const unidades = await getUnidadesService();
    res.json(unidades);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener unidades de negocio' });
  }
};

export const createUnidadNegocio = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const unidad = await createUnidadService(req.body);
    res.status(201).json(unidad);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear unidad de negocio' });
  }
};

export const updateUnidadNegocio = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const unidad = await updateUnidadService(parseInt(req.params.id), req.body);
    res.json(unidad);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar unidad de negocio' });
  }
};

export const deleteUnidadNegocio = async (req: Request, res: Response) => {
  try {
    await deleteUnidadService(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar unidad de negocio' });
  }
};
