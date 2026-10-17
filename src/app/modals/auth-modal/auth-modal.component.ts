import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router } from '@angular/router';

export interface LibroModalInfo {
  id?: number;
  titulo: string;
  autor: string;
  genero?: string;
  disponible?: boolean;
}

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss']
})
export class AuthModalComponent {
  @Input() isOpen: boolean = false;
  @Input() libro: LibroModalInfo | null = null;
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
    if ((event.target as HTMLElement).classList.contains('auth-modal-container')) {
      this.onClose();
    }
  }

  goToLogin(): void {
    this.onClose();
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/catalogo' } });
  }

  goToRegister(): void {
    this.onClose();
    this.router.navigate(['/registro']);
  }
}
