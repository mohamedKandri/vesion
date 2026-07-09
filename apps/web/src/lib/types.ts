// Shared API types mirroring the backend's Prisma models and responses.

export type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'CLIENT' | 'GUEST';
export type ProjectStatus =
  | 'DISCOVERY'
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type ContractStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'EXPIRED' | 'TERMINATED';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'PAUSED' | 'CANCELLED';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  isActive?: boolean;
  companyId: string | null;
  company?: { id: string; name: string } | null;
  twoFactorEnabled: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  taxId?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  createdAt: string;
  users?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'jobTitle' | 'avatarUrl'>[];
  _count?: { users: number; projects: number; invoices: number; tickets?: number; subscriptions?: number };
}

export interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string | null;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: ProjectStatus;
  progress: number;
  budget?: string | null;
  currency: string;
  startDate?: string | null;
  dueDate?: string | null;
  companyId: string;
  company?: { id: string; name: string };
  manager?: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  members?: {
    id: string;
    roleTitle: string;
    user: { id: string; firstName: string; lastName: string; avatarUrl: string | null; jobTitle?: string | null };
  }[];
  milestones?: Milestone[];
  _count?: { tasks: number; milestones: number; members: number };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  estimatedHours?: string | null;
  order: number;
  labels: string[];
  assignee?: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  reporter?: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  milestone?: { id: string; title: string } | null;
  comments?: TaskComment[];
  timeEntries?: TimeEntry[];
  _count?: { comments: number; files: number; timeEntries: number };
  createdAt: string;
}

export interface TaskComment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export interface TimeEntry {
  id: string;
  minutes: number;
  note?: string | null;
  date: string;
  user: { id: string; firstName: string; lastName: string };
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  amountPaid: string;
  notes?: string | null;
  company?: { id: string; name: string };
  project?: { id: string; name: string } | null;
  taxRate?: { id: string; name: string; ratePercent: string } | null;
  items: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  reference?: string | null;
  paidAt: string;
  company?: { id: string; name: string };
  invoice?: { id: string; number: string } | null;
  refunds?: { id: string; amount: string; reason: string; createdAt: string }[];
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  features: string[];
  isPopular: boolean;
  order: number;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: Plan;
  company?: { id: string; name: string };
  payments?: Payment[];
}

export interface Quote {
  id: string;
  number: string;
  status: QuoteStatus;
  validUntil: string;
  currency: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  notes?: string | null;
  company?: { id: string; name: string };
  items: InvoiceItem[];
  createdAt: string;
}

export interface Contract {
  id: string;
  title: string;
  body: string;
  status: ContractStatus;
  sentAt?: string | null;
  signedAt?: string | null;
  signedByName?: string | null;
  expiresAt?: string | null;
  company?: { id: string; name: string };
  project?: { id: string; name: string } | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  number: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: { id: string; name: string; slug: string } | null;
  requester?: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null };
  assignee?: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  company?: { id: string; name: string } | null;
  messages?: TicketMessage[];
  _count?: { messages: number; files: number };
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null; role: UserRole };
}

export interface KbCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  _count?: { articles: number };
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body?: string;
  status: PostStatus;
  views: number;
  helpfulYes?: number;
  helpfulNo?: number;
  publishedAt?: string | null;
  updatedAt?: string;
  category: { id: string; name: string; slug: string };
  author?: { id: string; firstName: string; lastName: string } | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage?: string | null;
  tags: string[];
  readingMinutes: number;
  status: PostStatus;
  views: number;
  publishedAt?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    jobTitle?: string | null;
  } | null;
  related?: BlogPost[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  coverImage?: string | null;
  industry?: string | null;
  technologies: string[];
  projectUrl?: string | null;
  isCaseStudy: boolean;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
  metrics?: { label: string; value: string }[] | null;
  featured: boolean;
  status: PostStatus;
  order: number;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string;
  companyName: string;
  quote: string;
  avatarUrl?: string | null;
  rating: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface JobPosting {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  description?: string;
  requirements?: string[];
  salaryRange?: string | null;
  isOpen?: boolean;
  createdAt: string;
  _count?: { applications: number };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  subject?: string | null;
  isGroup: boolean;
  updatedAt: string;
  participants: {
    user: { id: string; firstName: string; lastName: string; avatarUrl: string | null; role: UserRole };
    lastReadAt: string | null;
  }[];
  lastMessage?: ChatMessage | null;
  messages?: ChatMessage[];
  unread?: number;
}

export interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  senderId?: string;
  sender?: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export interface AiMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources?: { type: 'kb' | 'faq'; title: string; slug?: string }[] | null;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title: string;
  context: 'WEBSITE' | 'SUPPORT' | 'PROJECT' | 'ADMIN';
  updatedAt: string;
  messages?: AiMessage[];
}

export interface FileAsset {
  id: string;
  key: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploader?: { id: string; firstName: string; lastName: string } | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email?: string; role?: UserRole } | null;
}

export interface AdminAnalytics {
  kpis: {
    clients: number;
    activeProjects: number;
    completedProjects: number;
    openTickets: number;
    overdueInvoices: number;
    revenueThisMonth: number;
    outstandingReceivables: number;
  };
  revenueByMonth: { month: string; revenue: number }[];
  projectsByStatus: { status: ProjectStatus; count: number }[];
  ticketsByStatus: { status: TicketStatus; count: number }[];
  recentActivity: AuditLog[];
}

export interface ClientOverview {
  projects: Pick<Project, 'id' | 'name' | 'status' | 'progress' | 'dueDate'>[];
  billing: { openInvoices: number; outstandingAmount: number };
  openTickets: number;
  recentNotifications: Notification[];
}
