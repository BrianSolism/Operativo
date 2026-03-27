import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getContratos as getContratosService, createContrato as createContratoService, updateContrato as updateContratoService, deleteContrato as deleteContratoService, getReglaTipoContrato as getReglaTipoContratoService, getContratosStats as getContratosStatsService, getServiciosCaratula as getServiciosCaratulaService } from '../services/contratos';

export const getContratos = async (req: Request, res: Response) => {
  try {
    const contratos = await getContratosService();
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contratos' });
  }
};

export const getContratosStats = async (req: Request, res: Response) => {
  try {
    const stats = await getContratosStatsService();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const getReglaTipoContrato = async (req: Request, res: Response) => {
  const { idtiposervicio, idpersonalidadjuridica } = req.query;
  if (!idtiposervicio || !idpersonalidadjuridica) {
    return res.status(400).json({ error: 'idtiposervicio y idpersonalidadjuridica son requeridos' });
  }

  try {
    const regla = await getReglaTipoContratoService(parseInt(idtiposervicio as string), parseInt(idpersonalidadjuridica as string));
    res.json(regla);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener regla' });
  }
};

export const getServiciosCaratula = async (req: Request, res: Response) => {
  try {
    const servicios = await getServiciosCaratulaService(parseInt(req.params.id));
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicios en carátula' });
  }
};

export const createContrato = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const contrato = await createContratoService(req.body);
    res.status(201).json(contrato);
  } catch (error) {
    if (error instanceof Error && error.message === 'Combinación no válida') {
      res.status(422).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error al crear contrato' });
    }
  }
};

export const updateContrato = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const contrato = await updateContratoService(parseInt(req.params.id), req.body);
    res.json(contrato);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar contrato' });
  }
};

export const deleteContrato = async (req: Request, res: Response) => {
  try {
    await deleteContratoService(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar contrato' });
  }
};