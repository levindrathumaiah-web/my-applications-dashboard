import { Component, OnInit, signal, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ApplicationService } from '../services/application';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './my-applications.html',
  styleUrl: './my-applications.css',
})
export class MyApplications implements OnInit {
  private destroyRef = inject(DestroyRef);

  applicationsCount = signal<number>(0);
  draftsCount = signal<number>(0);
  isAdmin = computed(() => this.authService.isAdmin());

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.refreshCounts();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.refreshCounts());
  }

  refreshCounts(): void {
    const userId = this.authService.currentUser()?.userId;

    this.applicationService.getApplications().subscribe((data) => {
      if (this.isAdmin()) {
        this.applicationsCount.set(data.filter((app) => app.status?.statusName !== 'Draft').length);
        this.draftsCount.set(0);
      } else {
        const mine = data.filter((app) => app.applicant?.user?.userId === userId);

        this.applicationsCount.set(mine.filter((app) => app.status?.statusName !== 'Draft').length);
        this.draftsCount.set(mine.filter((app) => app.status?.statusName === 'Draft').length);
      }
    });
  }
}

