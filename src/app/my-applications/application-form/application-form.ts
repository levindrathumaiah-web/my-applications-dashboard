import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, switchMap, tap } from 'rxjs';
import { ApplicationService } from '../../services/application';
import { AuthService } from '../../services/auth';

export interface GovError {
  fieldId: string;
  message: string;
}

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './application-form.html',
  styleUrl: './application-form.css',
})
export class ApplicationForm implements OnInit, OnDestroy {
  step = signal<1 | 2 | 3 | 4>(1);
  permits = signal<any[]>([]);
  transactionTypes = signal<any[]>([]);
  savedApplicants = signal<any[]>([]);
  saving = signal<boolean>(false);
  saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  lastSavedAt = signal<string>('');
  errors = signal<GovError[]>([]);

  editDraftId: number | null = null;
  selectedPermitId: number | null = null;
  selectedTransactionTypeId: number | null = null;
  selectedApplicantId: number | 'NEW' = 'NEW';

  applicantForm = {
    applicantName: '',
    isCompany: false,
    companyName: '',
    brn: '',
  };

  lcpDetails = {
    siteAddress: '',
    titleDeedNumber: '',
    landAreaSqm: null as number | null,
    proposedLandUse: '',
  };

  blupDetails = {
    siteAddress: '',
    localAuthority: '',
    developmentCategory: '',
    natureOfWorks: '',
    floorAreaSqm: null as number | null,
    numberOfFloors: null as number | null,
  };

  fspDetails = {
    buildingType: '',
    numberOfFloors: null as number | null,
    alarmSystemType: '',
    fireEngineerName: '',
  };

  fireDetails = {
    premisesAddress: '',
    occupancyLoad: null as number | null,
    extinguisherCount: null as number | null,
    emergencyExits: null as number | null,
    hasSprinklerSystem: false,
    lastInspectionDate: '',
  };

  occupationDetails = {
    blupReferenceNumber: '',
    completionDate: '',
    certifiedArchitectName: '',
    intendedOccupancyType: '',
  };

  private autoSave$ = new Subject<void>();
  private autoSaveSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.applicationService.getPermits().subscribe((data) => {
      this.permits.set(data);
      const permitCode = this.route.snapshot.paramMap.get('permitCode');
      if (permitCode && !this.editDraftId) {
        const matched = data.find(
          (p: any) =>
            p.permitCode?.toLowerCase() === permitCode.toLowerCase() ||
            String(p.permitId) === permitCode,
        );
        if (matched) {
          this.selectedPermitId = matched.permitId;
          this.step.set(2);
        }
      }
    });

