import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  selector: 'app-admin-screen',
  templateUrl: './admin-screen.component.html',
  styleUrls: ['./admin-screen.component.scss']
})
export class AdminScreenComponent implements OnInit {
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  searchTerm: string = '';

  prestamosPendientes: Prestamo[] = [];
  historialPrestamos: Prestamo[] = [];
  token: string | null = null;
  loading: boolean = false;
  activeTab: string = 'pendientes';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.checkLogin();
    if (this.isLoggedIn && this.isAdmin) {
      this.cargarTodosLosPrestamos();
    }
  }

  checkLogin() {
    this.token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    if (this.token) {
      this.isLoggedIn = true;
      this.isAdmin = rol === 'administrador' || 
                     rol === 'admin' || 
                     rol === 'administradores' ||
                     rol === 'administrator';
    }
  }

  cargarTodosLosPrestamos() {
    if (!this.token) {
      console.error('❌ No hay token');
      return;
    }

    this.loading = true;
    const headers = new HttpHeaders({
      'Authorization': `Token ${this.token}`
    });

    this.cargarPrestamosPagina('http://localhost:8000/prestamos/', headers, [])
      .then((todosLosPrestamos: Prestamo[]) => {
        this.procesarPrestamos(todosLosPrestamos);
        this.loading = false;
      })
      .catch((error) => {
        console.error('❌ Error cargando préstamos:', error);
        this.loading = false;
      });
  }

  cargarPrestamosPagina(url: string, headers: HttpHeaders, prestamosAcumulados: Prestamo[]): Promise<Prestamo[]> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(url, { headers }).subscribe({
        next: (res) => {
          const prestamosPagina = res.results || [];
          const todosLosPrestamos = [...prestamosAcumulados, ...prestamosPagina];
          
          if (res.next) {
            this.cargarPrestamosPagina(res.next, headers, todosLosPrestamos)
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
  }

  procesarPrestamos(todosLosPrestamos: Prestamo[]) {
    this.prestamosPendientes = todosLosPrestamos.filter((p: Prestamo) => {
      const estado = p.estado?.toLowerCase() || '';
      const esPendiente = estado === 'pendiente' || 
                         estado === 'solicitado' ||
                         estado === 'pendiente de revisión' ||
                         (!p.devuelto && 
                          !estado.includes('aceptado') && 
                          !estado.includes('aprobado') && 
                          !estado.includes('rechazado') &&
                          !estado.includes('cancelado'));
      return esPendiente;
    });

    this.prestamosPendientes.sort((a: Prestamo, b: Prestamo) => 
      new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
    );
    
    this.historialPrestamos = todosLosPrestamos.filter((p: Prestamo) => {
      const estado = p.estado?.toLowerCase() || '';
      return !(estado === 'pendiente' || 
               estado === 'solicitado' || 
               estado === 'pendiente de revisión');
    }).sort((a: Prestamo, b: Prestamo) => 
      new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
    );
    
    if (this.prestamosPendientes.length > 0) {
      this.activeTab = 'pendientes';
    }
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
    } else if (estado.includes('devuelto')) {
      return 'Devuelto';
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

    this.http.post(url, body, { headers }).subscribe({
      next: (res: any) => {
        alert(`✅ Préstamo ${accionTexto} exitosamente`);
        this.cargarTodosLosPrestamos();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('❌ Error al procesar el préstamo');
      }
    });
  }

  onSearch() {
    console.log('Buscando:', this.searchTerm);
  }
}