import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsuarioItem } from '../shared/models/checklist.model';

export interface UsuarioForm {
  nombre:   string;
  email:    string;
  password?: string;
  rol:      string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly base = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) {}

  list(): Observable<UsuarioItem[]> {
    return this.http.get<UsuarioItem[]>(this.base);
  }

  create(data: UsuarioForm): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(this.base, data);
  }

  update(id: number, data: UsuarioForm): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${id}`, data);
  }

  toggle(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/${id}/toggle`, {});
  }
}
