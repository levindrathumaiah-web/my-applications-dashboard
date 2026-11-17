import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private apiUrl = 'http://localhost:8080/applications';

  constructor(private http: HttpClient) {}

  getApplications() {
    return this.http.get<any[]>(this.apiUrl);
  }
}
