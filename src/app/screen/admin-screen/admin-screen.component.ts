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

export interface DetallesDevolucion {
  id?: number;
  alumno_nombre: string;
  alumno_nombre_completo: string;
  libro_titulo: string;
  libro_autor?: string;
  fecha_vencimiento: string;
  fecha_devolucion: string;
  dias_retraso: number;
  multa: string;
  bloqueo: string;
  mensaje_sancion?: string;
  stock_disponibles: number;
  stock_total: number;
  stock_mensaje: string;
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

  // Pestaña actual de la tabla: 'por_aprobar' | 'activos' | 'vencidos' | 'historial'
  tabActiva: 'por_aprobar' | 'activos' | 'vencidos' | 'historial' = 'por_aprobar';

  // ID del préstamo actualmente en procesamiento (para spinners)
  procesandoId: number | null = null;

  // --- Modal Devolución Registrada ---
  modalDevolucionRegistradaAbierto: boolean = false;
  detallesDevolucionActual: DetallesDevolucion | null = null;

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

  // --- Devolución de Libro: Abre directamente la pantalla de confirmación con la tabla ---
  registrarDevolucion(prestamo: PrestamoItem): void {
    this.procesandoId = prestamo.id;

    this.http.post<any>(`${this.apiUrl}/prestamos/${prestamo.id}/devolver/`, {}, { headers: this.headers }).subscribe({
      next: (res) => {
        this.procesandoId = null;

        if (res?.detalles_devolucion) {
          this.detallesDevolucionActual = res.detalles_devolucion;
        } else {
          // Fallback con cálculos locales precisos
          const fDev = new Date();
          const fVenc = prestamo.fecha_vencimiento ? new Date(prestamo.fecha_vencimiento) : fDev;
          const diffMs = fDev.getTime() - fVenc.getTime();
          const diasRetraso = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
          const multaNum = diasRetraso * 5;
          const fBloqueo = new Date(fDev);
          fBloqueo.setDate(fBloqueo.getDate() + 15);

          const pad = (n: number) => String(n).padStart(2, '0');
          const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

          let multaTexto = '$0';
          let bloqueoTexto = '------';
          let mensajeSancion = 'Devolución a tiempo, sin sanción';

          if (diasRetraso > 7) {
            multaTexto = `$${multaNum.toFixed(2)} MXN`;
            bloqueoTexto = `Hasta el ${fmt(fBloqueo)}`;
            mensajeSancion = `Multa de ${multaTexto} + Bloqueo de 15 días (RN-04)`;
          } else if (diasRetraso >= 1) {
            multaTexto = `$${multaNum.toFixed(2)} MXN`;
            bloqueoTexto = '------';
            mensajeSancion = `Multa de ${multaTexto} (RN-03). Sin bloqueo.`;
          }

          this.detallesDevolucionActual = {
            id: prestamo.id,
            alumno_nombre: prestamo.alumno_nombre,
            alumno_nombre_completo: prestamo.alumno_nombre_completo || prestamo.alumno_nombre,
            libro_titulo: prestamo.libro_titulo,
            libro_autor: prestamo.libro_autor,
            fecha_vencimiento: fmt(fVenc),
            fecha_devolucion: fmt(fDev),
            dias_retraso: diasRetraso,
            multa: multaTexto,
            bloqueo: bloqueoTexto,
            mensaje_sancion: mensajeSancion,
            stock_disponibles: 1,
            stock_total: 2,
            stock_mensaje: 'Stock actualizado: 1 de 2 disponibles.'
          };
        }

        // Abrir la pantalla modal "Devolución registrada" (mockup propuesto)
        this.modalDevolucionRegistradaAbierto = true;
        this.cargarPrestamos();
      },
      error: (err) => {
        this.procesandoId = null;
        console.error('Error al registrar devolución:', err);
        const msg = err.error?.error || err.error?.detail || 'No se pudo registrar la devolución.';
        this.lanzarToast(msg, 'danger');
      }
    });
  }

  cerrarModalDevolucionRegistrada(): void {
    this.modalDevolucionRegistradaAbierto = false;
    this.detallesDevolucionActual = null;
  }

  // --- Filtros y Pestañas ---
  cambiarTab(tab: 'por_aprobar' | 'activos' | 'vencidos' | 'historial'): void {
    this.tabActiva = tab;
  }

  get prestamosPorAprobarList(): PrestamoItem[] {
    return this.todosLosPrestamos.filter(p => !p.devuelto && p.estado === 'pendiente');
  }

  get prestamosActivosList(): PrestamoItem[] {
    return this.todosLosPrestamos.filter(p => !p.devuelto && (p.estado === 'aceptado' || p.estado === 'aprobado'));
  }

  get prestamosVencidosList(): PrestamoItem[] {
    return this.todosLosPrestamos.filter(p => !p.devuelto && (p.estado === 'aceptado' || p.estado === 'aprobado') && p.es_vencido);
  }

  get prestamosHistorialList(): PrestamoItem[] {
    return this.todosLosPrestamos.filter(p => p.devuelto || p.estado === 'rechazado' || p.estado === 'devuelto');
  }

  get prestamosAMostrar(): PrestamoItem[] {
    let baseList: PrestamoItem[] = [];
    if (this.tabActiva === 'por_aprobar') {
      baseList = this.prestamosPorAprobarList;
    } else if (this.tabActiva === 'activos') {
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

  // --- Aprobar Solicitud de Préstamo ---
  aprobarPrestamo(prestamo: PrestamoItem): void {
    const nombre = prestamo.alumno_nombre_completo || prestamo.alumno_nombre;
    if (!confirm(`¿Confirmar la aprobación del préstamo del libro "${prestamo.libro_titulo}" para el estudiante ${nombre}?`)) {
      return;
    }

    this.procesandoId = prestamo.id;
    this.http.post<any>(`${this.apiUrl}/prestamos/${prestamo.id}/aprobar/`, {}, { headers: this.headers }).subscribe({
      next: (res) => {
        this.procesandoId = null;
        this.lanzarToast(res?.message || `Préstamo #${prestamo.id} aprobado exitosamente.`, 'success');
        this.cargarPrestamos();
      },
      error: (err) => {
        this.procesandoId = null;
        console.error('Error al aprobar préstamo:', err);
        const msg = err.error?.error || err.error?.detail || 'No se pudo aprobar el préstamo.';
        this.lanzarToast(msg, 'danger');
      }
    });
  }

  // --- Rechazar Solicitud de Préstamo ---
  rechazarPrestamo(prestamo: PrestamoItem): void {
    const nombre = prestamo.alumno_nombre_completo || prestamo.alumno_nombre;
    if (!confirm(`¿Confirmar el rechazo de la solicitud del libro "${prestamo.libro_titulo}" para el estudiante ${nombre}?`)) {
      return;
    }

    this.procesandoId = prestamo.id;
    this.http.post<any>(`${this.apiUrl}/prestamos/${prestamo.id}/rechazar/`, {}, { headers: this.headers }).subscribe({
      next: (res) => {
        this.procesandoId = null;
        this.lanzarToast(res?.message || `Solicitud del préstamo #${prestamo.id} rechazada.`, 'warning');
        this.cargarPrestamos();
      },
      error: (err) => {
        this.procesandoId = null;
        console.error('Error al rechazar préstamo:', err);
        const msg = err.error?.error || err.error?.detail || 'No se pudo rechazar el préstamo.';
        this.lanzarToast(msg, 'danger');
      }
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
