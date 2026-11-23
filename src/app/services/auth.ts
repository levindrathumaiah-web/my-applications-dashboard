import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private readonly ADMIN_EMAIL = 'admin@edb.mu';

  currentUser = signal<any>(this.loadUser());
  isAdmin = computed(() => this.currentUser()?.email?.toLowerCase() === this.ADMIN_EMAIL);

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser.set(user);
      }),
    );
  }

  register(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, payload).pipe(
      tap((user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser.set(user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUser.set(null);
  }

  private loadUser(): any {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  }
}
