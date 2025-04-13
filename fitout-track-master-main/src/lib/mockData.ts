
// Project Status Types
export type ProjectStatus = 'In Progress' | 'Completed' | 'Delayed' | 'On Hold' | 'Not Started';
export type ItemStatus = 'Ordered' | 'Not Ordered' | 'Partially Ordered' | 'Delivered' | 'Installed';
export type LPOStatus = 'LPO Received' | 'LPO Pending' | 'N/A';
export type InvoiceStatus = 'Not Submitted' | 'Submitted' | 'Approved' | 'Paid' | 'Rejected';
export type InvoiceType = '25%' | '50%' | '100%';
export type ItemCategory = 'S/S Items' | 'Furniture' | 'Signage' | 'Fire Suppression' | 'Smallware' | 'Cold Room' | 'Equipment';
export type ProjectScope = 'Owner' | 'Contractor';

// Interface definitions
export interface Project {
  id: string;
  name: string;
  location: string;
  mainContractor: string;
  status: ProjectStatus;
  progress: number;
  chain: 'BK' | 'TC';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  projectId: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  status: ItemStatus;
  company: string;
  lpoStatus: LPOStatus;
  notes: string;
  scope: ProjectScope;
}

export interface Drawing {
  id: string;
  projectId: string;
  name: string;
  type: 'Drawing' | 'Photo';
  category: string;
  url: string;
  uploadDate: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  itemId: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  status: InvoiceStatus;
  type: InvoiceType;
  fileUrl: string;
}

export interface TimelineMilestone {
  id: string;
  projectId: string;
  name: string;
  plannedDate: string;
  actualDate: string | null;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  notes: string;
}

export interface Company {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
}

// Mock data
export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'BK Dubai Land',
    location: 'Dubai Land, Dubai, UAE',
    mainContractor: 'Al Tayer Stocks',
    status: 'In Progress',
    progress: 65,
    chain: 'BK',
    notes: 'Project is on track with minor delays in furniture delivery.',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-04-02T14:30:00Z'
  },
  {
    id: '2',
    name: 'TC A Soyaho',
    location: 'Al Soyaho, Abu Dhabi, UAE',
    mainContractor: 'Al Fara\'a General Contracting',
    status: 'Delayed',
    progress: 38,
    chain: 'TC',
    notes: 'Civil works delayed by 2 weeks. MEP works scheduled to start next week.',
    createdAt: '2024-02-10T10:15:00Z',
    updatedAt: '2024-04-05T09:45:00Z'
  },
  {
    id: '3',
    name: 'BK City Centre',
    location: 'City Centre Mall, Sharjah, UAE',
    mainContractor: 'Dubai Contracting Company',
    status: 'On Hold',
    progress: 25,
    chain: 'BK',
    notes: 'Project on hold pending mall management approval for revised layout.',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-04-01T11:20:00Z'
  },
  {
    id: '4',
    name: 'TC Marina Mall',
    location: 'Marina Mall, Abu Dhabi, UAE',
    mainContractor: 'Al Shafar General Contracting',
    status: 'Not Started',
    progress: 0,
    chain: 'TC',
    notes: 'Waiting for permit approval. Expected to start in 3 weeks.',
    createdAt: '2024-03-25T13:45:00Z',
    updatedAt: '2024-04-06T10:15:00Z'
  },
  {
    id: '5',
    name: 'BK The Galleria',
    location: 'The Galleria, Al Maryah Island, Abu Dhabi, UAE',
    mainContractor: 'Pivot Engineering & General Contracting',
    status: 'Completed',
    progress: 100,
    chain: 'BK',
    notes: 'Project completed on schedule. Handover completed on April 1st.',
    createdAt: '2023-12-05T08:30:00Z',
    updatedAt: '2024-04-01T09:00:00Z'
  },
];

