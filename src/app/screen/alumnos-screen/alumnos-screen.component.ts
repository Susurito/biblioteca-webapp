import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LibrosService, Libro } from '../../services/libros.service';
import { Subscription } from 'rxjs';

export interface LibroPrestadoItem {
  id?: number;
  titulo: string;
  autor?: string;
  fechaDevolucion: string;
  progreso: number;
  estado: string;
  barClass: string;
}

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

  librosPrestados: LibroPrestadoItem[] = [];
  cargandoPrestamos: boolean = true;

  // Lista dinamica de libros recomendados traidos de la base de datos
  recomendaciones: Libro[] = [];
  cargandoRecomendaciones: boolean = true;
  solicitandoLibroId: number | null = null;

  constructor(
    private authService: AuthService,
    private librosService: LibrosService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.authSub = this.authService.usuario$.subscribe(u => {
      if (u) {
        this.usuario = u;
      }
    });

    this.cargarPrestamosActivos();
    this.cargarRecomendaciones();
  }

  cargarRecomendaciones() {
    this.cargandoRecomendaciones = true;
    this.librosService.getLibrosRecomendados().subscribe({
      next: (res) => {
        const data = res.results || (Array.isArray(res) ? res : []);
        this.recomendaciones = data;
        this.cargandoRecomendaciones = false;
      },
      error: (err) => {
        console.error('Error al cargar libros recomendados:', err);
        // Fallback a getLibros si fuera necesario
        this.librosService.getLibros().subscribe({
          next: (res) => {
            const data = res.results || (Array.isArray(res) ? res : []);
            this.recomendaciones = data.slice(0, 6);
            this.cargandoRecomendaciones = false;
          },
          error: () => {
            this.recomendaciones = [];
            this.cargandoRecomendaciones = false;
          }
        });
      }
    });
  }

  solicitarPrestamo(libro: Libro) {
    if (!libro.id) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para solicitar un préstamo.');
      this.router.navigate(['/login']);
      return;
    }

    if (!confirm(`¿Confirmas la solicitud de préstamo para "${libro.titulo}"?`)) {
      return;
    }

    this.solicitandoLibroId = libro.id;
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post<any>('http://127.0.0.1:8000/solicitar-prestamo/', { libro: libro.id }, { headers }).subscribe({
      next: () => {
        this.solicitandoLibroId = null;
        alert(`¡Préstamo de "${libro.titulo}" solicitado exitosamente!`);
        this.cargarPrestamosActivos();
        this.cargarRecomendaciones();
      },
      error: (err) => {
        this.solicitandoLibroId = null;
        console.error('Error al solicitar préstamo:', err);
        const msg = err.error?.error || err.error?.detail || 'No se pudo realizar la solicitud de préstamo.';
        alert(msg);
      }
    });
  }

  cargarPrestamosActivos() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.cargandoPrestamos = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    this.cargandoPrestamos = true;
    this.http.get<any>('http://127.0.0.1:8000/prestamos/', { headers }).subscribe({
      next: (res) => {
        const prestamos: any[] = res.results || (Array.isArray(res) ? res : []);
        
        // Filtrar prestamos no devueltos (activos o pendientes)
        const noDevueltos = prestamos.filter(p => !p.devuelto && p.estado !== 'rechazado');

        this.librosPrestados = noDevueltos.map(p => {
          const estado = (p.estado || '').toLowerCase();
          let fechaTexto = 'Por autorizar';
          let progreso = 25;
          let barClass = 'bg-warning';

          if (estado === 'aceptado' || estado === 'aprobado') {
            if (p.fecha_vencimiento) {
              const fVenc = new Date(p.fecha_vencimiento);
              fechaTexto = fVenc.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
              
              const hoy = new Date().getTime();
              const fSol = p.fecha_solicitud ? new Date(p.fecha_solicitud).getTime() : hoy;
              const fVencTime = fVenc.getTime();
              const totalTiempo = fVencTime - fSol;
              const tiempoTranscurrido = hoy - fSol;
              
              if (totalTiempo > 0) {
                progreso = Math.min(100, Math.max(10, Math.round((tiempoTranscurrido / totalTiempo) * 100)));
              } else {
                progreso = 75;
              }
            } else {
              fechaTexto = 'En curso';
              progreso = 50;
            }

            if (p.es_vencido) {
              barClass = 'bg-danger';
            } else {
              barClass = 'bg-success';
            }
          } else if (estado === 'pendiente') {
            fechaTexto = 'Solicitud en revisión';
            progreso = 30;
            barClass = 'bg-info';
          }

          return {
            id: p.id,
            titulo: p.libro_titulo || 'Libro sin título',
            autor: p.libro_autor || '',
            fechaDevolucion: fechaTexto,
            progreso: progreso,
            estado: p.estado || 'pendiente',
            barClass: barClass
          };
        });

        this.cargandoPrestamos = false;
      },
      error: (err) => {
        console.error('Error al cargar préstamos del alumno:', err);
        this.cargandoPrestamos = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
  }
}
