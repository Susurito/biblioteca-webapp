import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-alumnos-screen',
  templateUrl: './alumnos-screen.component.html',
  
})
export class AlumnosScreenComponent {
  searchTerm: string = '';

  constructor(private router: Router) {}

  // Método para búsqueda
  onSearch(): void {
    if (this.searchTerm.trim()) {
      console.log('Buscando libro:', this.searchTerm);
      // Aquí podrías navegar a un componente de resultados:
      // this.router.navigate(['/catalogo'], { queryParams: { q: this.searchTerm } });
    } else {
      console.log('Campo de búsqueda vacío');
    }
  }

  // Método para ir a la cuenta (opcional, si no usas routerLink en el HTML)
  irCuenta(): void {
    this.router.navigate(['/cuenta']);
  }
}
