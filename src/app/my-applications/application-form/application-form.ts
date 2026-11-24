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

export interface StepGuide {
  title: string;
  guidance: string;
  documents: string[];
}

export type StepStatus = 'complete' | 'partial' | 'empty';

const STEP_1_PERMIT_GUIDES: Record<string, StepGuide> = {
  'Land Conversion Permit': {
    title: 'Land Conversion Permit (LCP)',
    guidance:
      'Required before converting agricultural land into residential, commercial, industrial, or institutional use under the Sugar Industry Efficiency Act.',
    documents: [
      'Title deed & transcription volume/number',
      'Site location plan & survey report (land area in sqm)',
      'Clearance or no-objection from relevant agricultural authorities',
    ],
  },
  'Building and Land Use Permit': {
    title: 'Building & Land Use Permit (BLUP)',
    guidance:
      'Mandatory prior to starting any new building construction, structural extension, or change of economic activity within a Municipal or District Council area.',
    documents: [
      'Architectural & site layout plans',
      'Title deed or lease agreement',
      'Total floor area (sqm) & number of floors',
      'Land Conversion Permit reference (if agricultural land)',
    ],
  },
  'Fire Safety Plan': {
    title: 'Fire Safety Plan (FSP)',
    guidance:
      'Technical fire protection design approval issued by the Mauritius Fire and Rescue Service (MFRS) before constructing or modifying commercial or multi-storey buildings.',
    documents: [
      'Fire safety engineering drawings & evacuation routes',
      'Fire alarm & detection system specifications',
      'Registered fire engineer credentials',
    ],
  },
  'Fire Certificate': {
    title: 'Fire Certificate',
    guidance:
      'Operational compliance certificate confirming that active premises meet MFRS fire safety standards, occupancy limits, and firefighting equipment requirements.',
    documents: [
      'Approved Fire Safety Plan reference',
      'Latest fire equipment & sprinkler inspection record',
      'Maximum occupancy load & emergency exit count',
    ],
  },
  'Occupation Certificate': {
    title: 'Occupation Certificate',
    guidance:
      'Final clearance certifying that completed construction works strictly conform to the approved BLUP and Fire Certificate before the building can be occupied or operated.',
    documents: [
      'Approved BLUP reference number',
      'Architect completion & structural conformity certificate',
      'Valid Fire Certificate for the premises',
    ],
  },
};

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './application-form.html',
  styleUrl: './application-form.css',
})
export class ApplicationForm implements OnInit, OnDestroy {
  step = signal<1 | 2 | 3 | 4 | 5>(1);
  permits = signal<any[]>([]);
  transactionTypes = signal<any[]>([]);
  saving = signal<boolean>(false);
  saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  lastSavedAt = signal<string>('');
  errors = signal<GovError[]>([]);

  editDraftId: number | null = null;
  selectedPermitId: number | null = null;
  selectedTransactionTypeId: number | null = null;
  companyStepVisited = false;

  applicantForm = {
    firstName: '',
    lastName: '',
    address: '',
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
      this.loadDraftForEditing(this.editDraftId);
    }

