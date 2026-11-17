// Define the application types.

export type PermitType =
  | 'Land Conversion Permit'
  | 'Building & Land Use Permit'
  | 'Fire Safety Plan'
  | 'Fire Certificate'
  | 'Occupational Certificate';

export type TransactionType = 'New' | 'Renewal' | 'Amendment';

export type ApplicationStatus = 'In process' | 'Approved' | 'Rejected' | 'Draft';

export interface Application {
  application_number: string;
  permit_type: PermitType;
  transaction_type: TransactionType;
  applicant_name: string;
  company_name: string;
  status: ApplicationStatus;
  created_date: string;
  submitted_date: string | null;
}
