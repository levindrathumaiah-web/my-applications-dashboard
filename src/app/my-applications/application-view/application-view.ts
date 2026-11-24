import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ApplicationService } from '../../services/application';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-application-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './application-view.html',
  styleUrl: './application-view.css',
})
export class ApplicationView implements OnInit, OnDestroy {
  application = signal<any | null>(null);
  notFound = signal<boolean>(false);
  isAdmin = computed(() => this.authService.isAdmin());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
  deleting = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  deleteReady = signal<boolean>(false);
  countdown = signal<number>(5);

  private deleteTimer?: ReturnType<typeof setInterval>;

  ngOnDestroy(): void {
    this.clearDeleteTimer();
  }

  private clearDeleteTimer(): void {
    if (this.deleteTimer) {
      clearInterval(this.deleteTimer);
      this.deleteTimer = undefined;
    }
  }

  get canDelete(): boolean {
    return this.application()?.status?.statusName === 'Submitted';
  }

  openDeleteModal(): void {
    if (!this.canDelete) return;
    this.clearDeleteTimer();
    this.deleteReady.set(false);
    this.countdown.set(5);
    this.showDeleteModal.set(true);

    let remaining = 5;
    this.deleteTimer = setInterval(() => {
      remaining -= 1;
      this.countdown.set(remaining);
      if (remaining <= 0) {
        this.deleteReady.set(true);
        this.clearDeleteTimer();
      }
    }, 1000);
  }

  closeDeleteModal(): void {
    if (this.deleting()) return;
    this.clearDeleteTimer();
    this.showDeleteModal.set(false);
    this.deleteReady.set(false);
  }

  confirmDelete(): void {
    const app = this.application();
    if (!app || !this.canDelete || !this.deleteReady()) return;

    this.deleting.set(true);
    this.applicationService.deleteApplication(app.applicationId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.router.navigate(['/my-applications/applications']);
      },
      error: (err) => {
        console.error(err);
        this.deleting.set(false);
        this.closeDeleteModal();
      },
    });
  }
}
