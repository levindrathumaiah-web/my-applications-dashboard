import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../services/application';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './applications.html',
  styleUrl: './applications.css',
})
export class Applications implements OnInit {
  // 1. Wrap applications in a signal
  applications = signal<any[]>([]);

  selectedStatus = 'Applications';

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.applicationService.getApplications().subscribe((data) => {
      // 2. Use .set() instead of = so Angular knows to re-render
      this.applications.set(data);
      console.log(data);
    });
  }

  filteredApplications() {
    if (this.selectedStatus === 'Applications') {
      return this.applications().filter((app) => app.status?.statusName !== 'Draft');
    }

    return this.applications().filter((app) => app.status?.statusName === this.selectedStatus);
  }
}
