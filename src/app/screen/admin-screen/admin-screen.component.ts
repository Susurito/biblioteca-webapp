import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

export interface PrestamoItem {
  id: number;
  alumno: number;
  alumno_nombre: string;
  alumno_matricula?: string;
  alumno_nombre_completo?: string;
  alumno_prestamos_activos?: number;
  libro: number;
  libro_titulo: string;
  libro_autor: string;
  libro_isbn?: string;
  fecha_solicitud: string;
  fecha_devolucion: string | null;
  fecha_vencimiento: string | null;
  es_vencido: boolean;
  dias_vencido: number;
  devuelto: boolean;
  estado: string;
}

@Component({
  selector: 'app-admin-screen',
  templateUrl: './admin-screen.component.html',
  styleUrls: ['./admin-screen.component.scss']
})
export class AdminScreenComponent implements OnInit {
  private apiUrl = 'http://localhost:8000';
  token: string | null = null;
  loading: boolean = false;

  // Lista de prestamos desde el backend
  todosLosPrestamos: PrestamoItem[] = [];

  // Pestana actual de la tabla: 'activos' | 'vencidos' | 'historial'
  tabActiva: 'activos' | 'vencidos' | 'historial' = 'activos';

  // Filtro de busqueda en tiempo real
  filtroTabla: string = '';

  // Mensaje de notificacion / toast
  mensajeToast: string = '';
  tipoToast: 'success' | 'danger' | 'warning' = 'success';
  mostrarToast: boolean = false;
  private toastTimer: any;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.token = localStorage.getItem('token');
    const rol = (localStorage.getItem('rol') || '').toLowerCase().trim();
    const isAdmin = rol === 'administrador' || rol === 'admin' || rol === 'administradores';

    if (!this.token) {
      this.router.navigate(['/login']);
      return;
    }

    if (!isAdmin) {
      alert('Acceso restringido. Esta pantalla es exclusiva para el Administrador.');
      this.router.navigate(['/catalogo']);
      return;
    }

    this.cargarDatos();
  }

  get headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Token ${this.token}`,
      'Content-Type': 'application/json'
    });
  }

  cargarDatos(): void {
    this.loading = true;
    this.cargarPrestamos();
  }

  cargarPrestamos(): void {
    this.http.get<any>(`${this.apiUrl}/prestamos/`, { headers: this.headers }).subscribe({
      next: (res) => {
        const data = res.results || res;
        this.todosLosPrestamos = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando prestamos:', err);
        this.loading = false;
      }
    });
  }

  // --- Devolucion de Libro (Exclusiva de Administrador) ---
  registrarDevolucion(prestamo: PrestamoItem): void {
    const nombre = prestamo.alumno_nombre_completo || prestamo.alumno_nombre;
    if (!confirm(`¿Confirmar la devolucion del libro "${prestamo.libro_titulo}" por el estudiante ${nombre}?`)) {
      return;
    }

    this.http.post<any>(`${this.apiUrl}/prestamos/${prestamo.id}/devolver/`, {}, { headers: this.headers }).subscribe({
      next: () => {
        this.lanzarToast(`Devolucion registrada exitosamente para "${prestamo.libro_titulo}".`, 'success');
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al devolver libro:', err);
        // Fallback a partial_update si el endpoint custom fallara
        this.http.patch<any>(`${this.apiUrl}/prestamos/${prestamo.id}/`, { devuelto: true }, { headers: this.headers }).subscribe({
          next: () => {
            this.lanzarToast(`Devolucion registrada exitosamente para "${prestamo.libro_titulo}".`, 'success');
            this.cargarDatos();
          },
          error: (patchErr) => {
            const msg = patchErr.error?.error || 'No se pudo registrar la devolucion.';
            this.lanzarToast(msg, 'danger');
          }
        });
      }
    });
  }

  // --- Filtros y Pestanas ---
  cambiarTab(tab: 'activos' | 'vencidos' | 'historial'): void {
    this.tabActiva = tab;
  }

  get prestamosActivosList(): PrestamoItem[] {
    return this.todosLosPrestamos.filter(p => !p.devuelto && (p.estado === 'aceptado' || p.estado === 'aprobado'));
  }

  get prestamosVencidosList(): PrestamoItem[] {
    return this.todosLosPrestamos.filter(p => !p.devuelto && p.estado === 'aceptado' && p.es_vencido);
  }

  get prestamosHistorialList(): PrestamoItem[] {
    return this.todosLosPrestamos.filter(p => p.devuelto || p.estado === 'rechazado' || p.estado === 'devuelto');
  }

  get prestamosAMostrar(): PrestamoItem[] {
    let baseList: PrestamoItem[] = [];
    if (this.tabActiva === 'activos') {
      baseList = this.prestamosActivosList;
    } else if (this.tabActiva === 'vencidos') {
      baseList = this.prestamosVencidosList;
    } else {
      baseList = this.prestamosHistorialList;
    }

    const q = this.filtroTabla.trim().toLowerCase();
    if (!q) return baseList;

    return baseList.filter(p => {
      const alumno = (p.alumno_nombre_completo || p.alumno_nombre || '').toLowerCase();
      const matricula = (p.alumno_matricula || '').toLowerCase();
      const libro = (p.libro_titulo || '').toLowerCase();
      const isbn = (p.libro_isbn || '').toLowerCase();
      return alumno.includes(q) || matricula.includes(q) || libro.includes(q) || isbn.includes(q);
    });
  }

  // Inicial del nombre para el avatar
  obtenerInicial(nombre: string | undefined): string {
    if (!nombre) return 'A';
    return nombre.trim().charAt(0).toUpperCase();
  }

  // Formato de fecha corto 'dd/MM'
  formatearFechaCorta(fechaStr: string | null | undefined): string {
    if (!fechaStr) return '-';
    try {
      const d = new Date(fechaStr);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      return `${dia}/${mes}`;
    } catch {
      return '-';
    }
  }

  lanzarToast(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success'): void {
    this.mensajeToast = mensaje;
    this.tipoToast = tipo;
    this.mostrarToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.mostrarToast = false;
    }, 4000);
  }
}
