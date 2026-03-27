import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ChecklistPayload,
  ChecklistRow,
  ChecklistListItem,
  PagedResponse,
  UsuarioItem,
} from '../shared/models/checklist.model';

@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private readonly base     = `${environment.apiUrl}/api/checklist`;
  private readonly baseUsers = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) {}

  create(data: ChecklistPayload): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(this.base, data);
  }

  list(
    page  = 1,
    limit = 10,
    filters: { material?: string; proveedor?: string; fechaDesde?: string; fechaHasta?: string } = {},
  ): Observable<PagedResponse<ChecklistListItem>> {
    let params = new HttpParams()
      .set('page',  String(page))
      .set('limit', String(limit));

    if (filters.material)   params = params.set('material',   filters.material);
    if (filters.proveedor)  params = params.set('proveedor',  filters.proveedor);
    if (filters.fechaDesde) params = params.set('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params = params.set('fechaHasta', filters.fechaHasta);

    return this.http.get<PagedResponse<ChecklistListItem>>(this.base, { params });
  }

  getById(id: number): Observable<ChecklistRow> {
    return this.http.get<ChecklistRow>(`${this.base}/${id}`);
  }

  update(id: number, data: ChecklistPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  downloadPDF(id: number): void {
    const token = localStorage.getItem('token') ?? '';
    const url   = `${this.base}/${id}/pdf`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        window.open(objUrl, '_blank');
      });
  }

  getUsuarios(rol?: string): Observable<UsuarioItem[]> {
    let params = new HttpParams();
    if (rol) params = params.set('rol', rol);
    return this.http.get<UsuarioItem[]>(this.baseUsers, { params });
  }
}
