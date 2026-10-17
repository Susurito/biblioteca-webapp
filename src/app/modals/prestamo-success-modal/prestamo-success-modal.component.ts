import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router } from '@angular/router';

export interface LibroPrestamoInfo {
  id?: number;
  titulo: string;
  autor: string;
  genero?: string;
}

@Component({
  selector: 'app-prestamo-success-modal',
  templateUrl: './prestamo-success-modal.component.html',
  styleUrls: ['./prestamo-success-modal.component.scss']
})
export class PrestamoSuccessModalComponent {
  @Input() isOpen: boolean = false;
  @Input() libro: LibroPrestamoInfo | null = null;
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

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
    if ((event.target as HTMLElement).classList.contains('prestamo-modal-container')) {
      this.onClose();
    }
  }

  goToMisPrestamos(): void {
    this.onClose();
    this.router.navigate(['/perfil']);
  }

  getPortada(libro: LibroPrestamoInfo): string {
    return `assets/images/${libro.id}.jpg`;
  }
}
