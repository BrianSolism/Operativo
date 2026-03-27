import { Router } from 'express';
import { body } from 'express-validator';
import { getUnidadesNegocio, createUnidadNegocio, updateUnidadNegocio, deleteUnidadNegocio } from '../../controllers/cat/unidades-negocio';

const router = Router();

router.get('/', getUnidadesNegocio);
router.post('/', [
  body('descripcion').notEmpty().withMessage('Descripción es requerida'),
  body('idunidadestrategico').optional().isInt().withMessage('Unidad estratégica inválida'),
  body('es_multicliente').optional().isInt({ min: 0, max: 1 }).withMessage('es_multicliente debe ser 0 o 1')
], createUnidadNegocio);
router.put('/:id', [
  body('descripcion').notEmpty().withMessage('Descripción es requerida'),
  body('idunidadestrategico').optional().isInt().withMessage('Unidad estratégica inválida'),
  body('es_multicliente').optional().isInt({ min: 0, max: 1 }).withMessage('es_multicliente debe ser 0 o 1')
], updateUnidadNegocio);
router.delete('/:id', deleteUnidadNegocio);

export default router;