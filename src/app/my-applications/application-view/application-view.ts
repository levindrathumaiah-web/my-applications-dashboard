import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicationService } from '../../services/application';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-application-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './application-view.html',
  styleUrl: './application-view.css',
})
export class ApplicationView implements OnInit {
  application = signal<any | null>(null);
  notFound = signal<boolean>(false);
  isAdmin = computed(() => this.authService.isAdmin());

  constructor(
    private route: ActivatedRoute,
    private applicationService: ApplicationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const userId = this.authService.currentUser()?.userId;

    this.applicationService.getApplications().subscribe((data) => {
      const found = data.find((app) => {
        const matchesId = app.applicationId === id || app.id === id;

        if (this.isAdmin()) {
          return matchesId && app.status?.statusName !== 'Draft';
        }
        return matchesId && app.applicant?.user?.userId === userId;
      });

      if (found) {
        this.application.set(found);
      } else {
        this.notFound.set(true);
      }
    });
  }
}
