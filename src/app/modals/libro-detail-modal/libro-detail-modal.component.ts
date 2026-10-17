import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

export interface LibroDetalle {
  id?: number;
  titulo: string;
  autor: string;
  genero: string;
  detalles?: string;
  disponible: boolean;
}

@Component({
  selector: 'app-libro-detail-modal',
  templateUrl: './libro-detail-modal.component.html',
  styleUrls: ['./libro-detail-modal.component.scss']
})
export class LibroDetailModalComponent {
  @Input() isOpen: boolean = false;
  @Input() libro: LibroDetalle | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() solicitarPrestamo = new EventEmitter<LibroDetalle>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('libro-modal-container')) {
      this.onClose();
    }
  }

  onSolicitarPrestamo(): void {
    if (this.libro && this.libro.disponible) {
      this.solicitarPrestamo.emit(this.libro);
    }
  }

  getPortada(libro: LibroDetalle): string {
    return `assets/images/${libro.id}.jpg`;
  }
}
