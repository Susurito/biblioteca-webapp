import { PORTADAS } from './portadas.catalogo';

interface LibroConPortada {
  titulo: string;
  autor: string;
  isbn?: string | null;
}

export const PORTADA_NO_DISPONIBLE = 'assets/images/portada-no-disponible.svg';

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Los IDs pertenecen a la base de datos, no identifican una edición bibliográfica.
export function obtenerPortada(libro: LibroConPortada): string {
  const portada = PORTADAS.find(item =>
    normalizar(item.titulo) === normalizar(libro.titulo) &&
    normalizar(item.autor) === normalizar(libro.autor));
  if (portada) {
    return `https://covers.openlibrary.org/b/id/${portada.coverId}-L.jpg?default=false`;
  }
  const isbn = (libro.isbn || '').replace(/[\s-]/g, '');
  return /^(?:\d{13}|\d{9}[\dXx])$/.test(isbn)
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
    : PORTADA_NO_DISPONIBLE;
}

export function mostrarPortadaNoDisponible(event: Event): void {
  const imagen = event.target as HTMLImageElement;
  if (imagen.getAttribute('src') !== PORTADA_NO_DISPONIBLE) {
    imagen.src = PORTADA_NO_DISPONIBLE;
  }
}
