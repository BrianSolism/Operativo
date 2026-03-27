import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getEmpresas as getEmpresasService, createEmpresa as createEmpresaService, updateEmpresa as updateEmpresaService, deleteEmpresa as deleteEmpresaService } from '../services/empresas';

export const getEmpresas = async (req: Request, res: Response) => {
  try {
    const empresas = await getEmpresasService();
    res.json(empresas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
};

export const createEmpresa = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const empresa = await createEmpresaService(req.body);
    res.status(201).json(empresa);
  } catch {
    res.status(500).json({ error: 'Error al crear empresa' });
  }
};

export const updateEmpresa = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const empresa = await updateEmpresaService(parseInt(req.params.id), req.body);
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
};

export const deleteEmpresa = async (req: Request, res: Response) => {
  try {
    await deleteEmpresaService(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar empresa' });
  }
};