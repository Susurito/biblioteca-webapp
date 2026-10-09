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

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.suscripcion = this.authService.usuario$.subscribe(usuario => {
      if (usuario) {
        this.isLoggedIn = true;
        this.isAdmin = this.authService.isAdmin();
        this.usuario = usuario;
      } else {
        this.isLoggedIn = false;
        this.isAdmin = false;
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

