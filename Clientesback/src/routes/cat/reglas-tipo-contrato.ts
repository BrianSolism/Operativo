import { Router } from 'express';
import { body } from 'express-validator';
import { getReglasTipoContrato, createReglaTipoContrato, updateReglaTipoContrato, deleteReglaTipoContrato, getReglasWarnings } from '../../controllers/cat/reglas-tipo-contrato';

const router = Router();

router.get('/', getReglasTipoContrato);
router.get('/warnings', getReglasWarnings);
router.post('/', [
  body('idtiposervicio').isInt().withMessage('Tipo de servicio inválido'),
  body('idpersonalidadjuridica').isInt().withMessage('Personalidad jurídica inválida'),
  body('idtipocontrato').optional().isInt().withMessage('Tipo de contrato inválido')
], createReglaTipoContrato);
router.put('/:id', [
  body('idtiposervicio').isInt().withMessage('Tipo de servicio inválido'),
  body('idpersonalidadjuridica').isInt().withMessage('Personalidad jurídica inválida'),
  body('idtipocontrato').optional().isInt().withMessage('Tipo de contrato inválido')
], updateReglaTipoContrato);
router.delete('/:id', deleteReglaTipoContrato);

export default router;