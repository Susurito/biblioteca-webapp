import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alumnos-screen',
  templateUrl: './alumnos-screen.component.html',
  styleUrls: ['./alumnos-screen.component.scss']
})
export class AlumnosScreenComponent implements OnInit, OnDestroy {
  usuario: any = {
    nombre: 'Cargando...',
    matricula: '',
    fotoPerfil: ''
  };
  
  private authSub!: Subscription;

  defaultDate: Date = new Date();

  librosPrestados = [
    { titulo: 'El Quijote', fechaDevolucion: '10 Oct 2026', progreso: 45 },
    { titulo: 'Clean Code', fechaDevolucion: '12 Oct 2026', progreso: 10 }
  ];

  recomendaciones = [
    { titulo: 'Diseño de Patrones', autor: 'Gang of Four', imagen: 'assets/images/book1.jpg' },
    { titulo: 'Arquitectura Limpia', autor: 'Robert C. Martin', imagen: 'assets/images/book2.jpg' },
    { titulo: 'Angular Avanzado', autor: 'Fernando Herrera', imagen: 'assets/images/book3.jpg' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authSub = this.authService.usuario$.subscribe(u => {
      if (u) {
        this.usuario = u;
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
  }
}
