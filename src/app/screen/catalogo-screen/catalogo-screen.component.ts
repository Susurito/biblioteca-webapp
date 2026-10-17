import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SearchService } from '../../services/search.service';

interface Libro {
  id?: number;
  isbn?: string;
  titulo: string;
  autor: string;
  genero: string;
  detalles?: string;
  disponible: boolean;
}

@Component({
  selector: 'app-catalogo-screen',
  templateUrl: './catalogo-screen.component.html',
  styleUrls: ['./catalogo-screen.component.scss']
})
export class CatalogoScreenComponent implements OnInit, OnDestroy {

  libros: Libro[] = [];
  librosFiltrados: Libro[] = [];
  generos: string[] = [];

  // Filtros
  queryBusqueda: string = '';
  autorBusqueda: string = '';
  selectedGenero: string = 'Todos';
  disponibilidad: string = 'Todos';

  // Modal de autenticación requerida
  mostrarAuthModal: boolean = false;
  libroParaModal: Libro | null = null;

  // Modal de detalles de libro
  mostrarDetalleModal: boolean = false;
  libroSeleccionado: Libro | null = null;

  // Modal de confirmación de préstamo exitoso
  mostrarPrestamoModal: boolean = false;
  libroPrestadoExitoso: Libro | null = null;

  // Filtros en vista móvil
  isFilterOpenMobile: boolean = false;

  private routeSub!: Subscription;
  private searchSub!: Subscription;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService
  ) { }

  ngOnInit(): void {
    this.cargarLibros();

    // Escuchar cambios en tiempo real al teclear en el navbar
    this.searchSub = this.searchService.searchQuery$.subscribe(query => {
      this.queryBusqueda = query;
      this.aplicarFiltro();
    });

    // Si se accede con parámetro de URL directo ?q=
    this.routeSub = this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      if (q !== this.searchService.getQuery()) {
        this.searchService.setQuery(q);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  toggleFiltrosMobile(): void {
    this.isFilterOpenMobile = !this.isFilterOpenMobile;
  }

  // Cargar libros desde backend
  cargarLibros() {
    this.http.get<any>('http://localhost:8000/libros/').subscribe({
      next: res => {
        this.libros = res.results || res;
        this.generos = Array.from(new Set(this.libros.map(libro => libro.genero).filter(Boolean)));
        this.aplicarFiltro();
      },
      error: err => console.error('Error al cargar libros:', err)
    });
  }

  // Normalizar cadenas eliminando tildes y mayúsculas
  private normalize(text: string | undefined | null): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Aplicar filtros
  aplicarFiltro() {
    const generoSeleccionado = this.normalize(this.selectedGenero);
    const autorFiltro = this.normalize(this.autorBusqueda);
    const query = this.normalize(this.queryBusqueda);

    this.librosFiltrados = this.libros.filter(libro => {
      const generoLibro = this.normalize(libro.genero);
      const autorLibro = this.normalize(libro.autor);
      const tituloLibro = this.normalize(libro.titulo);
      const isbnLibro = this.normalize(libro.isbn);
      const detallesLibro = this.normalize(libro.detalles);

      const matchGenero = generoSeleccionado === 'todos' || generoLibro === generoSeleccionado;
      const matchAutor = !autorFiltro ||
        autorLibro.includes(autorFiltro) ||
        tituloLibro.includes(autorFiltro) ||
        isbnLibro.includes(autorFiltro);
      const matchDisp =
        this.disponibilidad === 'Todos' ||
        (this.disponibilidad === 'Disponible' && libro.disponible) ||
        (this.disponibilidad === 'No disponible' && !libro.disponible);

      const matchQuery = !query ||
        tituloLibro.includes(query) ||
        autorLibro.includes(query) ||
        generoLibro.includes(query) ||
        isbnLibro.includes(query) ||
        detallesLibro.includes(query);

      return matchGenero && matchAutor && matchDisp && matchQuery;
    });
  }

  // Limpiar todos los filtros (incluyendo la búsqueda general del navbar)
  limpiarFiltros(): void {
    this.selectedGenero = 'Todos';
    this.autorBusqueda = '';
    this.disponibilidad = 'Todos';
    this.queryBusqueda = '';
    this.searchService.clearQuery();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
    this.aplicarFiltro();
  }

  // Quitar únicamente la búsqueda general
  limpiarBusquedaGeneral(): void {
    this.queryBusqueda = '';
    this.searchService.clearQuery();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
    this.aplicarFiltro();
  }

  // Ver detalles de libro
  verDetalles(libro: Libro) {
    this.libroSeleccionado = libro;
    this.mostrarDetalleModal = true;
  }

  // Solicitar préstamo desde el modal de detalles
  solicitarPrestamoDesdeModal(libro: any) {
    this.mostrarDetalleModal = false;
    this.solicitarPrestamo(libro as Libro);
  }

  // Obtener portada
  getPortada(libro: Libro): string {
    return `assets/images/${libro.id}.jpg`;
  }

  // Solicitar préstamo con verificación de sesión y modal
  solicitarPrestamo(libro: Libro | number) {
    const libroId = typeof libro === 'number' ? libro : libro.id;
    const libroObj: Libro = typeof libro === 'number'
      ? (this.libros.find(l => l.id === libro) || { id: libro, titulo: 'Libro', autor: '', genero: '', disponible: true })
      : libro;

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Usuario no autenticado: abriendo modal de autenticación requerida.');
      this.libroParaModal = libroObj;
      this.mostrarAuthModal = true;
      return;
    }

    if (!libroId) {
      console.warn('El libro no tiene un ID válido');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });

    const body: any = {
      libro: libroId
    };

    const alumnoId = localStorage.getItem('alumno_id');
    if (alumnoId) {
      body.alumno = Number(alumnoId);
    }

    console.log('📤 Enviando solicitud con body:', body);

    this.http.post('http://localhost:8000/solicitar-prestamo/', body, { headers })
      .subscribe({
        next: (res: any) => {
          console.log('✅ Solicitud de préstamo enviada correctamente', res);
          this.libroPrestadoExitoso = libroObj;
          this.mostrarPrestamoModal = true;
          this.cargarLibros();
        },
        error: (err) => {
          console.error('❌ Error al solicitar préstamo:', err);

          if (err.status === 401) {
            this.libroParaModal = libroObj;
            this.mostrarAuthModal = true;
          } else if (err.status === 400) {
            let errorMsg = 'Datos inválidos';
            if (err.error?.error) {
              errorMsg = err.error.error;
            } else if (err.error?.detail) {
              errorMsg = err.error.detail;
            } else if (typeof err.error === 'string') {
              errorMsg = err.error;
            } else if (typeof err.error === 'object') {
              const valores = Object.values(err.error).flat();
              errorMsg = valores.join(' ');
            }
            alert(`Aviso: ${errorMsg}`);
          } else {
            alert('Error al solicitar el préstamo');
          }
        }
      });
  }
}
