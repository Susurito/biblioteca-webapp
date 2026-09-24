import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contacto-screen',
  templateUrl: './contacto-screen.component.html',
  styleUrls: ['./contacto-screen.component.scss']
})
export class ContactoScreenComponent implements OnInit {

  isLoggedIn: boolean = false;

  name: string = '';
  email: string = '';
  message: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Validar si hay sesión
    this.isLoggedIn = !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }

  sendMessage() {
    console.log('Mensaje enviado:', { name: this.name, email: this.email, message: this.message });
    alert('Gracias por contactarnos, te responderemos pronto.');
    // Limpiar formulario
    this.name = '';
    this.email = '';
    this.message = '';
  }
}
