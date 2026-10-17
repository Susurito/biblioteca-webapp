import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  searchTerm: string = '';

  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  isAlumno: boolean = false;
  isMenuOpen: boolean = false;

  usuario: Usuario = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    matricula: '',
    rol: '',
    fotoPerfil: 'assets/images/default-avatar.png'
  };

  private suscripcion!: Subscription;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    // Inicialización inmediata para evitar parpadeos
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isAdmin = this.authService.isAdmin();
    this.isAlumno = this.authService.isAlumno();

    this.suscripcion = this.authService.usuario$.subscribe(usuario => {
      this.isLoggedIn = this.authService.isLoggedIn();
      this.isAdmin = this.authService.isAdmin();
      this.isAlumno = this.authService.isAlumno();

      if (usuario) {
        this.usuario = usuario;
      } else if (!this.isLoggedIn) {
        this.usuario = {
          nombre: '',
          apellido_paterno: '',
          apellido_materno: '',
          email: '',
          matricula: '',
          rol: '',
          fotoPerfil: 'assets/images/default-avatar.png'
        };
      }
    });
  }

  ngOnDestroy(): void {
    if (this.suscripcion) {
      this.suscripcion.unsubscribe();
    }
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/catalogo'], { queryParams: { q: this.searchTerm } });
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.isAlumno = false;
    this.isMenuOpen = false;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.authService.actualizarFotoPerfil(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
}
