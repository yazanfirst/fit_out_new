// Project Status Types
export type ProjectStatus = 'In Progress' | 'Completed' | 'Delayed' | 'On Hold' | 'Not Started';
export type ItemStatus = 'Ordered' | 'Not Ordered' | 'Partially Ordered' | 'Delivered' | 'Installed';
export type LPOStatus = 'LPO Received' | 'LPO Pending' | 'N/A';
export type InvoiceStatus = 'Not Submitted' | 'Submitted' | 'Approved' | 'Paid' | 'Rejected';
export type InvoiceType = '25%' | '50%' | '100%';
// Changed to accept any string for manual entry
export type ItemCategory = string;
export type ProjectScope = 'Owner' | 'Contractor';

// Interface definitions
export interface Project {
  id: string;
  name: string;
  location: string;
  main_contractor: string;
  status: ProjectStatus;
  progress: number;
  chain: 'BK' | 'TC';
  notes: string;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date: string;
}

export interface ProjectItem {
  id: string;
  project_id: string;
  name: string;
  category: ItemCategory;  // Now accepts any string
  quantity: number;
  status: ItemStatus;
  company: string;
  lpo_status: LPOStatus;
  notes: string;
  scope: ProjectScope;
  // These properties map to snake_case DB fields:
  completionPercentage?: number;  // Maps to completion_percentage in database
  workDescription?: string;       // Maps to work_description in database
}

export interface Drawing {
  id: string;
  project_id: string;
  name: string;
  type: 'Drawing' | 'Photo';
  category: string;
  storage_path: string;
  upload_date: string;
  uploaded_by: string;
  url?: string; // For client-side use
}

export interface Invoice {
  id: string;
  project_id: string;
  item_id: string | null;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  status: InvoiceStatus;
  type: InvoiceType;
  file_path?: string;
  fileUrl?: string; // Added as an explicitly defined property
}

export interface TimelineMilestone {
  id: string;
  project_id: string;
  name: string;
  planned_date: string;
  actual_date: string | null;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  notes: string;
}

export interface Company {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
}
