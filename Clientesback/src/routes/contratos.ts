import { Router } from 'express';
import { body } from 'express-validator';
import { getContratos, createContrato, updateContrato, deleteContrato, getReglaTipoContrato, getContratosStats, getServiciosCaratula } from '../controllers/contratos';

const router = Router();

router.get('/', getContratos);
router.get('/stats', getContratosStats);
router.get('/regla', getReglaTipoContrato);
router.get('/:id/servicios-caratula', getServiciosCaratula);
router.post('/', [
  body('idcliente').isInt().withMessage('Cliente inválido'),
  body('idrepresentante').optional().isInt().withMessage('Representante inválido'),
  body('idtiposervicio').isInt().withMessage('Tipo de servicio inválido'),
  body('idunidadnegocio').isInt().withMessage('Unidad de negocio inválida'),
  body('fecha_inicio').isISO8601().withMessage('Fecha de inicio inválida'),
  body('fecha_fin').isISO8601().withMessage('Fecha de fin inválida')
], createContrato);
router.put('/:id', [
  body('idcliente').isInt().withMessage('Cliente inválido'),
  body('idrepresentante').optional().isInt().withMessage('Representante inválido'),
  body('idtiposervicio').isInt().withMessage('Tipo de servicio inválido'),
  body('idunidadnegocio').isInt().withMessage('Unidad de negocio inválida'),
  body('fecha_inicio').isISO8601().withMessage('Fecha de inicio inválida'),
  body('fecha_fin').isISO8601().withMessage('Fecha de fin inválida')
], updateContrato);
router.delete('/:id', deleteContrato);

export default router;