import { Router } from 'express';
import { body } from 'express-validator';
import { getEmpresas, createEmpresa, updateEmpresa, deleteEmpresa } from '../controllers/empresas';
import { getUnidades, addUnidad, removeUnidad } from '../controllers/empresa-unidad-negocio';

const router = Router();

router.get('/', getEmpresas);
router.post('/', [
  body('nombre').notEmpty().withMessage('Nombre es requerido'),
  body('razon_social').notEmpty().withMessage('Razón social es requerida'),
  body('idpersonalidadjuridica').isInt().withMessage('Personalidad jurídica inválida')
], createEmpresa);
router.put('/:id', [
  body('nombre').notEmpty().withMessage('Nombre es requerido'),
  body('razon_social').notEmpty().withMessage('Razón social es requerida'),
  body('idpersonalidadjuridica').isInt().withMessage('Personalidad jurídica inválida')
], updateEmpresa);
router.delete('/:id', deleteEmpresa);

// Relación empresa ↔ unidades de negocio
router.get('/:id/unidades-negocio', getUnidades);
router.post('/:id/unidades-negocio', [
  body('idunidadnegocio').isInt().withMessage('Unidad de negocio inválida')
], addUnidad);
router.delete('/:id/unidades-negocio/:idunidadnegocio', removeUnidad);

export default router;