import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Libro {
  id?: number;
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
      const autorBusqueda = this.autorBusqueda?.trim().toLowerCase() || '';

      const matchGenero = generoSeleccionado === 'todos' || generoLibro === generoSeleccionado;
      const matchAutor = !autorBusqueda || autorLibro.includes(autorBusqueda);
      const matchDisp =
        this.disponibilidad === 'Todos' ||
        (this.disponibilidad === 'Disponible' && libro.disponible) ||
        (this.disponibilidad === 'No disponible' && !libro.disponible);

      return matchGenero && matchAutor && matchDisp;
    });
  }

  // Ver detalles de libro
  verDetalles(libro: Libro) {
    alert(`📘 ${libro.titulo}\nAutor: ${libro.autor}\nGénero: ${libro.genero}`);
  }

  // Obtener portada
  getPortada(libro: Libro): string {
    return `assets/images/${libro.id}.jpg`;
  }

  // Solicitar préstamo - CORREGIDO
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

  // ⚠️ ENVIA SOLO EL LIBRO - NO INCLUYAS ALUMNO
  const body = { 
    libro: libroId
  };

  console.log('📤 Enviando solicitud con body:', body);

  this.http.post('http://localhost:8000/solicitar-prestamo/', body, { headers })
    .subscribe({
      next: (res: any) => {
        console.log('✅ Solicitud de préstamo enviada correctamente', res);
        alert('Préstamo solicitado exitosamente');
        this.cargarLibros();
      },
      error: (err) => {
        console.error('❌ Error completo:', err);
        console.error('❌ Error details:', err.error);
        
        if (err.status === 400) {
          const errorMsg = err.error || 'Datos inválidos';
          alert(`Error: ${JSON.stringify(errorMsg)}`);
        } else if (err.status === 401) {
          alert('Error de autenticación. Inicia sesión nuevamente.');
        } else {
          alert('Error al solicitar el préstamo');
        }
      }
    });
}

}