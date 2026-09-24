import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {

  searchTerm: string = '';
  isLoggedIn: boolean = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Verifica si hay sesión activa al cargar la página
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
  }

  onSearch(): void {
    if(this.searchTerm.trim() !== '') {
      // Redirige al catálogo con el término de búsqueda como query
      this.router.navigate(['/catalogo'], { queryParams: { q: this.searchTerm } });
    }
  }

  logout(): void {
    // Elimina token y actualiza la variable
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    // Redirige al inicio
    this.router.navigate(['/']);
  }
}
