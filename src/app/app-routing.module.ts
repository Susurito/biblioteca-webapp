import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginScreenComponent } from './screen/login-screen/login-screen.component';
import { RegistroUsuarioScreenComponent } from './screen/registro-usuario-screen/registro-usuario-screen.component';
import { AlumnosScreenComponent } from './screen/alumnos-screen/alumnos-screen.component';
import { AdminScreenComponent } from './screen/admin-screen/admin-screen.component';
import { CatalogoScreenComponent } from './screen/catalogo-screen/catalogo-screen.component';
import { Login2ScreenComponent } from './screen/login2-screen/login2-screen.component';
import { AuthGuard } from './guards/auth.guard';
import { ContactoScreenComponent } from './screen/contacto-screen/contacto-screen.component';
import { RegistroScreenComponent } from './screen/registrar-screen/registrar-screen.component';
import { PerfilScreenComponent } from './screen/perfil-screen/perfil-screen.component';


const routes: Routes = [
   { path: '', component: LoginScreenComponent, pathMatch: 'full' },
  { path: 'registro', component: RegistroUsuarioScreenComponent, pathMatch: 'full' },
  { path: 'alumnos', component: AlumnosScreenComponent, pathMatch: 'full' },
  { path: 'admin', component: AdminScreenComponent, pathMatch: 'full' },
  { path: 'catalogo', component: CatalogoScreenComponent },
  { path: 'contacto', component: ContactoScreenComponent },
  { path: 'login', component: Login2ScreenComponent },
  { path: 'registrar-libro', component: RegistroScreenComponent },

  // app-routing.module.ts
{ path: 'cuenta', component: PerfilScreenComponent },

  { path: '**', redirectTo: '' } // fallback
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
