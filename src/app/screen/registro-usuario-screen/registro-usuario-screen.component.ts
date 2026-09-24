import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registro-usuario-screen',
  templateUrl: './registro-usuario-screen.component.html',
  styleUrls: ['./registro-usuario-screen.component.scss']
})
export class RegistroUsuarioScreenComponent {

  registerForm: FormGroup;
  tiposUsuario: string[] = ['Alumno','Administrador'];
  hidePassword = true;
  hideConfirm = true;

 constructor(private fb: FormBuilder, private http: HttpClient) {
  this.registerForm = this.fb.group({
    tipo: ['', Validators.required],
    nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
    apellido_paterno: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
    apellido_materno: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
    matricula: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]], // Quitar maxLength si quieres ilimitado
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    terminos: [false, Validators.requiredTrue]
  }, { validators: this.passwordMatchValidator });
}


  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notMatching: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const url = 'http://127.0.0.1:8000/alumnos/';
      this.http.post(url, this.registerForm.value).subscribe({
        next: (res) => {
          console.log('Registro exitoso:', res);
          alert('Usuario registrado correctamente');
          this.registerForm.reset();
        },
        error: (err) => {
          console.error('Error al registrar:', err);
          alert('Error al registrar usuario');
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  get f() {
    return this.registerForm.controls;
  }

  // Permitir solo letras
soloLetras(event: KeyboardEvent) {
  const char = String.fromCharCode(event.charCode);
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(char)) {
    event.preventDefault();
  }
}

// Permitir solo números
soloNumeros(event: KeyboardEvent) {
  const char = String.fromCharCode(event.charCode);
  if (!/^[0-9]$/.test(char)) {
    event.preventDefault();
  }
}

}
