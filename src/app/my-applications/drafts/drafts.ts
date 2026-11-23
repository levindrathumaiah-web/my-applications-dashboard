import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApplicationService } from '../../services/application';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-drafts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './drafts.html',
  styleUrl: './drafts.css',
})
export class Drafts implements OnInit {
  applications = signal<any[]>([]);

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadDrafts();
  }

  loadDrafts(): void {
    const userId = this.authService.currentUser()?.userId;

    this.applicationService.getApplications().subscribe((data) => {
      this.applications.set(
        data.filter(
          (app) => app.applicant?.user?.userId === userId && app.status?.statusName === 'Draft',
        ),
      );
    });
  }

  deleteDraft(id: number): void {
    if (!confirm('Delete this draft application?')) return;

    this.applicationService.deleteApplication(id).subscribe(() => {
      this.applications.update((list) => list.filter((a) => a.applicationId !== id));
    });
  }
}
