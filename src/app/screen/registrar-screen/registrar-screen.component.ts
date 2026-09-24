import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registro-screen',
  templateUrl: './registrar-screen.component.html',
  styleUrls: ['./registrar-screen.component.scss']
})
export class RegistroScreenComponent {
  libroForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.libroForm = this.fb.group({
      titulo: ['', Validators.required],
      autor: ['', Validators.required],
      genero: ['', Validators.required],
      detalles: [''],
      disponible: [true]
    });
  }

  registrarLibro() {
    if (this.libroForm.invalid) return;

    this.http.post('http://localhost:8000/libros/', this.libroForm.value)
      .subscribe({
        next: (res) => {
          console.log('Libro guardado en BD:', res);
          alert('Libro registrado correctamente');
          this.libroForm.reset();
        },
        error: (err) => {
          console.error('Error al registrar libro:', err);
          alert('Error al registrar libro');
        }
      });
  }
}
