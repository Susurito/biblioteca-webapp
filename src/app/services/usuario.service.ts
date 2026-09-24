import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  registrarAlumno(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/alumnos/`, data);
  }

  registrarAdmin(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/`, data);
  }

  getAlumnos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/lista-alumnos/`);
  }

  getAdmins(): Observable<any> {
    return this.http.get(`${this.apiUrl}/lista-admins/`);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/token/`, { username: email, password: password });
  }
  
}
