import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  frame = signal<1 | 2 | 3>(1);
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  firstName = '';
  lastName = '';
  birthMonth = '';
  birthDay = '';
  birthYear = '';
  gender = '';
  dateOfBirth = '';
  email = '';
  password = '';
  confirmPassword = '';

  readonly months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  readonly maxDob = new Date().toISOString().split('T')[0];
  readonly currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  nextFromFrame1(): void {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.errorMessage.set('Please enter both your first name and last name.');
      return;
    }
    this.errorMessage.set('');
    this.frame.set(2);
  }

  nextFromFrame2(): void {
    const dayNum = Number(this.birthDay);
    const yearNum = Number(this.birthYear);

    if (!this.birthMonth || !this.birthDay.trim() || !this.birthYear.trim()) {
      this.errorMessage.set('Please enter your complete date of birth.');
      return;
    }
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
      this.errorMessage.set('Please enter a valid day (1–31).');
      return;
    }
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > this.currentYear) {
      this.errorMessage.set(`Please enter a valid year (1900–${this.currentYear}).`);
      return;
    }

    const paddedDay = String(dayNum).padStart(2, '0');
    const assembledDob = `${yearNum}-${this.birthMonth}-${paddedDay}`;

    const parsedDate = new Date(`${assembledDob}T00:00:00`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getMonth() + 1 !== Number(this.birthMonth) ||
      parsedDate.getDate() !== dayNum
    ) {
      this.errorMessage.set('Please enter a valid calendar date.');
      return;
    }
    if (assembledDob >= this.maxDob) {
      this.errorMessage.set('Date of birth must be in the past.');
      return;
    }
    if (!this.gender) {
      this.errorMessage.set('Please select your gender.');
      return;
    }

    this.dateOfBirth = assembledDob;
    this.errorMessage.set('');
    this.frame.set(3);
  }

  previousFrame(): void {
    this.errorMessage.set('');
    if (this.frame() === 3) {
      this.frame.set(2);
    } else if (this.frame() === 2) {
      this.frame.set(1);
    }
  }

  submitRegistration(): void {
    const cleanEmail = this.email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.authService
      .register({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        gender: this.gender,
        dateOfBirth: this.dateOfBirth,
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
          this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
        },
      });
  }
}