export const mockItems: ProjectItem[] = [
  {
    id: '101',
    projectId: '1',
    name: 'Kitchen Counter',
    category: 'S/S Items',
    quantity: 3,
    status: 'Ordered',
    company: 'Al Mana Kitchen Equipment',
    lpoStatus: 'LPO Received',
    notes: 'Expected delivery by April 15th',
    scope: 'Owner'
  },
  {
    id: '102',
    projectId: '1',
    name: 'Dining Tables',
    category: 'Furniture',
    quantity: 12,
    status: 'Not Ordered',
    company: 'Middle East Furniture LLC',
    lpoStatus: 'LPO Pending',
    notes: 'Awaiting final approval on design',
    scope: 'Owner'
  },
  {
    id: '103',
    projectId: '1',
    name: 'Main Signage',
    category: 'Signage',
    quantity: 1,
    status: 'Ordered',
    company: 'Sign Works UAE',
    lpoStatus: 'LPO Received',
    notes: 'Production in progress',
    scope: 'Owner'
  },
  {
    id: '104',
    projectId: '1',
    name: 'Fire Suppression System',
    category: 'Fire Suppression',
    quantity: 1,
    status: 'Ordered',
    company: 'Fire Safety Systems LLC',
    lpoStatus: 'LPO Received',
    notes: 'Installation scheduled for next week',
    scope: 'Contractor'
  },
  {
    id: '105',
    projectId: '1',
    name: 'Kitchen Utensils Set',
    category: 'Smallware',
    quantity: 5,
    status: 'Delivered',
    company: 'Al Futtaim Trading',
    lpoStatus: 'LPO Received',
    notes: 'Delivered and stored on site',
    scope: 'Owner'
  },
  // Items for project 2
  {
    id: '201',
    projectId: '2',
    name: 'Cold Room Unit',
    category: 'Cold Room',
    quantity: 1,
    status: 'Ordered',
    company: 'Cool Tech Refrigeration',
    lpoStatus: 'LPO Received',
    notes: 'Delivery expected in 3 weeks',
    scope: 'Owner'
  },
  {
    id: '202',
    projectId: '2',
    name: 'Fryer Station',
    category: 'Equipment',
    quantity: 2,
    status: 'Not Ordered',
    company: 'Kitchen Equipment Trading',
    lpoStatus: 'LPO Pending',
    notes: 'Waiting for technical approval',
    scope: 'Owner'
  },
];

export const mockDrawings: Drawing[] = [
  {
    id: '1001',
    projectId: '1',
    name: 'Floor Plan - Rev 3',
    type: 'Drawing',
    category: 'Architectural',
    url: '/placeholder.svg',
    uploadDate: '2024-03-10T08:30:00Z'
  },
  {
    id: '1002',
    projectId: '1',
    name: 'Kitchen Layout',
    type: 'Drawing',
    category: 'MEP',
    url: '/placeholder.svg',
    uploadDate: '2024-03-15T10:45:00Z'
  },
  {
    id: '1003',
    projectId: '1',
    name: 'Site Photo - Week 1',
    type: 'Photo',
    category: 'Progress Photos',
    url: '/placeholder.svg',
    uploadDate: '2024-01-20T16:20:00Z'
  },
  // Drawings for project 2
  {
    id: '2001',
    projectId: '2',
    name: 'Reflected Ceiling Plan',
    type: 'Drawing',
    category: 'Architectural',
    url: '/placeholder.svg',
    uploadDate: '2024-02-15T09:30:00Z'
  },
  {
    id: '2002',
    projectId: '2',
    name: 'Site Excavation Photo',
    type: 'Photo',
    category: 'Progress Photos',
    url: '/placeholder.svg',
    uploadDate: '2024-02-25T14:10:00Z'
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: '10001',
    projectId: '1',
    itemId: '101',
    invoiceNumber: 'INV-2024-101',
    invoiceDate: '2024-03-20T00:00:00Z',
    amount: 15000,
    status: 'Submitted',
    type: '50%',
    fileUrl: '/placeholder.svg'
  },
  {
    id: '10002',
    projectId: '1',
    itemId: '103',
    invoiceNumber: 'INV-2024-103',
    invoiceDate: '2024-03-25T00:00:00Z',
    amount: 8500,
    status: 'Approved',
    type: '25%',
    fileUrl: '/placeholder.svg'
  },
  {
    id: '10003',
    projectId: '2',
    itemId: '201',
    invoiceNumber: 'INV-2024-201',
    invoiceDate: '2024-03-15T00:00:00Z',
    amount: 22000,
    status: 'Paid',
    type: '25%',
    fileUrl: '/placeholder.svg'
  }
];