    // Debounced auto-save: persists draft 1.2s after changes in Steps 3, 4, or 5
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
      (this.step() === 3 || this.step() === 4 || this.step() === 5) &&
      this.selectedPermitId &&
      this.selectedTransactionTypeId
    ) {
      this.autoSave$.next();
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
        this.applicantForm = {
          firstName: draft.applicant.firstName ?? '',
          lastName: draft.applicant.lastName ?? '',
          address: draft.applicant.address ?? '',
          isCompany: !!draft.applicant.company,
          companyName: draft.applicant.company?.companyName ?? '',
          brn: draft.applicant.company?.brn ?? '',
        };
      }

      this.selectedPermitId = draft.permit?.permitId ?? null;
      this.selectedTransactionTypeId = draft.transactionType?.transactionTypeId ?? null;
      this.companyStepVisited = true;

      if (draft.lcpDetails) this.lcpDetails = { ...this.lcpDetails, ...draft.lcpDetails };
      if (draft.blupDetails) this.blupDetails = { ...this.blupDetails, ...draft.blupDetails };
      if (draft.fspDetails) this.fspDetails = { ...this.fspDetails, ...draft.fspDetails };
      if (draft.fireDetails) this.fireDetails = { ...this.fireDetails, ...draft.fireDetails };
      if (draft.occupationDetails) {
        this.occupationDetails = { ...this.occupationDetails, ...draft.occupationDetails };
      }

      this.step.set(5);
    });
  }

  get selectedPermit(): any {
    return this.permits().find((p) => p.permitId === Number(this.selectedPermitId));
  }

  get permitThemeClass(): string {
    const name = this.selectedPermit?.permitName;
    if (name === 'Land Conversion Permit') return 'permit-theme-lcp';
    if (name === 'Building and Land Use Permit') return 'permit-theme-blup';
    if (name === 'Fire Safety Plan') return 'permit-theme-fsp';
    if (name === 'Fire Certificate') return 'permit-theme-fire';
    if (name === 'Occupation Certificate') return 'permit-theme-occ';
    return 'permit-theme-default';
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

  // SIDEBAR NAVIGATION & LIVE STEP STATUS
  goToStep(targetStep: 1 | 2 | 3 | 4 | 5): void {
    if (this.editDraftId && (targetStep === 1 || targetStep === 2)) {
      return;
    }
    if (targetStep === 4) {
      this.companyStepVisited = true;
    }
    this.errors.set([]);
    this.step.set(targetStep);
  }

  getStepStatus(stepNum: 1 | 2 | 3 | 4 | 5): StepStatus {
    if (stepNum === 1) {
      return this.selectedPermitId ? 'complete' : 'empty';
    }

    if (stepNum === 2) {
      return this.selectedTransactionTypeId ? 'complete' : 'empty';
    }

    if (stepNum === 3) {
      const filled = [
        this.applicantForm.firstName.trim(),
        this.applicantForm.lastName.trim(),
        this.applicantForm.address.trim(),
      ].filter(Boolean).length;
      if (filled === 3) return 'complete';
      if (filled > 0) return 'partial';
      return 'empty';
    }

    if (stepNum === 4) {
      if (!this.applicantForm.isCompany) {
        return this.companyStepVisited || this.editDraftId ? 'complete' : 'empty';
      }
      const hasName = !!this.applicantForm.companyName.trim();
      const hasBrn = !!this.applicantForm.brn.trim();
      if (hasName && hasBrn) return 'complete';
      if (hasName || hasBrn) return 'partial';
      return 'partial';
    }

    if (stepNum === 5) {
      const permitName = this.selectedPermit?.permitName;
      if (!permitName) return 'empty';

      let filled = 0;
      let total = 0;

      if (permitName === 'Land Conversion Permit') {
        total = 4;
        if (this.lcpDetails.siteAddress.trim()) filled++;
        if (this.lcpDetails.titleDeedNumber.trim()) filled++;
        if (this.lcpDetails.landAreaSqm && this.lcpDetails.landAreaSqm > 0) filled++;
        if (this.lcpDetails.proposedLandUse.trim()) filled++;
      } else if (permitName === 'Building and Land Use Permit') {
        total = 6;
        if (this.blupDetails.siteAddress.trim()) filled++;
        if (this.blupDetails.localAuthority.trim()) filled++;
        if (this.blupDetails.developmentCategory.trim()) filled++;
        if (this.blupDetails.natureOfWorks.trim()) filled++;
        if (this.blupDetails.floorAreaSqm && this.blupDetails.floorAreaSqm > 0) filled++;
        if (this.blupDetails.numberOfFloors && this.blupDetails.numberOfFloors >= 1) filled++;
      } else if (permitName === 'Fire Safety Plan') {
        total = 4;
        if (this.fspDetails.buildingType.trim()) filled++;
        if (this.fspDetails.numberOfFloors && this.fspDetails.numberOfFloors >= 1) filled++;
        if (this.fspDetails.alarmSystemType.trim()) filled++;
        if (this.fspDetails.fireEngineerName.trim()) filled++;
      } else if (permitName === 'Fire Certificate') {
        total = 5;
        if (this.fireDetails.premisesAddress.trim()) filled++;
        if (this.fireDetails.occupancyLoad && this.fireDetails.occupancyLoad >= 1) filled++;
        if (
          this.fireDetails.extinguisherCount !== null &&
          this.fireDetails.extinguisherCount >= 0
        ) {
          filled++;
        }
        if (this.fireDetails.emergencyExits && this.fireDetails.emergencyExits >= 1) filled++;
        if (this.fireDetails.lastInspectionDate) filled++;
      } else if (permitName === 'Occupation Certificate') {
        total = 4;
        if (this.occupationDetails.blupReferenceNumber.trim()) filled++;
        if (this.occupationDetails.completionDate) filled++;
        if (this.occupationDetails.certifiedArchitectName.trim()) filled++;
        if (this.occupationDetails.intendedOccupancyType.trim()) filled++;
      }

      if (filled === 0) return 'empty';
      if (filled === total) return 'complete';
      return 'partial';
    }

    return 'empty';
  }

  get currentStepGuide(): StepGuide {
    const current = this.step();
    const permitName = this.selectedPermit?.permitName;

    if (current === 1) {
      if (permitName && STEP_1_PERMIT_GUIDES[permitName]) {
        return STEP_1_PERMIT_GUIDES[permitName];
      }

      return {
        title: 'Choosing a permit',
        guidance:
          'Select a permit or licence on the left to view its definition, statutory purpose, and required information.',
        documents: [
          'Project brief or site development scope',
          'Previous EDB / local authority reference (if applicable)',
        ],
      };
    }

    if (current === 2) {
      return {
        title: 'Transaction type',
        guidance:
          'Choose New Application for first-time submissions, Renewal for expiring permits, or Amendment if modifying approved plans.',
        documents: [
          'Existing permit certificate (for renewals or amendments)',
          'Summary of proposed modifications (for amendments)',
        ],
      };
    }

    if (current === 3) {
      return {
        title: 'Applicant details',
        guidance:
          'Provide the legal first name, surname, and correspondence address of the individual submitting or representing the application.',
        documents: [
          'National Identity Card (NIC) or valid Passport',
          'Proof of residential or correspondence address',
          'Letter of authorisation (if applying as an agent or representative)',
        ],
      };
    }

    if (current === 4) {
      return {
        title: 'Company registration',
        guidance:
          'Select Yes if the permit will be held by a corporate entity. Ensure the company name and BRN match the Corporate and Business Registration Department (CBRD) records.',
        documents: [
          'Business Registration Card (BRN)',
          'Certificate of Incorporation',
          'Board resolution or director signatory mandate',
        ],
      };
    }

    // STEP 5: Permit-specific guidance & documents
    if (permitName === 'Land Conversion Permit') {
      return {
        title: 'Land Conversion Permit',
        guidance:
          'Provide the exact site location, transcription volume/number from the title deed, total area in square metres, and intended zoning use.',
        documents: [
          'Title Deed (Transcription Volume & Number)',
          'Site Plan & Location Plan (1:2500 / 1:10000)',
          'Surveyor’s Pinning / Boundary Report',
        ],
      };
    }

    if (permitName === 'Building and Land Use Permit') {
      return {
        title: 'Building & Land Use Permit',
        guidance:
          'Enter the municipal or district council jurisdiction, development category, total floor area across all levels, and number of storeys.',
        documents: [
          'Architectural & Structural Drawings',
          'Title Deed or Lease Agreement',
          'Land Conversion Permit (if agricultural land)',
          'Cadastral / Location Plan',
        ],
      };
    }

    if (permitName === 'Fire Safety Plan') {
      return {
        title: 'Fire Safety Plan',
        guidance:
          'Specify the building classification, storey count, fire detection/alarm specification, and the registered fire safety engineer.',
        documents: [
          'Fire Strategy & Evacuation Layout Plans',
          'Alarm & Detection System Specifications',
          'Registered Fire Engineer Declaration',
        ],
      };
    }

    if (permitName === 'Fire Certificate') {
      return {
        title: 'Fire Certificate',
        guidance:
          'Confirm maximum occupancy load, fire extinguisher count, number of emergency exits, sprinkler installation, and the date of your last fire inspection.',
        documents: [
          'Approved Fire Safety Plan reference',
          'Fire Extinguisher & Sprinkler Maintenance Certificate',
          'Latest Mauritius Fire and Rescue Service (MFRS) Inspection Report',
        ],
      };
    }

    if (permitName === 'Occupation Certificate') {
      return {
        title: 'Occupation Certificate',
        guidance:
          'Provide your approved BLUP reference number, structural completion date, certifying architect, and final occupancy classification.',
        documents: [
          'Approved Building and Land Use Permit (BLUP)',
          'Architect’s Certificate of Completion',
          'Valid Fire Certificate & Utility Clearance',
        ],
      };
    }

    return {
      title: 'Permit details',
      guidance: 'Complete all required technical fields for your selected permit.',
      documents: ['Supporting technical plans and certificates'],
    };
  }

  getStepValue(stepNum: 1 | 2 | 3 | 4 | 5): string {
    if (stepNum === 1) {
      return this.selectedPermit?.permitName || 'Not selected';
    }
    if (stepNum === 2) {
      return this.selectedTransactionType?.transactionType || 'Not selected';
    }
    if (stepNum === 3) {
      const fullName =
        `${this.applicantForm.firstName.trim()} ${this.applicantForm.lastName.trim()}`.trim();
      return fullName || 'Not entered';
    }
    if (stepNum === 4) {
      if (!this.applicantForm.isCompany) {
        return this.companyStepVisited || this.editDraftId
          ? 'Individual (No company)'
          : 'Not confirmed';
      }
      if (this.applicantForm.companyName.trim() && this.applicantForm.brn.trim()) {
        return `${this.applicantForm.companyName.trim()} (${this.applicantForm.brn.trim()})`;
      }
      return (
        this.applicantForm.companyName.trim() ||
        this.applicantForm.brn.trim() ||
        'Company details pending'
      );
    }
    if (stepNum === 5) {
      const status = this.getStepStatus(5);
      if (status === 'complete') return 'All required fields filled';
      if (status === 'partial') return 'In progress';
      return 'Not started';
    }
    return '';
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

    if (!this.applicantForm.firstName.trim()) {
      list.push({ fieldId: 'firstName', message: 'Enter the applicant first name' });
    }
    if (!this.applicantForm.lastName.trim()) {
      list.push({ fieldId: 'lastName', message: 'Enter the applicant last name' });
    }
    if (!this.applicantForm.address.trim()) {
      list.push({ fieldId: 'applicantAddress', message: 'Enter the correspondence address' });
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
    this.companyStepVisited = true;
    this.errors.set([]);
    this.step.set(4);
  }

  // STEP 4 -> STEP 5
  validateCompanyStep(): boolean {
    const list: GovError[] = [];

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

  submitCompanyStep(): void {
    if (!this.validateCompanyStep()) {
      return;
    }
    this.errors.set([]);
    this.step.set(5);
  }

  // STEP 5 VALIDATION FOR FINAL SUBMISSION
  private validatePermitDetailsStep(): boolean {
    if (!this.validateApplicantStep()) {
      this.step.set(3);
      return false;
    }
    if (!this.validateCompanyStep()) {
      this.step.set(4);
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
    } else {
      list.push({
        fieldId: 'permit-0',
        message: 'Select a valid permit type before submitting',
      });
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

    const applicantPayload: any = {
      firstName: this.applicantForm.firstName.trim(),
      lastName: this.applicantForm.lastName.trim(),
      address: this.applicantForm.address.trim(),
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
        { fieldId: 'firstName', message: 'Missing user, permit, or transaction information.' },
      ]);
      this.focusErrorSummary();
      return;
    }

    if (targetStatus === 'Submitted' && !this.validatePermitDetailsStep()) {
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
            fieldId: 'firstName',
            message: 'Failed to save application. Please verify all fields and try again.',
          },
        ]);
        this.focusErrorSummary();
      },
    });
  }

  get isFormValid(): boolean {
    if (!this.selectedPermitId || !this.selectedTransactionTypeId) {
      return false;
    }

    // Check Step 3 (Applicant)
    if (
      !this.applicantForm.firstName.trim() ||
      !this.applicantForm.lastName.trim() ||
      !this.applicantForm.address.trim()
    ) {
      return false;
    }

    // Check Step 4 (Company)
    if (
      this.applicantForm.isCompany &&
      (!this.applicantForm.companyName.trim() || !this.applicantForm.brn.trim())
    ) {
      return false;
    }

    // Check Step 5 (Permit-specific fields)
    const permitName = this.selectedPermit?.permitName;
    if (permitName === 'Land Conversion Permit') {
      return !!(
        this.lcpDetails.siteAddress.trim() &&
        this.lcpDetails.titleDeedNumber.trim() &&
        this.lcpDetails.landAreaSqm &&
        this.lcpDetails.landAreaSqm > 0 &&
        this.lcpDetails.proposedLandUse.trim()
      );
    }
    if (permitName === 'Building and Land Use Permit') {
      return !!(
        this.blupDetails.siteAddress.trim() &&
        this.blupDetails.localAuthority.trim() &&
        this.blupDetails.developmentCategory.trim() &&
        this.blupDetails.natureOfWorks.trim() &&
        this.blupDetails.floorAreaSqm &&
        this.blupDetails.floorAreaSqm > 0 &&
        this.blupDetails.numberOfFloors &&
        this.blupDetails.numberOfFloors >= 1
      );
    }
    if (permitName === 'Fire Safety Plan') {
      return !!(
        this.fspDetails.buildingType.trim() &&
        this.fspDetails.numberOfFloors &&
        this.fspDetails.numberOfFloors >= 1 &&
        this.fspDetails.alarmSystemType.trim() &&
        this.fspDetails.fireEngineerName.trim()
      );
    }
    if (permitName === 'Fire Certificate') {
      return !!(
        this.fireDetails.premisesAddress.trim() &&
        this.fireDetails.occupancyLoad &&
        this.fireDetails.occupancyLoad >= 1 &&
        this.fireDetails.extinguisherCount !== null &&
        this.fireDetails.extinguisherCount >= 0 &&
        this.fireDetails.emergencyExits &&
        this.fireDetails.emergencyExits >= 1 &&
        this.fireDetails.lastInspectionDate
      );
    }
    if (permitName === 'Occupation Certificate') {
      return !!(
        this.occupationDetails.blupReferenceNumber.trim() &&
        this.occupationDetails.completionDate &&
        this.occupationDetails.certifiedArchitectName.trim() &&
        this.occupationDetails.intendedOccupancyType.trim()
      );
    }

    return false;
  }
}
