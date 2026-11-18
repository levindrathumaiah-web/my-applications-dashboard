import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../services/application';

@Component({
  selector: 'app-drafts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drafts.html',
  styleUrl: './drafts.css',
})
export class Drafts implements OnInit {
  applications = signal<any[]>([]);

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.applicationService.getApplications().subscribe((data) => {
      this.applications.set(data.filter((app) => app.status?.statusName === 'Draft'));
    });
  }
}
