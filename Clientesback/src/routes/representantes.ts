import { Router } from 'express';
import { body } from 'express-validator';
import { getRepresentantes, createRepresentante, updateRepresentante, deleteRepresentante, getRepresentantesPorCliente } from '../controllers/representantes';

const router = Router();

router.get('/', getRepresentantes);
router.get('/por-cliente/:idcliente', getRepresentantesPorCliente);
router.post('/', [
  body('idcliente').isInt().withMessage('Cliente inválido'),
  body('nombre').notEmpty().withMessage('Nombre es requerido')
], createRepresentante);
router.put('/:id', [
  body('idcliente').isInt().withMessage('Cliente inválido'),
  body('nombre').notEmpty().withMessage('Nombre es requerido')
], updateRepresentante);
router.delete('/:id', deleteRepresentante);

export default router;