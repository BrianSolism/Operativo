import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getRepresentantes as getRepresentantesService, createRepresentante as createRepresentanteService, updateRepresentante as updateRepresentanteService, deleteRepresentante as deleteRepresentanteService, getRepresentantesPorCliente as getRepresentantesPorClienteService } from '../services/representantes';

export const getRepresentantes = async (req: Request, res: Response) => {
  try {
    const representantes = await getRepresentantesService();
    res.json(representantes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener representantes' });
  }
};

export const getRepresentantesPorCliente = async (req: Request, res: Response) => {
  try {
    const representantes = await getRepresentantesPorClienteService(parseInt(req.params.idcliente));
    res.json(representantes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener representantes por cliente' });
  }
};

export const createRepresentante = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const representante = await createRepresentanteService(req.body);
    res.status(201).json(representante);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear representante' });
  }
};

export const updateRepresentante = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const representante = await updateRepresentanteService(parseInt(req.params.id), req.body);
    res.json(representante);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar representante' });
  }
};

export const deleteRepresentante = async (req: Request, res: Response) => {
  try {
    await deleteRepresentanteService(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar representante' });
  }
};