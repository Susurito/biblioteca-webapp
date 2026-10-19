import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      if (this.authService.isAlumno()) {
        this.router.navigate(['/alumnos']);
      } else if (this.authService.isAdmin()) {
        this.router.navigate(['/admin']);
      }
    }
  }

}
