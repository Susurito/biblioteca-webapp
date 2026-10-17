import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LibrosService, Libro, EstadisticasEjemplares } from '../../services/libros.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ejemplares-screen',
  templateUrl: './ejemplares-screen.component.html',
  styleUrls: ['./ejemplares-screen.component.scss']
})
export class EjemplaresScreenComponent implements OnInit {

  // Listas
  libros: Libro[] = [];
  librosFiltrados: Libro[] = [];
  librosPaginados: Libro[] = [];
  categorias: string[] = [];

  // Filtros activos
  tabActiva: 'activos' | 'sin_stock' | 'dados_de_baja' = 'activos';
  busqueda: string = '';
  categoriaSeleccionada: string = 'Todas';

  // Estadísticas para las pestañas
  estadisticas: EstadisticasEjemplares = {
    activos: 0,
    sin_stock: 0,
    dados_de_baja: 0,
    total: 0
  };

  // Paginación
  paginaActual: number = 1;
  elementosPorPagina: number = 5;
  totalPaginas: number = 1;

  // Estados de carga
  cargando: boolean = true;
  guardandoEdicion: boolean = false;
  procesandoAccion: boolean = false;

  // Modal de edición
  modalEditarAbierto: boolean = false;
  libroEnEdicion: Libro | null = null;
  formEdicion: FormGroup;

  // Modal de confirmación (baja / reactivación)
  modalConfirmacionAbierto: boolean = false;
  libroAccion: Libro | null = null;
  tipoAccion: 'baja' | 'alta' = 'baja';

  // Mensaje de notificación / toast
  notificacion: { mensaje: string; tipo: 'success' | 'danger' | 'info' } | null = null;
  private notifTimeout: any;

