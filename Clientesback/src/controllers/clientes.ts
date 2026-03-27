import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getClientes as getClientesService, createCliente as createClienteService, updateCliente as updateClienteService, deleteCliente as deleteClienteService } from '../services/clientes';

export const getClientes = async (req: Request, res: Response) => {
  try {
    const clientes = await getClientesService();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

export const createCliente = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const cliente = await createClienteService(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

export const updateCliente = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const cliente = await updateClienteService(parseInt(req.params.id), req.body);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

export const deleteCliente = async (req: Request, res: Response) => {
  try {
    await deleteClienteService(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};