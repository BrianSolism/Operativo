import { Router } from 'express';
import * as ctrl from '../controllers/checklist.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Proteger todas las rutas con JWT
router.use(authMiddleware);

router.post('/',         ctrl.create);
router.get('/',          ctrl.list);
router.get('/:id',       ctrl.getById);
router.put('/:id',       ctrl.update);
router.delete('/:id',    ctrl.remove);
router.get('/:id/pdf',   ctrl.downloadPDF);

export default router;
