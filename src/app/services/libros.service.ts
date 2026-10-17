import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Libro {
  id?: number;
  isbn?: string;
  titulo: string;
  autor: string;
  genero: string;
  detalles?: string;
  disponible?: boolean;
  creado?: string;
  actualizado?: string;
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
   * Obtiene la lista de libros (catalogo).
   */
  getLibros(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/libros/');
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
    return this.http.put<any>(this.apiUrl + '/libros/' + id + '/', libro, { headers });
  }

  /**
   * Elimina un libro (solo Administradores).
   */
  eliminarLibro(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(this.apiUrl + '/libros/' + id + '/', { headers });
  }
}
