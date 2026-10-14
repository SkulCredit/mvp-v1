export interface SupportMessage {
  subject: string;
  message: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'awaiting_customer' | 'escalated' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'loan_application' | 'payment' | 'technical' | 'document_upload' | 'general_inquiry' | 'school_verification' | 'disbursement' | 'other';
export type MessageVisibility = 'public' | 'internal';

export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  userRole: 'parent' | 'school';
  createdAt: string;
  updatedAt: string;
  userDeletedAt: string | null;
  escalationLevel: number;
  escalatedTo: string | null;
}

export interface SupportTicketMessageItem {
  id: string;
  authorId: string | null;
  authorType: 'submitter' | 'customer_service';
  body: string;
  visibility: MessageVisibility;
  createdAt: string;
  author?: { id: string; email: string } | null;
}

export interface SupportTicketTagItem {
  id: string;
  userId: string;
  taggedBy: string | null;
  note: string | null;
  createdAt: string;
  taggedUser?: { id: string; email: string } | null;
}

export interface TicketListResult {
  total: number;
  page: number;
  limit: number;
  data: SupportTicketItem[];
}

export interface CsManager {
  id: string;
  email: string;
  fullName: string | null;
}

export interface CsDashboardStats {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedToday: number;
  escalated: number;
  totalIssuesChange: number;
  openIssuesChange: number;
  inProgressChange: number;
  resolvedTodayChange: number;
  escalatedChange: number;
}
