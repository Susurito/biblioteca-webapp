import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Libro {
  id?: number;
  isbn?: string;
  titulo: string;
  autor: string;
  genero: string;
  detalles?: string;
  disponible?: boolean;
  total_ejemplares?: number;
  baja?: boolean;
  disponibles?: number;
  prestados?: number;
  estado_ejemplar?: 'disponible' | 'sin_stock' | 'dado_de_baja';
  creado?: string;
  actualizado?: string;
}

export interface EstadisticasEjemplares {
  activos: number;
  sin_stock: number;
  dados_de_baja: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class LibrosService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + (token || '')
    });
  }

  /**
   * Obtiene la lista de libros (catálogo / ejemplares).
   */
  getLibros(queryParams?: any): Observable<any> {
    let params = new HttpParams();
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== null && queryParams[key] !== undefined && queryParams[key] !== '') {
          params = params.set(key, queryParams[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl + '/libros/', { params });
  }

  /**
   * Obtiene estadísticas agregadas de ejemplares (activos, sin stock, dados de baja).
   */
  getEjemplaresEstadisticas(): Observable<EstadisticasEjemplares> {
    const headers = this.getAuthHeaders();
    return this.http.get<EstadisticasEjemplares>(this.apiUrl + '/libros/estadisticas/', { headers });
  }

  /**
   * Obtiene la lista de libros recomendados desde la BD.
   */
  getLibrosRecomendados(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(this.apiUrl + '/libros/recomendados/', { headers });
  }

  /**
   * Registra un nuevo libro en el sistema.
   * Requiere rol de Administrador.
   */
  registrarLibro(libro: Libro): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl + '/libros/', libro, { headers });
  }

  /**
   * Actualiza un libro existente (solo Administradores).
   */
  actualizarLibro(id: number, libro: Partial<Libro>): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(this.apiUrl + '/libros/' + id + '/', libro, { headers });
  }

  /**
   * Da de baja un libro/ejemplar.
   */
  darDeBaja(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl + '/libros/' + id + '/dar-de-baja/', {}, { headers });
  }

  /**
   * Reactiva (da de alta) un libro/ejemplar previamente dado de baja.
   */
  darDeAlta(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl + '/libros/' + id + '/dar-de-alta/', {}, { headers });
  }

  /**
   * Elimina un libro (solo Administradores).
   */
  eliminarLibro(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(this.apiUrl + '/libros/' + id + '/', { headers });
  }
}
