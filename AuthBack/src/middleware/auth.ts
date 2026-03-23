import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'algebasa_jwt_secret_2024';

export interface AuthRequest extends Request {
  user?: {
    idusuario: number;
    username: string;
    es_admin: boolean;
  };
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      idusuario: number;
      username: string;
      es_admin: boolean;
    };

    req.user = {
      idusuario: decoded.idusuario,
      username: decoded.username,
      es_admin: decoded.es_admin,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
