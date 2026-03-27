import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  getReglasTipoContrato as getReglasService,
  getReglasWarnings as getWarningsService,
  createReglaTipoContrato as createReglaService,
  updateReglaTipoContrato as updateReglaService,
  deleteReglaTipoContrato as deleteReglaService,
} from '../../services/cat/reglas-tipo-contrato';

export const getReglasTipoContrato = async (_req: Request, res: Response) => {
  try {
    const reglas = await getReglasService();
    res.json(reglas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reglas de tipo contrato' });
  }
};

export const getReglasWarnings = async (_req: Request, res: Response) => {
  try {
    const warnings = await getWarningsService();
    res.json(warnings);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener warnings de reglas' });
  }
};

export const createReglaTipoContrato = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const regla = await createReglaService(req.body);
    res.status(201).json(regla);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear regla de tipo contrato' });
  }
};

export const updateReglaTipoContrato = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const regla = await updateReglaService(parseInt(req.params.id), req.body);
    res.json(regla);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar regla de tipo contrato' });
  }
};

export const deleteReglaTipoContrato = async (req: Request, res: Response) => {
  try {
    await deleteReglaService(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar regla de tipo contrato' });
  }
};
