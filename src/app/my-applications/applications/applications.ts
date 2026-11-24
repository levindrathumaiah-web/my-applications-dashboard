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
  isAdmin = computed(() => this.authService.isAdmin());
  updatingId = signal<number | null>(null);

  // Live filter signals — any change immediately recalculates filteredApplications()
  searchAppNo = signal('');
  searchApplicant = signal('');
  selectedStatus = signal('All');
  selectedPermit = signal('All');
  selectedTransaction = signal('All');

  // Dropdown options
  statuses: string[] = ['Submitted', 'Under Review', 'Approved', 'Rejected'];
  permitTypes: string[] = [
    'Land Conversion Permit',
    'Building and Land Use Permit',
    'Fire Safety Plan',
    'Fire Certificate',
    'Occupation Certificate',
  ];
  transactionTypes: string[] = ['New', 'Renewal', 'Amendment'];

  // Auto-populated datalist options from loaded applications
  availableAppNos = computed(() => {
    const nos = this.applications()
      .map((app) => app.applicationNo)
      .filter((no): no is string => !!no);
    return Array.from(new Set(nos)).sort();
  });

  availableApplicantNames = computed(() => {
    const names = this.applications()
      .map((app) => `${app.applicant?.firstName ?? ''} ${app.applicant?.lastName ?? ''}`.trim())
      .filter((name) => name.length > 0);
    return Array.from(new Set(names)).sort();
  });

  // Live multi-filter computation
  filteredApplications = computed(() => {
    const appNoQuery = this.searchAppNo().trim().toLowerCase();
    const applicantQuery = this.searchApplicant().trim().toLowerCase();
    const statusFilter = this.selectedStatus().toLowerCase();
    const permitFilter = this.selectedPermit().toLowerCase();
    const transactionFilter = this.selectedTransaction().toLowerCase();

    return this.applications().filter((app) => {
      const appNo = (app.applicationNo ?? '').toLowerCase();
      const fullName = `${app.applicant?.firstName ?? ''} ${app.applicant?.lastName ?? ''}`
        .trim()
        .toLowerCase();

      const matchesAppNo = !appNoQuery || appNo.includes(appNoQuery);
      const matchesApplicant = !applicantQuery || fullName.includes(applicantQuery);

      const matchesStatus =
        statusFilter === 'all' || app.status?.statusName?.toLowerCase() === statusFilter;

      const matchesPermit =
        permitFilter === 'all' || app.permit?.permitName?.toLowerCase() === permitFilter;

      const matchesTransaction =
        transactionFilter === 'all' ||
        app.transactionType?.transactionType?.toLowerCase() === transactionFilter;

      return (
        matchesAppNo && matchesApplicant && matchesStatus && matchesPermit && matchesTransaction
      );
    });
  });

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const userId = this.authService.currentUser()?.userId;

    this.applicationService.getApplications().subscribe((data) => {
      const scoped = this.isAdmin()
        ? data
        : data.filter((app) => app.applicant?.user?.userId === userId);

      // Exclude Drafts from the Submitted Applications view (drafts live in /drafts)
      this.applications.set(
        scoped.filter((app) => app.status?.statusName?.toLowerCase() !== 'draft'),
      );
    });
  }

  clearFilters(): void {
    this.searchAppNo.set('');
    this.searchApplicant.set('');
    this.selectedStatus.set('All');
    this.selectedPermit.set('All');
    this.selectedTransaction.set('All');
  }

  changeStatus(app: any, newStatus: string): void {
    const id = app.applicationId || app.id;
    if (!id || !newStatus || app.status?.statusName === newStatus) return;

    this.updatingId.set(id);

    this.applicationService.updateApplicationStatus(id, newStatus).subscribe({
      next: (updatedApp) => {
        this.applications.update((list) =>
          list.map((item) =>
            (item.applicationId || item.id) === id
              ? { ...item, status: updatedApp.status ?? { ...item.status, statusName: newStatus } }
              : item,
          ),
        );
        this.updatingId.set(null);
      },
      error: () => {
        alert('Failed to update status. Please try again.');
        this.updatingId.set(null);
      },
    });
  }
}
