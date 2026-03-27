import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  getUnidadesByEmpresa,
  addUnidadToEmpresa,
  removeUnidadFromEmpresa
} from '../services/empresa-unidad-negocio';

export const getUnidades = async (req: Request, res: Response) => {
  try {
    const rows = await getUnidadesByEmpresa(parseInt(req.params.id));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener unidades de negocio de la empresa' });
  }
};

export const addUnidad = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const result = await addUnidadToEmpresa(parseInt(req.params.id), req.body.idunidadnegocio);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar unidad de negocio' });
  }
};

export const removeUnidad = async (req: Request, res: Response) => {
  try {
    await removeUnidadFromEmpresa(parseInt(req.params.id), parseInt(req.params.idunidadnegocio));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al quitar unidad de negocio' });
  }
};
