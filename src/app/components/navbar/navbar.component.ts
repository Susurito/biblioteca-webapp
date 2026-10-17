import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService, Usuario } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  searchTerm: string = '';

  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  isAlumno: boolean = false;
  isMenuOpen: boolean = false;
  isNavCollapsed: boolean = true;

  usuario: Usuario = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    matricula: '',
    rol: '',
    fotoPerfil: 'assets/images/default-avatar.png'
  };

  private suscripcion!: Subscription;
  private routerSub!: Subscription;
  private queryParamsSub!: Subscription;
  private searchQuerySub!: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private searchService: SearchService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Inicialización inmediata para evitar parpadeos
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isAdmin = this.authService.isAdmin();
    this.isAlumno = this.authService.isAlumno();

    this.suscripcion = this.authService.usuario$.subscribe(usuario => {
      this.isLoggedIn = this.authService.isLoggedIn();
      this.isAdmin = this.authService.isAdmin();
      this.isAlumno = this.authService.isAlumno();

      if (usuario) {
        this.usuario = usuario;
      } else if (!this.isLoggedIn) {
        this.usuario = {
          nombre: '',
          apellido_paterno: '',
          apellido_materno: '',
          email: '',
          matricula: '',
          rol: '',
          fotoPerfil: 'assets/images/default-avatar.png'
        };
      }
    });

    // Sincronizar input con el estado global de SearchService
    this.searchQuerySub = this.searchService.searchQuery$.subscribe(query => {
      if (this.searchTerm !== query) {
        this.searchTerm = query;
      }
    });

    // Sincronizar el input de búsqueda con el parámetro ?q= de la URL
    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      if (q && q !== this.searchTerm) {
        this.searchTerm = q;
        this.searchService.setQuery(q);
      } else if (!q && this.router.url.includes('/catalogo') && !this.searchTerm) {
        this.searchService.setQuery('');
      }
    });

    // Cerrar automáticamente el menú al navegar
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeNav();
        this.isMenuOpen = false;
      });
  }

  ngOnDestroy(): void {
    if (this.suscripcion) {
      this.suscripcion.unsubscribe();
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    if (this.queryParamsSub) {
      this.queryParamsSub.unsubscribe();
    }
    if (this.searchQuerySub) {
      this.searchQuerySub.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeNav();
      this.isMenuOpen = false;
    }
  }

  toggleNav(): void {
    this.isNavCollapsed = !this.isNavCollapsed;
  }

  closeNav(): void {
    this.isNavCollapsed = true;
  }

  // Refrescar en tiempo real al ir tecleando
  onSearchInput(): void {
    const term = this.searchTerm || '';
    this.searchService.setQuery(term);

    if (!this.router.url.includes('/catalogo')) {
      this.router.navigate(['/catalogo'], {
        queryParams: term.trim() ? { q: term.trim() } : {},
        replaceUrl: true
      }).then(() => {
        setTimeout(() => {
          const input = document.getElementById('navbar-search-input') as HTMLInputElement;
          if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }, 50);
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: term.trim() ? { q: term.trim() } : {},
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  onSearch(): void {
    const term = this.searchTerm ? this.searchTerm.trim() : '';
    this.searchService.setQuery(term);
    this.router.navigate(['/catalogo'], {
      queryParams: term ? { q: term } : {},
      replaceUrl: false
    });
    this.closeNav();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.isAlumno = false;
    this.isMenuOpen = false;
    this.closeNav();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.authService.actualizarFotoPerfil(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
}
