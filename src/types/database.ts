// Row types mirroring supabase/schema.sql (shared) + supabase/admin_schema.sql (admin-only).
// Keep in sync with the database.

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type PaymentTxnStatus = 'pending' | 'successful' | 'failed' | 'refunded';
export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue' | 'void';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

// ---------------------------------------------------------------------
// Shared tables (owned by manor-cares-users' schema.sql, read/written by
// this admin app through permission-scoped RLS policies).
// ---------------------------------------------------------------------

export interface Profile {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  role: 'customer' | 'staff' | 'admin';
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerProfile {
  id: number;
  profile_id: number;
  customer_number: string;
  preferred_contact_method: string;
  customer_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Address {
  id: number;
  profile_id: number;
  address_type: 'home' | 'work' | 'other';
  address_line: string;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CleaningService {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  price_unit: 'flat' | 'per_room' | 'per_hour' | 'per_sqft';
  estimated_duration_minutes: number | null;
  is_active: boolean;
  display_order: number;
}

export interface Booking {
  id: number;
  customer_id: number;
  service_id: number;
  booking_number: string;
  booking_date: string;
  booking_time: string;
  property_type: 'apartment' | 'house' | 'office' | 'airbnb' | 'other';
  property_address: string;
  number_of_rooms: number;
  number_of_bathrooms: number;
  additional_services: string[] | null;
  special_instructions: string | null;
  estimated_price: number | null;
  final_price: number | null;
  assigned_staff: string | null;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  cleaning_services?: CleaningService;
  customer_profiles?: CustomerProfile;
}

export interface Payment {
  id: number;
  customer_id: number;
  booking_id: number | null;
  payment_reference: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_status: PaymentTxnStatus;
  paid_at: string | null;
  created_at: string;
  customer_profiles?: CustomerProfile;
  bookings?: Booking;
}

export interface Invoice {
  id: number;
  customer_id: number;
  booking_id: number | null;
  invoice_number: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  created_at: string;
  customer_profiles?: CustomerProfile;
}

export interface ServiceReview {
  id: number;
  customer_id: number;
  booking_id: number;
  rating: number;
  review: string | null;
  created_at: string;
  bookings?: Booking;
  customer_profiles?: CustomerProfile;
}

export interface SupportTicket {
  id: number;
  customer_id: number;
  booking_id: number | null;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  customer_profiles?: CustomerProfile;
}

export interface SupportTicketMessage {
  id: number;
  ticket_id: number;
  profile_id: number | null;
  sender_type: 'customer' | 'staff';
  message: string;
  created_at: string;
}

// ---------------------------------------------------------------------
// Admin-only tables (supabase/admin_schema.sql)
// ---------------------------------------------------------------------

export interface Role {
  id: number;
  key: string;
  name: string;
  description: string | null;
}

export interface Permission {
  id: number;
  key: string;
  description: string | null;
}

export interface UserRole {
  id: number;
  profile_id: number;
  role_id: number;
  assigned_at: string;
  assigned_by: number | null;
  roles?: Role;
}

export type AdminStatus = 'active' | 'disabled';

export interface AdminProfile {
  id: number;
  profile_id: number;
  employee_code: string;
  department: string | null;
  job_title: string | null;
  status: AdminStatus;
  last_login_at: string | null;
  created_by: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  user_roles?: UserRole[];
}

export interface AuditLog {
  id: number;
  admin_user_id: number | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  description: string | null;
  created_at: string;
  profiles?: Profile;
}

export type EmploymentStatus = 'active' | 'on_leave' | 'terminated';

export interface Employee {
  id: number;
  profile_id: number | null;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  job_title: string | null;
  employment_status: EmploymentStatus;
  hire_date: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'on_leave';

export interface StaffAttendance {
  id: number;
  employee_id: number;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  created_at: string;
  employees?: Employee;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  requested_at: string;
  decided_by: number | null;
  decided_at: string | null;
  employees?: Employee;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface MarketingCampaign {
  id: number;
  name: string;
  description: string | null;
  channel: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: number;
  campaign_id: number | null;
  title: string;
  description: string | null;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  promo_code: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CustomerSegment {
  id: number;
  name: string;
  description: string | null;
  criteria: Record<string, unknown> | null;
  created_at: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface Lead {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  assigned_to: number | null;
  notes: string | null;
  estimated_value: number | null;
  created_at: string;
  updated_at: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined';

export interface Quote {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  service_id: number | null;
  amount: number;
  status: QuoteStatus;
  valid_until: string | null;
  created_at: string;
  leads?: Lead;
}

export type TechnicalTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TechnicalTicket {
  id: number;
  title: string;
  description: string;
  category: string | null;
  priority: TicketPriority;
  status: TechnicalTicketStatus;
  reported_by: number | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
}

export interface CleaningTeam {
  id: number;
  name: string;
  leader_employee_id: number | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

export interface CleaningTeamMember {
  team_id: number;
  employee_id: number;
  employees?: Employee;
}

export type VehicleStatus = 'available' | 'in_use' | 'maintenance';

export interface Vehicle {
  id: number;
  plate_number: string;
  model: string | null;
  capacity: number | null;
  status: VehicleStatus;
  assigned_team_id: number | null;
}

export type AssignmentStatus = 'scheduled' | 'en_route' | 'on_site' | 'completed';

export interface BookingAssignment {
  id: number;
  booking_id: number;
  team_id: number;
  vehicle_id: number | null;
  scheduled_at: string | null;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  bookings?: Booking;
  cleaning_teams?: CleaningTeam;
  vehicles?: Vehicle;
}
