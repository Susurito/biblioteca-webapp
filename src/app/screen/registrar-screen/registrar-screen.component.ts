import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LibrosService } from '../../services/libros.service';

@Component({
  selector: 'app-registro-screen',
  templateUrl: './registrar-screen.component.html',
  styleUrls: ['./registrar-screen.component.scss']
})
export class RegistroScreenComponent implements OnInit {
  libroForm: FormGroup;
  isAdmin: boolean = false;
  cargando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private librosService: LibrosService,
    private router: Router
  ) {
    this.libroForm = this.fb.group({
      isbn: ['', [Validators.required, Validators.maxLength(30)]],
      titulo: ['', Validators.required],
      autor: ['', Validators.required],
      genero: ['', Validators.required],
      detalles: [''],
      disponible: [true]
    });
  }

  ngOnInit(): void {
    this.verificarRolAdmin();
  }

  verificarRolAdmin(): void {
    const token = localStorage.getItem('token');
    const rol = (localStorage.getItem('rol') || '').toLowerCase().trim();

    this.isAdmin = rol === 'administrador' || rol === 'admin' || rol === 'administradores';

    if (!token) {
      alert('Debes iniciar sesión para acceder.');
      this.router.navigate(['/login']);
    } else if (!this.isAdmin) {
      alert('Acceso restringido. Esta función corresponde únicamente al rol de Administrador.');
      this.router.navigate(['/catalogo']);
    }
  }

  registrarLibro(): void {
    if (this.libroForm.invalid) {
      this.libroForm.markAllAsTouched();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sesión no válida o expirada.');
      this.router.navigate(['/login']);
      return;
    }

    this.cargando = true;
    this.librosService.registrarLibro(this.libroForm.value).subscribe({
      next: (res) => {
        this.cargando = false;
        console.log('Libro registrado con éxito en backend:', res);
        alert('¡Libro registrado exitosamente!');
        this.libroForm.reset({ disponible: true, isbn: '' });
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al registrar libro:', err);
        const errorMsg = err.error?.error || err.error?.detalles?.isbn?.[0] || err.error?.detail || 'Error al registrar libro.';
        alert(errorMsg);
      }
    });
  }
}
