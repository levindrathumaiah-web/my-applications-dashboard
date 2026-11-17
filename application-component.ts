//separate  the draft - status (draft)

import { Component, OnInit } from '@angular/core';
import { ApplicationService } from '../../services/application.service';
import { Application } from '../../models/application.model';

@Component({
  selector: 'app-my-applications',
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.css']
})
export class MyApplicationsComponent implements OnInit {
  activeTab: 'applications' | 'drafts' = 'applications';
  allApplications: Application[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.fetchApplications();
  }

  fetchApplications(): void {
    this.isLoading = true;
    this.applicationService.getApplications().subscribe({
      next: (data) => {
        this.allApplications = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load applications from database.';
        this.isLoading = false;
      }
    });
  }

  // Filter: Applications tab displays all non-draft statuses
  get nonDraftApplications(): Application[] {
    return this.allApplications.filter(app => app.status !== 'Draft');
  }

  // Filter: Drafts tab displays only Draft status
  get draftApplications(): Application[] {
    return this.allApplications.filter(app => app.status === 'Draft');
  }

  setTab(tab: 'applications' | 'drafts'): void {
    this.activeTab = tab;
  }
}

