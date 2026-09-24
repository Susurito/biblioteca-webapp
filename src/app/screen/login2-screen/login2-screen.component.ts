import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login2-screen',
  templateUrl: './login2-screen.component.html',
  styleUrls: ['./login2-screen.component.scss']
})
export class Login2ScreenComponent {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  errorMsg: string = '';

  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private router: Router, private http: HttpClient) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    const data = { username: this.email, password: this.password };

    this.http.post<any>(`${this.apiUrl}/token/`, data).subscribe(
      (usuario) => {
        console.log('Usuario logueado:', usuario);

        // CORREGIDO: Guardar token Y rol en localStorage
        localStorage.setItem('token', usuario.token);
        
        // Normalizar rol y guardarlo
        let rol = usuario.rol?.toLowerCase().trim();
        if (rol === 'alumnos') rol = 'alumno';
        if (rol === 'administradores') rol = 'administrador';
        
        //  ESTA LÍNEA FALTABA - GUARDAR EL ROL
        localStorage.setItem('rol', rol);
        
        console.log(' Token guardado:', usuario.token);
        console.log(' Rol guardado:', rol);

        // Redirigir según rol
        if (rol === 'alumno') {
          this.router.navigate(['/alumnos']);
        } else if (rol === 'administrador') {
          this.router.navigate(['/admin']);
        } else {
          alert('Usuario sin rol definido');
        }
      },
      (err) => {
        console.error('Error en login:', err);
        alert('Credenciales incorrectas');
      }
    );
  }

  volver() {
    this.router.navigate(['/']);
  }
}