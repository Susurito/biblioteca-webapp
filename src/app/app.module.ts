import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginScreenComponent } from './screen/login-screen/login-screen.component';
import { RegistroUsuarioScreenComponent } from './screen/registro-usuario-screen/registro-usuario-screen.component';

// Angular Material y Forms
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { FormsModule } from '@angular/forms';
import { AdminScreenComponent } from './screen/admin-screen/admin-screen.component';
import { AlumnosScreenComponent } from './screen/alumnos-screen/alumnos-screen.component';
import { HttpClientModule } from '@angular/common/http';
import { CatalogoScreenComponent } from './screen/catalogo-screen/catalogo-screen.component';
import { Login2ScreenComponent } from './screen/login2-screen/login2-screen.component';
import { ContactoScreenComponent } from './screen/contacto-screen/contacto-screen.component';
import { RegistroScreenComponent } from './screen/registrar-screen/registrar-screen.component';
import { PerfilScreenComponent } from './screen/perfil-screen/perfil-screen.component';

import { DatePipe } from '@angular/common';


@NgModule({
  declarations: [
    AppComponent,
    LoginScreenComponent,
    RegistroUsuarioScreenComponent,
    AdminScreenComponent,
    AlumnosScreenComponent,
    CatalogoScreenComponent,
    Login2ScreenComponent,
    ContactoScreenComponent,
    RegistroScreenComponent,
    PerfilScreenComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,   // <--- agregado
    MatInputModule,        // <--- agregado
    MatFormFieldModule,    // <--- agregado
    MatButtonModule,       // <--- agregado
    MatCheckboxModule,      // <--- agregado
    MatIconModule,    // <-- Agregado
    MatSelectModule,   // <-- agregado
    MatOptionModule,    // <-- agregado
     FormsModule,
     HttpClientModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
