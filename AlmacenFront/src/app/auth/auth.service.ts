import { Injectable } from '@angular/core';

export interface CurrentUser {
  id: number;
  nombre: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  getCurrentUser(): CurrentUser | null {
    const raw = localStorage.getItem('_u');
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      return {
        id: u.idusuario ?? u.id ?? 0,
        nombre: u.nombre ?? '',
        rol: u.es_admin ? 'admin' : (u.rol ?? 'ejecutivo'),
      };
    } catch {
      return null;
    }
  }
}
