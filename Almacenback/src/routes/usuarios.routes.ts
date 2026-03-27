import { Router } from 'express';
import * as ctrl from '../controllers/usuarios.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/',           ctrl.list);
router.post('/',          ctrl.create);
router.put('/:id',        ctrl.update);
router.patch('/:id/toggle', ctrl.toggle);

export default router;
