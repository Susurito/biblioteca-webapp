import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, timer, throwError, from } from 'rxjs';
import { exhaustMap, switchMap, filter, take, timeout, tap, catchError, mergeMap } from 'rxjs/operators';
import { API_URL } from '../api.config';

@Injectable({ providedIn: 'root' })
export class OperacionService {
  private readonly storageKey = 'biblioteca.operaciones';
  constructor(private http: HttpClient) {}

  private pendientes(): string[] {
    try {
      const ids = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [];
    }
    catch { return []; }
  }
  private guardar(id: string, pending: boolean): void {
    const ids = new Set(this.pendientes());
    if (pending) ids.add(id); else ids.delete(id);
    localStorage.setItem(this.storageKey, JSON.stringify([...ids]));
  }
  private esperar(id: string, options: { headers: HttpHeaders }): Observable<any> {
    return timer(0, 1000).pipe(
      exhaustMap(() => this.http.get<any>(`${API_URL}/operaciones/${id}/`, options)),
      filter(op => op.estado === 'completada' || op.estado === 'fallida'),
      take(1),
      timeout(60000),
      tap(() => this.guardar(id, false)),
      switchMap(op => op.estado === 'fallida' && !op.resultado?.rechazo_confirmado
        ? throwError(() => ({ error: { detail: op.error || 'La operación fue compensada.' } }))
        : of({ ...op.resultado, operacion_id: id })),
      catchError(err => throwError(() => err.name === 'TimeoutError'
        ? { error: { detail: 'La operación sigue pendiente. Se recuperará al volver a abrir esta pantalla.' } }
        : err))
    );
  }
  ejecutar(url: string, body: any, options: { headers: HttpHeaders }, method = 'POST'): Observable<any> {
    return this.http.request<any>(method, url, { ...options, body }).pipe(
      switchMap(res => {
        if (!res.operacion_id) return of(res);
        this.guardar(res.operacion_id, true);
        return this.esperar(res.operacion_id, options);
      })
    );
  }
  reanudar(options: { headers: HttpHeaders }): Observable<any> {
    return from(this.pendientes()).pipe(mergeMap(id => this.esperar(id, options), 2));
  }
}
