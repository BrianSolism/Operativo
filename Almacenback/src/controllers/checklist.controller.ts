import { Request, Response, NextFunction } from 'express';
import * as svc from '../services/checklist.service';
import { generatePDF } from '../services/pdf.service';

// Extiende req para incluir el usuario del JWT
interface AuthRequest extends Request {
  user?: { id: number; email: string; rol: string };
}

// ─────────────────────────────────────────────────────────────
//  POST /api/checklist
// ─────────────────────────────────────────────────────────────
export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = {
      ...req.body,
      ejecutivoId: req.user?.id ?? null,
    };
    const id = await svc.createChecklist(payload);
    res.status(201).json({ message: 'Checklist creado correctamente', id });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/checklist
// ─────────────────────────────────────────────────────────────
export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page  = parseInt(String(req.query.page  ?? 1),  10);
    const limit = parseInt(String(req.query.limit ?? 10), 10);

    const filters: Parameters<typeof svc.listChecklists>[2] = {
      material:    req.query.material    as string | undefined,
      proveedor:   req.query.proveedor   as string | undefined,
      fechaDesde:  req.query.fechaDesde  as string | undefined,
      fechaHasta:  req.query.fechaHasta  as string | undefined,
    };

    // Montacarguista solo ve los checklists asignados a él
    if (req.user?.rol === 'montacarguista') {
      filters.asignadoAId = req.user.id;
    }

    const result = await svc.listChecklists(page, limit, filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/checklist/:id
// ─────────────────────────────────────────────────────────────
export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const cl = await svc.getChecklistById(id);
    if (!cl) { res.status(404).json({ message: 'Checklist no encontrado' }); return; }
    res.json(cl);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  PUT /api/checklist/:id
// ─────────────────────────────────────────────────────────────
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await svc.getChecklistById(id);
    if (!existing) { res.status(404).json({ message: 'Checklist no encontrado' }); return; }
    await svc.updateChecklist(id, req.body);
    res.json({ message: 'Checklist actualizado correctamente' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  DELETE /api/checklist/:id
// ─────────────────────────────────────────────────────────────
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await svc.getChecklistById(id);
    if (!existing) { res.status(404).json({ message: 'Checklist no encontrado' }); return; }
    await svc.deleteChecklist(id);
    res.json({ message: 'Checklist eliminado correctamente' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  GET /api/checklist/:id/pdf
// ─────────────────────────────────────────────────────────────
export async function downloadPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const cl = await svc.getChecklistById(id);
    if (!cl) { res.status(404).json({ message: 'Checklist no encontrado' }); return; }
    generatePDF(cl, res);
  } catch (err) {
    next(err);
  }
}
