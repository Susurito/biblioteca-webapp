import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(private router: Router, private authService: AuthService) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (result) => {
        console.log('Usuario logueado, rol:', result.rol);

        // Redirigir según rol
        if (result.rol === 'alumno') {
          this.router.navigate(['/alumnos']);
        } else if (result.rol === 'administrador') {
          this.router.navigate(['/admin']);
        } else {
          alert('Usuario sin rol definido');
        }
      },
      error: (err) => {
        console.error('Error en login:', err);
        alert('Credenciales incorrectas');
      }
    });
  }

  volver() {
    this.router.navigate(['/']);
  }
}