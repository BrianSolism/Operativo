import { Router } from 'express';
import { body } from 'express-validator';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../controllers/clientes';

const router = Router();

router.get('/', getClientes);
const clienteValidations = [
  body('nombre').notEmpty().withMessage('Nombre es requerido'),
  body('rfc').notEmpty().withMessage('RFC es requerido'),
  body('calle').notEmpty().withMessage('Calle es requerida'),
  body('idtipocliente').isInt().withMessage('Tipo de cliente inválido'),
  body('idpersonalidadjuridica').isInt().withMessage('Personalidad jurídica inválida')
];

router.post('/', clienteValidations, createCliente);
router.put('/:id', clienteValidations, updateCliente);
router.delete('/:id', deleteCliente);

export default router;