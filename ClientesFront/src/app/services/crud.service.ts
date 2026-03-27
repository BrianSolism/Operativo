import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { API } from '../api';

@Injectable({ providedIn: 'root' })
export class CrudService<T> {
  protected base = '';
  constructor(protected http: HttpClient) {}

  useBase(path: string): this {
    this.base = path;
    return this;
  }

  list(): Observable<T[]> {
    return this.http.get<T[]>(`${API}/${this.base}`);
  }
  create(data: Partial<T>) {
    return this.http.post<T>(`${API}/${this.base}`, data);
  }
  update(id: number, data: Partial<T>) {
    return this.http.put<T>(`${API}/${this.base}/${id}`, data);
  }
  remove(id: number) {
    return this.http.delete(`${API}/${this.base}/${id}`);
  }
}
