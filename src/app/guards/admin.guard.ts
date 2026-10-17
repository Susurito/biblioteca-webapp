import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    const rol = (localStorage.getItem('rol') || '').toLowerCase().trim();
    const isAdmin = rol === 'administrador' || rol === 'admin' || rol === 'administradores';

    if (token && isAdmin) {
      return true;
    } else if (token) {
      this.router.navigate(['/catalogo']);
      return false;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
