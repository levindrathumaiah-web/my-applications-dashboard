import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../services/application';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './applications.html',
  styleUrl: './applications.css',
})
export class Applications implements OnInit {
  applications = signal<any[]>([]);
  selectedStatus = 'Applications';
  isAdmin = computed(() => this.authService.isAdmin());

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const userId = this.authService.currentUser()?.userId;

    this.applicationService.getApplications().subscribe((data) => {
      if (this.isAdmin()) {
        this.applications.set(data);
      } else {
        this.applications.set(data.filter((app) => app.applicant?.user?.userId === userId));
      }
    });
  }

  filteredApplications() {
    if (this.selectedStatus === 'Applications') {
      return this.applications().filter((app) => app.status?.statusName !== 'Draft');
    }

    return this.applications().filter((app) => app.status?.statusName === this.selectedStatus);
  }
}
