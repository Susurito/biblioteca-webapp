import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
export class CatalogoScreenComponent implements OnInit {

  libros: Libro[] = [];
  librosFiltrados: Libro[] = [];
  generos: string[] = [];

  // Filtros
  autorBusqueda: string = '';
  selectedGenero: string = 'Todos';
  disponibilidad: string = 'Todos';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarLibros();
  }

  // Cargar libros desde backend
  cargarLibros() {
    this.http.get<any>('http://localhost:8000/libros/').subscribe({
      next: res => {
        this.libros = res.results || res;
        this.librosFiltrados = this.libros;
        this.generos = Array.from(new Set(this.libros.map(libro => libro.genero)));
      },
      error: err => console.error('Error al cargar libros:', err)
    });
  }

  // Aplicar filtros
  aplicarFiltro() {
    this.librosFiltrados = this.libros.filter(libro => {
      const generoLibro = libro.genero?.trim().toLowerCase() || '';
      const generoSeleccionado = this.selectedGenero?.trim().toLowerCase() || '';
      const autorLibro = libro.autor?.trim().toLowerCase() || '';
      const tituloLibro = libro.titulo?.trim().toLowerCase() || '';
      const isbnLibro = libro.isbn?.trim().toLowerCase() || '';
      const busqueda = this.autorBusqueda?.trim().toLowerCase() || '';

      const matchGenero = generoSeleccionado === 'todos' || generoLibro === generoSeleccionado;
      const matchBusqueda = !busqueda ||
        autorLibro.includes(busqueda) ||
        tituloLibro.includes(busqueda) ||
        isbnLibro.includes(busqueda);
      const matchDisp =
        this.disponibilidad === 'Todos' ||
        (this.disponibilidad === 'Disponible' && libro.disponible) ||
        (this.disponibilidad === 'No disponible' && !libro.disponible);

      return matchGenero && matchBusqueda && matchDisp;
    });
  }

  // Ver detalles de libro
  verDetalles(libro: Libro) {
    const isbnTxt = libro.isbn ? `\nISBN: ${libro.isbn}` : '';
    alert(`📖 ${libro.titulo}${isbnTxt}\nAutor: ${libro.autor}\nGénero: ${libro.genero}\nDetalles: ${libro.detalles || 'Sin descripción adicional'}`);
  }

  // Obtener portada
  getPortada(libro: Libro): string {
    return `assets/images/${libro.id}.jpg`;
  }

  // Solicitar préstamo
  solicitarPrestamo(libroId: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No se encontró token, inicia sesión primero.');
      alert('Debes iniciar sesión para solicitar un préstamo');
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

    console.log('Enviando solicitud con body:', body);

    this.http.post('http://localhost:8000/solicitar-prestamo/', body, { headers })
      .subscribe({
        next: (res: any) => {
          console.log('Solicitud de préstamo enviada correctamente', res);
          alert('Préstamo solicitado exitosamente. Tu solicitud está en revisión.');
          this.cargarLibros();
        },
        error: (err) => {
          console.error('Error al solicitar préstamo:', err);
          if (err.status === 400) {
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
          } else if (err.status === 401) {
            alert('Error de autenticación. Inicia sesión nuevamente.');
          } else {
            alert('Error al solicitar el préstamo');
          }
        }
      });
  }

}
