import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

interface Perfil {
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  email: string;
  matricula?: string;
  rol: string;
}

interface Prestamo {
  id: number;
  alumno: number;
  alumno_nombre: string;
  libro: number;
  libro_titulo: string;
  libro_autor: string;
  estado: string;
  fecha_solicitud: string;
  fecha_devolucion: string | null;
  devuelto: boolean;
}

@Component({
  selector: 'app-perfil-screen',
  templateUrl: './perfil-screen.component.html',
  styleUrls: ['./perfil-screen.component.scss']
})
export class PerfilScreenComponent implements OnInit {

  perfil: Perfil | null = null;
  prestamosActivos: Prestamo[] = [];
  prestamosPendientes: Prestamo[] = [];
  historialPrestamos: Prestamo[] = [];
  historialCompleto: Prestamo[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  activeTab: string = 'pendientes';
  token: string | null = null;
  
  // Propiedades para Ajustes
  perfilForm!: FormGroup;
  mostrarToastExito: boolean = false;
  isSaving: boolean = false;

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.token = localStorage.getItem('token');

    if (!this.token) {
      this.errorMessage = 'No has iniciado sesión.';
      this.isLoading = false;
      return;
    }

    this.initForm();
    this.cargarPerfil(this.token);

    // Revisar si venimos con un fragmento o query para abrir ajustes por defecto
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'ajustes') {
        this.activeTab = 'ajustes';
      }
    });
  }

  initForm() {
    this.perfilForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido_paterno: ['', [Validators.required]],
      apellido_materno: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (!password) return null; // Si no hay contraseña nueva, no validamos coincidencia
    return password === confirmPassword ? null : { notMatching: true };
  }

  cargarPerfil(token: string) {
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    this.http.get<Perfil>('http://localhost:8000/perfil/', { headers })
      .subscribe({
        next: (res) => {
          this.perfil = res;
          console.log('✅ Perfil cargado:', res);

          // Rellenar formulario
          this.perfilForm.patchValue({
            nombre: res.nombre || '',
            apellido_paterno: res.apellido_paterno || '',
            apellido_materno: res.apellido_materno || '',
            email: res.email || ''
          });
          
          
          const esAdmin = this.esAdministrador();
          
          console.log('🔍 Rol detectado:', res.rol, 'Es admin:', esAdmin);
          
          // Si NO es admin, por defecto activos (a menos que la ruta diga ajustes)
          if (!esAdmin && this.activeTab !== 'ajustes') {
            this.activeTab = 'activos';
          }
          
          // Después de cargar el perfil, cargar los préstamos
          this.cargarTodosLosPrestamos(token, esAdmin);
        },
        error: (err) => {
          console.error('❌ Error al cargar el perfil:', err);
          if (err.status === 403) {
            this.errorMessage = 'No tienes permiso para ver el perfil. Inicia sesión de nuevo.';
          } else {
            this.errorMessage = 'Ocurrió un error al cargar el perfil.';
          }
          this.isLoading = false;
        }
      });
  }

  cargarTodosLosPrestamos(token: string, esAdmin: boolean) {
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    console.log('🔍 Cargando todos los préstamos...');

    // Función para cargar todas las páginas
    const cargarTodasLasPaginas = (url: string, prestamosAcumulados: Prestamo[] = []): Promise<Prestamo[]> => {
      return new Promise((resolve, reject) => {
        this.http.get<any>(url, { headers }).subscribe({
          next: (res) => {
            console.log(`📄 Cargando página: ${url}`);
            const prestamosPagina = res.results || [];
            const todosLosPrestamos = [...prestamosAcumulados, ...prestamosPagina];
            
            if (res.next) {
              cargarTodasLasPaginas(res.next, todosLosPrestamos)
                .then(resolve)
                .catch(reject);
            } else {
              resolve(todosLosPrestamos);
            }
          },
          error: (err) => {
            reject(err);
          }
        });
      });
    };

    cargarTodasLasPaginas('http://localhost:8000/prestamos/', [])
      .then((todosLosPrestamos: Prestamo[]) => {
        console.log('✅ TODOS los préstamos cargados:', todosLosPrestamos.length);
        
        if (esAdmin) {
          console.log('👨‍💼 Configurando vista para ADMINISTRADOR');
          
          // Para administrador: cargar préstamos pendientes
          this.prestamosPendientes = todosLosPrestamos.filter((p: Prestamo) => {
            const estado = p.estado?.toLowerCase() || '';
            const esPendiente = estado.includes('pendiente') || 
                               estado.includes('solicitado') ||
                               (!p.devuelto && 
                                !estado.includes('aceptado') && 
                                !estado.includes('aprobado') && 
                                !estado.includes('rechazado'));
            
            console.log(`Préstamo ${p.id} - Estado: "${p.estado}" - Devuelto: ${p.devuelto} - Es pendiente: ${esPendiente}`);
            return esPendiente;
          });

          // Historial para admin: todos los préstamos ordenados
          this.historialPrestamos = [...todosLosPrestamos].sort((a: Prestamo, b: Prestamo) => 
            new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
          );
          
          console.log('📋 Préstamos pendientes para admin:', this.prestamosPendientes);
          console.log('📊 Historial para admin:', this.historialPrestamos.length);
          
        } else {
          console.log('👨‍🎓 Configurando vista para ALUMNO');
          
          // Para alumno: cargar préstamos activos
          this.prestamosActivos = todosLosPrestamos.filter((p: Prestamo) => {
            const estado = p.estado?.toLowerCase() || '';
            const esActivo = (estado.includes('aceptado') || estado.includes('aprobado')) && !p.devuelto;
            console.log(`Préstamo ${p.id} - Estado: "${p.estado}" - Devuelto: ${p.devuelto} - Es activo: ${esActivo}`);
            return esActivo;
          });

          // Historial para alumno: todos los préstamos ordenados
          this.historialCompleto = [...todosLosPrestamos].sort((a: Prestamo, b: Prestamo) => 
            new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
          );
          
          console.log('📚 Préstamos activos para alumno:', this.prestamosActivos);
          console.log('📖 Historial para alumno:', this.historialCompleto.length);
        }
        
        this.isLoading = false;
      })
      .catch((err) => {
        console.error('❌ Error al cargar préstamos:', err);
        this.errorMessage = 'Error al cargar los préstamos';
        this.isLoading = false;
      });
  }

  cambiarTab(tab: string) {
    this.activeTab = tab;
  }

  obtenerEstadoPrestamo(prestamo: Prestamo): string {
    const estado = prestamo.estado?.toLowerCase() || '';
    
    if (estado.includes('rechazado')) {
      return 'Rechazado';
    } else if (prestamo.devuelto) {
      return 'Devuelto';
    } else if (estado.includes('aceptado') || estado.includes('aprobado')) {
      return 'Activo';
    } else if (estado.includes('pendiente') || estado.includes('solicitado')) {
      return 'Pendiente';
    }
    return prestamo.estado || 'Desconocido';
  }

  obtenerClaseEstado(estado: string): string {
    const estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case 'activo': return 'badge bg-success';
      case 'devuelto': return 'badge bg-info';
      case 'rechazado': return 'badge bg-danger';
      case 'pendiente': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }

  devolverLibro(prestamoId: number, libroTitulo: string) {
    if (!confirm(`¿Estás seguro de que quieres devolver el libro "${libroTitulo}"?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { devuelto: true };

    this.http.patch(`http://localhost:8000/prestamos/${prestamoId}/`, body, { headers })
      .subscribe({
        next: (res: any) => {
          console.log('✅ Libro devuelto:', res);
          alert(`✅ Libro "${libroTitulo}" devuelto exitosamente`);
          this.cargarTodosLosPrestamos(token, this.esAdministrador());
        },
        error: (err) => {
          console.error('❌ Error al devolver libro:', err);
          alert('❌ Error al devolver el libro');
        }
      });
  }

  // Funciones para administrador
  revisarPrestamo(prestamo: Prestamo, accion: 'aprobar' | 'rechazar') {
    if (!this.token) {
      alert('Debes iniciar sesión como administrador.');
      return;
    }

    const accionTexto = accion === 'aprobar' ? 'aprobar' : 'rechazar';
    
    if (!confirm(`¿Estás seguro de que quieres ${accionTexto} el préstamo de "${prestamo.libro_titulo}" solicitado por ${prestamo.alumno_nombre}?`)) {
      return;
    }

    const url = `http://localhost:8000/prestamos/${prestamo.id}/revisar/`;
    const headers = new HttpHeaders({
      'Authorization': `Token ${this.token}`,
      'Content-Type': 'application/json'
    });

    const body = { accion: accion };

    console.log(`🔍 Enviando ${accion} para préstamo ${prestamo.id}`);

    this.http.post(url, body, { headers }).subscribe({
      next: (res: any) => {
        console.log('✅ Respuesta:', res);
        alert(`✅ Préstamo ${accionTexto} exitosamente`);
        this.cargarTodosLosPrestamos(this.token!, true);
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('❌ Error al procesar el préstamo');
      }
    });
  }

  // Función para verificar si es admin
  esAdministrador(): boolean {
    const rol = this.perfil?.rol?.toLowerCase() || '';
    return rol === 'administrador' || rol === 'admin' || rol === 'administradores' || rol === 'administrator';
  }

  // Guardar Ajustes
  guardarAjustes() {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    
    // Aquí simulamos la petición HTTP para guardar
    // Como el endpoint real podría ser distinto, por ahora es una simulación visual
    setTimeout(() => {
      this.isSaving = false;
      this.mostrarToastExito = true;
      
      // Actualizar el perfil visualmente
      const val = this.perfilForm.value;
      if (this.perfil) {
        this.perfil.nombre = val.nombre;
        this.perfil.apellido_paterno = val.apellido_paterno;
        this.perfil.apellido_materno = val.apellido_materno;
        this.perfil.email = val.email;
      }
      
      // Limpiar las contraseñas
      this.perfilForm.get('password')?.setValue('');
      this.perfilForm.get('confirmPassword')?.setValue('');

      // Ocultar toast después de 3 segundos
      setTimeout(() => {
        this.mostrarToastExito = false;
      }, 3000);
    }, 1000);
  }
}