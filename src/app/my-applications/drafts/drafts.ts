import { Component, OnInit, signal, computed } from '@angular/core';
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

  // Live filter signals
  searchAppNo = signal('');
  searchApplicant = signal('');
  selectedPermit = signal('All');
  selectedTransaction = signal('All');

  // Dropdown options
  permitTypes: string[] = [
    'Land Conversion Permit',
    'Building and Land Use Permit',
    'Fire Safety Plan',
    'Fire Certificate',
    'Occupation Certificate',
  ];
  transactionTypes: string[] = ['New', 'Renewal', 'Amendment'];

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
  filteredDrafts = computed(() => {
    const appNoQuery = this.searchAppNo().trim().toLowerCase();
    const applicantQuery = this.searchApplicant().trim().toLowerCase();
    const permitFilter = this.selectedPermit().toLowerCase();
    const transactionFilter = this.selectedTransaction().toLowerCase();

    return this.applications().filter((app) => {
      const appNo = (app.applicationNo ?? '').toLowerCase();
      const fullName = `${app.applicant?.firstName ?? ''} ${app.applicant?.lastName ?? ''}`
        .trim()
        .toLowerCase();

      const matchesAppNo = !appNoQuery || appNo.includes(appNoQuery);
      const matchesApplicant = !applicantQuery || fullName.includes(applicantQuery);

      const matchesPermit =
        permitFilter === 'all' || app.permit?.permitName?.toLowerCase() === permitFilter;

      const matchesTransaction =
        transactionFilter === 'all' ||
        app.transactionType?.transactionType?.toLowerCase() === transactionFilter;

      return matchesAppNo && matchesApplicant && matchesPermit && matchesTransaction;
    });
  });

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

  clearFilters(): void {
    this.searchAppNo.set('');
    this.searchApplicant.set('');
    this.selectedPermit.set('All');
    this.selectedTransaction.set('All');
  }

  deleteDraft(id: number): void {
    if (!confirm('Delete this draft application?')) return;

    this.applicationService.deleteApplication(id).subscribe(() => {
      this.applications.update((list) => list.filter((a) => a.applicationId !== id));
    });
  }
}
