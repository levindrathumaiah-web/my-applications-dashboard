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

  getPermits() {
    return this.http.get<any[]>(`${this.apiUrl}/permits`);
  }

  getTransactionTypes() {
    return this.http.get<any[]>(`${this.apiUrl}/transaction-types`);
  }

  createApplication(payload: any) {
    return this.http.post<any>(this.apiUrl, payload);
  }

  updateApplication(id: number, payload: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  deleteApplication(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getApplicantsByUser(userId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/applicants/user/${userId}`);
  }
}
