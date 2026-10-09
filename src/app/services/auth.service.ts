import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface Usuario {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  matricula?: string;
  rol: string;
  fotoPerfil: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000';

  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Al iniciar, si hay token guardado, carga el perfil
    this.inicializarSesion();
  }

  private inicializarSesion(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.cargarPerfil(token);
    }
  }

  /**
   * Inicia sesión con las credenciales y carga el perfil del usuario.
   * Retorna un Observable para que el componente de login pueda manejar la respuesta.
   */
  login(email: string, password: string): Observable<any> {
    return new Observable(observer => {
      const data = { username: email, password: password };

      this.http.post<any>(`${this.apiUrl}/token/`, data).subscribe({
        next: (response) => {
          // Guardar token
          localStorage.setItem('token', response.token);

          // Normalizar y guardar rol
          let rol = response.rol?.toLowerCase().trim();
          if (rol === 'alumnos') rol = 'alumno';
          if (rol === 'administradores') rol = 'administrador';
          localStorage.setItem('rol', rol);

          // Cargar perfil completo
          this.cargarPerfil(response.token);

          observer.next({ token: response.token, rol });
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  /**
   * Carga el perfil del usuario autenticado desde el backend.
   */
  cargarPerfil(token: string): void {
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    this.http.get<any>(`${this.apiUrl}/perfil/`, { headers }).subscribe({
      next: (res) => {
        const usuario: Usuario = {
          nombre: res.nombre || '',
          apellido_paterno: res.apellido_paterno || '',
          apellido_materno: res.apellido_materno || '',
          email: res.email || '',
          matricula: res.matricula || '',
          rol: res.rol || localStorage.getItem('rol') || '',
          fotoPerfil: 'assets/images/default-avatar.png'
        };

        // Actualizar rol en localStorage si viene del perfil
        if (res.rol) {
          let rol = res.rol.toLowerCase().trim();
          if (rol === 'alumnos') rol = 'alumno';
          if (rol === 'administradores') rol = 'administrador';
          localStorage.setItem('rol', rol);
        }

        this.usuarioSubject.next(usuario);
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        // Si el token es inválido (403/401), limpiar sesión
        if (err.status === 401 || err.status === 403) {
          this.logout();
        }
      }
    });
  }

  /**
   * Cierra la sesión del usuario.
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    this.usuarioSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Retorna el usuario actual (snapshot, no observable).
   */
  getUsuarioActual(): Usuario | null {
    return this.usuarioSubject.getValue();
  }

  /**
   * Verifica si el usuario está logueado como observable reactivo.
   */
  get isLoggedIn$(): Observable<boolean> {
    return new Observable(observer => {
      this.usuario$.subscribe(usuario => {
        observer.next(usuario !== null);
      });
    });
  }

  /**
   * Verifica si el usuario actual es administrador.
   */
  isAdmin(): boolean {
    const usuario = this.usuarioSubject.getValue();
    if (!usuario) return false;
    const rol = usuario.rol?.toLowerCase() || '';
    return rol === 'administrador' || rol === 'admin' || rol === 'administradores' || rol === 'administrator';
  }

  /**
   * Verifica si hay un token válido en localStorage.
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Obtiene el token actual.
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Actualiza la foto de perfil del usuario.
   */
  actualizarFotoPerfil(fotoUrl: string): void {
    const usuario = this.usuarioSubject.getValue();
    if (usuario) {
      usuario.fotoPerfil = fotoUrl;
      this.usuarioSubject.next({ ...usuario });
    }
  }
}