    this.applicationService
      .getTransactionTypes()
      .subscribe((data) => this.transactionTypes.set(data));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editDraftId = Number(idParam);
    }

    const userId = this.authService.currentUser()?.userId;
    if (userId) {
      this.applicationService.getApplicantsByUser(userId).subscribe((list) => {
        this.savedApplicants.set(list);
        if (list.length > 0 && !this.editDraftId) {
          this.onApplicantSelectionChange(list[0].applicantId);
        }
      });
    }

    if (this.editDraftId) {
      this.loadDraftForEditing(this.editDraftId);
    }

    // Debounced auto-save: persists draft 1.2s after changes in Step 3 or Step 4
    this.autoSaveSub = this.autoSave$
      .pipe(
        debounceTime(1200),
        tap(() => this.saveStatus.set('saving')),
        switchMap(() => this.persistApplication('Draft')),
      )
      .subscribe({
        next: (saved: any) => {
          if (!this.editDraftId && saved?.applicationId) {
            this.editDraftId = saved.applicationId;
            window.history.replaceState(
              {},
              '',
              `/my-applications/drafts/${saved.applicationId}/edit`,
            );
          }
          if (this.selectedApplicantId === 'NEW' && saved?.applicant?.applicantId) {
            this.selectedApplicantId = saved.applicant.applicantId;
          }
          this.saveStatus.set('saved');
          this.lastSavedAt.set(
            new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          );
        },
        error: () => {
          this.saveStatus.set('error');
        },
      });
  }

  ngOnDestroy(): void {
    this.autoSaveSub?.unsubscribe();
  }

  onFieldChange(): void {
    if (
      (this.step() === 3 || this.step() === 4) &&
      this.selectedPermitId &&
      this.selectedTransactionTypeId
    ) {
      this.autoSave$.next();
    }
  }

  onApplicantSelectionChange(value: number | 'NEW'): void {
    this.selectedApplicantId = value;
    if (value === 'NEW') {
      const user = this.authService.currentUser();
      const defaultName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '';
      this.applicantForm = {
        applicantName: defaultName,
        isCompany: false,
        companyName: '',
        brn: '',
      };
      this.onFieldChange();
      return;
    }

    const found = this.savedApplicants().find((a) => a.applicantId === value);
    if (found) {
      this.applicantForm = {
        applicantName: found.applicantName ?? '',
        isCompany: !!found.company,
        companyName: found.company?.companyName ?? '',
        brn: found.company?.brn ?? '',
      };
      this.onFieldChange();
    }
  }

  private loadDraftForEditing(id: number): void {
    const userId = this.authService.currentUser()?.userId;

    this.applicationService.getApplications().subscribe((apps) => {
      const draft = apps.find(
        (a) =>
          a.applicationId === id &&
          a.applicant?.user?.userId === userId &&
          a.status?.statusName === 'Draft',
      );

      if (!draft) {
        this.router.navigate(['/my-applications/drafts']);
        return;
      }

      if (draft.applicant) {
        this.selectedApplicantId = draft.applicant.applicantId;
        this.applicantForm = {
          applicantName: draft.applicant.applicantName ?? '',
          isCompany: !!draft.applicant.company,
          companyName: draft.applicant.company?.companyName ?? '',
          brn: draft.applicant.company?.brn ?? '',
        };
      }

      this.selectedPermitId = draft.permit?.permitId ?? null;
      this.selectedTransactionTypeId = draft.transactionType?.transactionTypeId ?? null;

      if (draft.lcpDetails) this.lcpDetails = { ...this.lcpDetails, ...draft.lcpDetails };
      if (draft.blupDetails) this.blupDetails = { ...this.blupDetails, ...draft.blupDetails };
      if (draft.fspDetails) this.fspDetails = { ...this.fspDetails, ...draft.fspDetails };
      if (draft.fireDetails) this.fireDetails = { ...this.fireDetails, ...draft.fireDetails };
      if (draft.occupationDetails) {
        this.occupationDetails = { ...this.occupationDetails, ...draft.occupationDetails };
      }

      this.step.set(4);
    });
  }

  get selectedPermit(): any {
    return this.permits().find((p) => p.permitId === Number(this.selectedPermitId));
  }

  get selectedTransactionType(): any {
    return this.transactionTypes().find(
      (t) => t.transactionTypeId === Number(this.selectedTransactionTypeId),
    );
  }

  hasError(fieldId: string): string | undefined {
    return this.errors().find((e) => e.fieldId === fieldId)?.message;
  }

  private focusErrorSummary(): void {
    setTimeout(() => document.getElementById('gov-error-summary')?.focus(), 0);
  }

  // STEP 1 -> STEP 2
  submitPermitStep(): void {
    if (!this.selectedPermitId) {
      this.errors.set([
        { fieldId: 'permit-0', message: 'Select the type of permit you want to apply for' },
      ]);
      this.focusErrorSummary();
      return;
    }
    this.errors.set([]);
    this.step.set(2);
  }

  // STEP 2 -> STEP 3
  submitTransactionStep(): void {
    if (!this.selectedTransactionTypeId) {
      this.errors.set([{ fieldId: 'tx-0', message: 'Select a transaction type to continue' }]);
      this.focusErrorSummary();
      return;
    }
    this.errors.set([]);
    this.step.set(3);
  }

  // STEP 3 -> STEP 4
  validateApplicantStep(): boolean {
    const list: GovError[] = [];

    if (!this.applicantForm.applicantName.trim()) {
      list.push({ fieldId: 'applicantName', message: 'Enter the applicant full name' });
    }
    if (this.applicantForm.isCompany) {
      if (!this.applicantForm.companyName.trim()) {
        list.push({ fieldId: 'companyName', message: 'Enter the registered company name' });
      }
      if (!this.applicantForm.brn.trim()) {
        list.push({ fieldId: 'brn', message: 'Enter the Business Registration Number (BRN)' });
      }
    }

    this.errors.set(list);
    if (list.length > 0) {
      this.focusErrorSummary();
      return false;
    }
    return true;
  }

  submitApplicantStep(): void {
    if (!this.validateApplicantStep()) {
      return;
    }
    this.errors.set([]);
    this.step.set(4);
  }

  // STEP 4 VALIDATION FOR FINAL SUBMISSION
  private validatePermitDetailsStep(): boolean {
    if (!this.validateApplicantStep()) {
      this.step.set(3);
      return false;
    }

    const list: GovError[] = [];
    const permitName = this.selectedPermit?.permitName;

    if (permitName === 'Land Conversion Permit') {
      if (!this.lcpDetails.siteAddress.trim()) {
        list.push({ fieldId: 'lcpSiteAddress', message: 'Enter the site address' });
      }
      if (!this.lcpDetails.titleDeedNumber.trim()) {
        list.push({ fieldId: 'lcpTitleDeed', message: 'Enter the title deed number' });
      }
      if (!this.lcpDetails.landAreaSqm || this.lcpDetails.landAreaSqm <= 0) {
        list.push({ fieldId: 'lcpLandArea', message: 'Enter a valid land area in square metres' });
      }
      if (!this.lcpDetails.proposedLandUse.trim()) {
        list.push({ fieldId: 'lcpLandUse', message: 'Enter the proposed land use' });
      }
    } else if (permitName === 'Building and Land Use Permit') {
      if (!this.blupDetails.siteAddress.trim()) {
        list.push({ fieldId: 'blupSiteAddress', message: 'Enter the site address' });
      }
      if (!this.blupDetails.localAuthority.trim()) {
        list.push({ fieldId: 'blupLocalAuth', message: 'Enter the local authority' });
      }
      if (!this.blupDetails.developmentCategory.trim()) {
        list.push({ fieldId: 'blupDevCat', message: 'Enter the development category' });
      }
      if (!this.blupDetails.natureOfWorks.trim()) {
        list.push({ fieldId: 'blupWorks', message: 'Enter the nature of works' });
      }
      if (!this.blupDetails.floorAreaSqm || this.blupDetails.floorAreaSqm <= 0) {
        list.push({
          fieldId: 'blupFloorArea',
          message: 'Enter a valid floor area in square metres',
        });
      }
      if (!this.blupDetails.numberOfFloors || this.blupDetails.numberOfFloors < 1) {
        list.push({ fieldId: 'blupFloors', message: 'Enter at least 1 floor' });
      }
    } else if (permitName === 'Fire Safety Plan') {
      if (!this.fspDetails.buildingType.trim()) {
        list.push({ fieldId: 'fspBuildingType', message: 'Enter the building type' });
      }
      if (!this.fspDetails.numberOfFloors || this.fspDetails.numberOfFloors < 1) {
        list.push({ fieldId: 'fspFloors', message: 'Enter the number of floors' });
      }
      if (!this.fspDetails.alarmSystemType.trim()) {
        list.push({ fieldId: 'fspAlarm', message: 'Enter the alarm system type' });
      }
      if (!this.fspDetails.fireEngineerName.trim()) {
        list.push({ fieldId: 'fspEngineer', message: 'Enter the registered fire engineer name' });
      }
    } else if (permitName === 'Fire Certificate') {
      if (!this.fireDetails.premisesAddress.trim()) {
        list.push({ fieldId: 'fireAddress', message: 'Enter the premises address' });
      }
      if (!this.fireDetails.occupancyLoad || this.fireDetails.occupancyLoad < 1) {
        list.push({ fieldId: 'fireOccupancy', message: 'Enter the maximum occupancy load' });
      }
      if (this.fireDetails.extinguisherCount === null || this.fireDetails.extinguisherCount < 0) {
        list.push({
          fieldId: 'fireExtinguishers',
          message: 'Enter the number of fire extinguishers',
        });
      }
      if (!this.fireDetails.emergencyExits || this.fireDetails.emergencyExits < 1) {
        list.push({ fieldId: 'fireExits', message: 'Enter the number of emergency exits' });
      }
      if (!this.fireDetails.lastInspectionDate) {
        list.push({ fieldId: 'fireInspection', message: 'Enter the last inspection date' });
      }
    } else if (permitName === 'Occupation Certificate') {
      if (!this.occupationDetails.blupReferenceNumber.trim()) {
        list.push({ fieldId: 'occBlupRef', message: 'Enter the approved BLUP reference number' });
      }
      if (!this.occupationDetails.completionDate) {
        list.push({ fieldId: 'occCompletion', message: 'Enter the building completion date' });
      }
      if (!this.occupationDetails.certifiedArchitectName.trim()) {
        list.push({ fieldId: 'occArchitect', message: 'Enter the certified architect name' });
      }
      if (!this.occupationDetails.intendedOccupancyType.trim()) {
        list.push({ fieldId: 'occType', message: 'Enter the intended occupancy type' });
      }
    }

    this.errors.set(list);
    if (list.length > 0) {
      this.focusErrorSummary();
      return false;
    }
    return true;
  }

  private persistApplication(targetStatus: 'Draft' | 'Submitted') {
    const userId = this.authService.currentUser()?.userId;
    const user = this.authService.currentUser();
    const fallbackName = user
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : 'Applicant';

    const applicantPayload: any = {
      applicantId: this.selectedApplicantId === 'NEW' ? null : this.selectedApplicantId,
      applicantName: this.applicantForm.applicantName.trim() || fallbackName,
      user: { userId },
      company: this.applicantForm.isCompany
        ? {
            companyName: this.applicantForm.companyName.trim(),
            brn: this.applicantForm.brn.trim(),
          }
        : null,
    };

    const payload: any = {
      applicant: applicantPayload,
      permit: { permitId: Number(this.selectedPermitId) },
      transactionType: { transactionTypeId: Number(this.selectedTransactionTypeId) },
      status: { statusName: targetStatus },
    };

    const permitName = this.selectedPermit?.permitName;
    if (permitName === 'Land Conversion Permit') {
      payload.lcpDetails = this.lcpDetails;
    } else if (permitName === 'Building and Land Use Permit') {
      payload.blupDetails = this.blupDetails;
    } else if (permitName === 'Fire Safety Plan') {
      payload.fspDetails = this.fspDetails;
    } else if (permitName === 'Fire Certificate') {
      payload.fireDetails = this.fireDetails;
    } else if (permitName === 'Occupation Certificate') {
      payload.occupationDetails = this.occupationDetails;
    }

    return this.editDraftId
      ? this.applicationService.updateApplication(this.editDraftId, payload)
      : this.applicationService.createApplication(payload);
  }

  saveApplication(targetStatus: 'Draft' | 'Submitted'): void {
    const userId = this.authService.currentUser()?.userId;
    if (!userId || !this.selectedPermitId || !this.selectedTransactionTypeId) {
      this.errors.set([
        { fieldId: 'applicantName', message: 'Missing user, permit, or transaction information.' },
      ]);
      this.focusErrorSummary();
      return;
    }

    if (targetStatus === 'Draft') {
      if (!this.applicantForm.applicantName.trim()) {
        this.errors.set([
          { fieldId: 'applicantName', message: 'Enter the applicant full name before saving.' },
        ]);
        this.focusErrorSummary();
        return;
      }
    } else if (!this.validatePermitDetailsStep()) {
      return;
    }

    this.errors.set([]);
    this.saving.set(true);

    this.persistApplication(targetStatus).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate([
          targetStatus === 'Draft' ? '/my-applications/drafts' : '/my-applications/applications',
        ]);
      },
      error: (err) => {
        console.error(err);
        this.saving.set(false);
        this.errors.set([
          {
            fieldId: 'applicantName',
            message: 'Failed to save application. Please verify all fields and try again.',
          },
        ]);
        this.focusErrorSummary();
      },
    });
  }
}
