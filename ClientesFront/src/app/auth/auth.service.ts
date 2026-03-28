import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

const API = '/api';

export interface UserPermisos {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface AuthUser {
  idusuario: number;
  username: string;
  nombre: string;
  es_admin: boolean;
  permisos: Record<string, UserPermisos>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<AuthUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    if (this.getToken()) this.loadMe();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  login(username: string, password: string) {
    return this.http
      .post<{ token: string; user: AuthUser }>(`${API}/auth/login`, { username, password })
      .pipe(
        tap(res => {
          localStorage.setItem('token', res.token);
          this.loadMe();
        })
      );
  }

  loadMe() {
    this.http.get<AuthUser>(`${API}/auth/me`).subscribe({
      next: user => {
        localStorage.setItem('_u', JSON.stringify(user));
        this.currentUser.set(user);
      },
      error: err => {
        if (err.status === 401 || err.status === 403) {
          this.logout();
        } else {
          const cached = localStorage.getItem('_u');
          if (cached) this.currentUser.set(JSON.parse(cached));
        }
      },
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('_u');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  can(modulo: string, accion: keyof UserPermisos): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.es_admin) return true;
    return user.permisos[modulo]?.[accion] ?? false;
  }

  canView(modulo: string): boolean {
    return this.can(modulo, 'ver');
  }
}
