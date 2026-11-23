import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    const cleanEmail = this.email.trim();
    if (!cleanEmail || !this.password) {
      this.errorMessage.set('Please enter both your email and password.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.authService
      .login({
        email: cleanEmail,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/my-applications']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Invalid email or password.');
        },
      });
  }

  onLogout(): void {
    this.authService.logout();
    this.email = '';
    this.password = '';
    this.errorMessage.set('');
  }
}