export const mockTimeline: TimelineMilestone[] = [
  {
    id: '501',
    projectId: '1',
    name: 'Civil Works',
    plannedDate: '2024-01-20T00:00:00Z',
    actualDate: '2024-01-25T00:00:00Z',
    status: 'Completed',
    notes: 'Completed with 5 day delay due to material delivery'
  },
  {
    id: '502',
    projectId: '1',
    name: 'MEP Rough-in',
    plannedDate: '2024-02-15T00:00:00Z',
    actualDate: '2024-02-18T00:00:00Z',
    status: 'Completed',
    notes: 'Minor adjustments to HVAC layout'
  },
  {
    id: '503',
    projectId: '1',
    name: 'Fitout Work',
    plannedDate: '2024-03-01T00:00:00Z',
    actualDate: null,
    status: 'In Progress',
    notes: 'Wall cladding and ceiling work ongoing'
  },
  {
    id: '504',
    projectId: '1',
    name: 'Equipment Installation',
    plannedDate: '2024-04-10T00:00:00Z',
    actualDate: null,
    status: 'Not Started',
    notes: 'Waiting for equipment delivery'
  },
  {
    id: '505',
    projectId: '1',
    name: 'Final Inspection',
    plannedDate: '2024-05-01T00:00:00Z',
    actualDate: null,
    status: 'Not Started',
    notes: ''
  },
  // Timeline for project 2
  {
    id: '601',
    projectId: '2',
    name: 'Civil Works',
    plannedDate: '2024-02-25T00:00:00Z',
    actualDate: '2024-03-10T00:00:00Z',
    status: 'Delayed',
    notes: 'Delayed due to unexpected site conditions'
  },
  {
    id: '602',
    projectId: '2',
    name: 'MEP Rough-in',
    plannedDate: '2024-03-20T00:00:00Z',
    actualDate: null,
    status: 'Not Started',
    notes: 'Scheduled to start next week'
  }
];

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Al Mana Kitchen Equipment',
    contactPerson: 'Mohammed Al Mana',
    email: 'contact@almanakitchen.ae',
    phone: '+971 55 123 4567'
  },
  {
    id: '2',
    name: 'Middle East Furniture LLC',
    contactPerson: 'Sarah Johnson',
    email: 'info@mefurniture.com',
    phone: '+971 50 987 6543'
  },
  {
    id: '3',
    name: 'Sign Works UAE',
    contactPerson: 'Ahmad Al Falasi',
    email: 'sales@signworksuae.com',
    phone: '+971 52 555 7890'
  },
  {
    id: '4',
    name: 'Fire Safety Systems LLC',
    contactPerson: 'Raj Patel',
    email: 'info@firesafetysystems.ae',
    phone: '+971 54 111 2233'
  },
  {
    id: '5',
    name: 'Cool Tech Refrigeration',
    contactPerson: 'Hassan Al Zaabi',
    email: 'service@cooltech.ae',
    phone: '+971 56 444 5555'
  }
];

// Helper functions to get data by project ID
export const getProjectById = (projectId: string) => {
  return mockProjects.find(project => project.id === projectId);
};

export const getItemsByProjectId = (projectId: string) => {
  return mockItems.filter(item => item.projectId === projectId);
};

export const getDrawingsByProjectId = (projectId: string) => {
  return mockDrawings.filter(drawing => drawing.projectId === projectId);
};

export const getInvoicesByProjectId = (projectId: string) => {
  return mockInvoices.filter(invoice => invoice.projectId === projectId);
};

export const getTimelineByProjectId = (projectId: string) => {
  return mockTimeline.filter(milestone => milestone.projectId === projectId);
};