  constructor(
    private librosService: LibrosService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.formEdicion = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      autor: ['', [Validators.required, Validators.maxLength(150)]],
      genero: ['', [Validators.required, Validators.maxLength(100)]],
      isbn: ['', [Validators.maxLength(30)]],
      total_ejemplares: [1, [Validators.required, Validators.min(1)]],
      disponible: [true],
      detalles: ['']
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/catalogo']);
      return;
    }
    this.cargarDatos();
  }

  // Cargar libros y estadísticas desde el backend
  cargarDatos(): void {
    this.cargando = true;
    this.librosService.getLibros().subscribe({
      next: (res) => {
        const data: Libro[] = res.results || (Array.isArray(res) ? res : []);
        this.libros = data;

        // Extraer categorías únicas
        const cats = Array.from(new Set(this.libros.map(l => l.genero).filter(Boolean)));
        this.categorias = ['Todas', ...cats];

        this.actualizarEstadisticas();
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar libros:', err);
        this.mostrarNotificacion('Error al cargar ejemplares desde el servidor.', 'danger');
        this.cargando = false;
      }
    });

    // También consultar estadísticas agregadas
    this.librosService.getEjemplaresEstadisticas().subscribe({
      next: (stats) => {
        if (stats) {
          this.estadisticas = stats;
        }
      },
      error: () => {
        // Se calculan localmente si falla
      }
    });
  }

  // Calcular estadísticas localmente
  actualizarEstadisticas(): void {
    let activos = 0;
    let sinStock = 0;
    let dadosDeBaja = 0;

    this.libros.forEach(l => {
      if (l.baja) {
        dadosDeBaja++;
      } else {
        const disponibles = l.disponibles !== undefined
          ? l.disponibles
          : (l.disponible ? (l.total_ejemplares || 1) : 0);
        
        if (disponibles <= 0 || !l.disponible) {
          sinStock++;
        } else {
          activos++;
        }
      }
    });

    this.estadisticas = {
      activos,
      sin_stock: sinStock,
      dados_de_baja: dadosDeBaja,
      total: this.libros.length
    };
  }

  // Cambiar pestaña activa
  cambiarTab(tab: 'activos' | 'sin_stock' | 'dados_de_baja'): void {
    this.tabActiva = tab;
    this.paginaActual = 1;
    this.aplicarFiltros();
  }

  // Normalizar cadenas para búsqueda sin acentos
  private normalizar(texto: string | undefined | null): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Aplicar filtros de pestaña, búsqueda y categoría
  aplicarFiltros(): void {
    const q = this.normalizar(this.busqueda);
    const cat = this.categoriaSeleccionada;

    let lista = this.libros.filter(l => {
      // Filtro por pestaña
      if (this.tabActiva === 'dados_de_baja') {
        if (!l.baja) return false;
      } else if (this.tabActiva === 'sin_stock') {
        if (l.baja) return false;
        const disp = l.disponibles !== undefined ? l.disponibles : (l.disponible ? 1 : 0);
        if (disp > 0 && l.disponible) return false;
      } else {
        // 'activos'
        if (l.baja) return false;
        const disp = l.disponibles !== undefined ? l.disponibles : (l.disponible ? 1 : 0);
        if (disp <= 0 || !l.disponible) return false;
      }

      // Filtro por categoría
      if (cat !== 'Todas' && l.genero !== cat) {
        return false;
      }

      // Filtro por texto de búsqueda (ISBN, título, autor)
      if (q) {
        const titulo = this.normalizar(l.titulo);
        const autor = this.normalizar(l.autor);
        const isbn = this.normalizar(l.isbn);
        const match = titulo.includes(q) || autor.includes(q) || isbn.includes(q);
        if (!match) return false;
      }

      return true;
    });

    this.librosFiltrados = lista;
    this.totalPaginas = Math.max(1, Math.ceil(this.librosFiltrados.length / this.elementosPorPagina));
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
    this.actualizarPaginacion();
  }

  // Actualizar rebanada visible para paginación
  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    this.librosPaginados = this.librosFiltrados.slice(inicio, fin);
  }

  // Navegar entre páginas
  irAPagina(pag: number): void {
    if (pag >= 1 && pag <= this.totalPaginas) {
      this.paginaActual = pag;
      this.actualizarPaginacion();
    }
  }

  get paginasArray(): number[] {
    const pags: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      pags.push(i);
    }
    return pags;
  }

  // Determinar estado visual del ejemplar
  obtenerEstado(libro: Libro): 'Disponible' | 'Sin stock' | 'Dado de baja' {
    if (libro.baja) {
      return 'Dado de baja';
    }
    const disp = libro.disponibles !== undefined
      ? libro.disponibles
      : (libro.disponible ? (libro.total_ejemplares || 1) : 0);

    if (disp <= 0 || !libro.disponible) {
      return 'Sin stock';
    }
    return 'Disponible';
  }

  // Abrir modal de edición
  abrirEditar(libro: Libro): void {
    this.libroEnEdicion = libro;
    this.formEdicion.patchValue({
      titulo: libro.titulo,
      autor: libro.autor,
      genero: libro.genero,
      isbn: libro.isbn || '',
      total_ejemplares: libro.total_ejemplares || 1,
      disponible: libro.disponible !== false,
      detalles: libro.detalles || ''
    });
    this.modalEditarAbierto = true;
  }

  cerrarEditar(): void {
    this.modalEditarAbierto = false;
    this.libroEnEdicion = null;
    this.formEdicion.reset();
  }

  // Guardar cambios de edición
  guardarEdicion(): void {
    if (this.formEdicion.invalid || !this.libroEnEdicion?.id) {
      this.formEdicion.markAllAsTouched();
      return;
    }

    const val = this.formEdicion.value;
    const datosActualizados: Partial<Libro> = {
      titulo: val.titulo.trim(),
      autor: val.autor.trim(),
      genero: val.genero.trim(),
      isbn: val.isbn ? val.isbn.trim() : null,
      total_ejemplares: Number(val.total_ejemplares),
      disponible: Boolean(val.disponible),
      detalles: val.detalles ? val.detalles.trim() : ''
    };

    this.guardandoEdicion = true;
    this.librosService.actualizarLibro(this.libroEnEdicion.id, datosActualizados).subscribe({
      next: (res) => {
        this.guardandoEdicion = false;
        this.mostrarNotificacion(`Ejemplar "${res.titulo || datosActualizados.titulo}" actualizado exitosamente.`, 'success');
        this.cerrarEditar();
        this.cargarDatos();
      },
      error: (err) => {
        this.guardandoEdicion = false;
        console.error('Error al actualizar ejemplar:', err);
        const errorMsg = err.error?.error || err.error?.detalles?.isbn?.[0] || 'Error al guardar los cambios.';
        this.mostrarNotificacion(errorMsg, 'danger');
      }
    });
  }

  // Abrir confirmación de dar de baja o dar de alta
  confirmarAccion(libro: Libro, tipo: 'baja' | 'alta'): void {
    this.libroAccion = libro;
    this.tipoAccion = tipo;
    this.modalConfirmacionAbierto = true;
  }

  cerrarConfirmacion(): void {
    this.modalConfirmacionAbierto = false;
    this.libroAccion = null;
  }

  ejecutarAccion(): void {
    if (!this.libroAccion?.id) return;

    this.procesandoAccion = true;
    const obs$ = this.tipoAccion === 'baja'
      ? this.librosService.darDeBaja(this.libroAccion.id)
      : this.librosService.darDeAlta(this.libroAccion.id);

    obs$.subscribe({
      next: (res) => {
        this.procesandoAccion = false;
        const msg = this.tipoAccion === 'baja'
          ? `El ejemplar "${this.libroAccion?.titulo}" ha sido dado de baja.`
          : `El ejemplar "${this.libroAccion?.titulo}" ha sido reactivado exitosamente.`;
        this.mostrarNotificacion(msg, 'success');
        this.cerrarConfirmacion();
        this.cargarDatos();
      },
      error: (err) => {
        this.procesandoAccion = false;
        console.error('Error al procesar acción sobre ejemplar:', err);
        const errorMsg = err.error?.error || 'Error al procesar la acción.';
        this.mostrarNotificacion(errorMsg, 'danger');
      }
    });
  }

  // Mostrar mensaje tipo toast
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'danger' | 'info' = 'info'): void {
    this.notificacion = { mensaje, tipo };
    if (this.notifTimeout) clearTimeout(this.notifTimeout);
    this.notifTimeout = setTimeout(() => {
      this.notificacion = null;
    }, 4000);
  }
}
