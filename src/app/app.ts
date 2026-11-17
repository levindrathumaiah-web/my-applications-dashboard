import { Component, OnInit } from '@angular/core';
import {ApplicationService} from './services/application';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  title = 'My Applications Dashboard';

  applications: any[] = [];

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.applicationService.getApplications().subscribe((data) => {
      this.applications = data;
      console.log(data);
    });
  }
  selectedStatus = 'All';
  filteredApplications() {
    if (this.selectedStatus === 'All') {
      return this.applications;
    }

    return this.applications.filter((app) => app.status?.statusName === this.selectedStatus);
  }
}
