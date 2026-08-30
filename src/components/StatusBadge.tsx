import type {
  AdminStatus,
  AssignmentStatus,
  AttendanceStatus,
  BookingStatus,
  CampaignStatus,
  InvoiceStatus,
  LeadStatus,
  LeaveStatus,
  PaymentTxnStatus,
  QuoteStatus,
  TechnicalTicketStatus,
  TicketStatus,
  VehicleStatus,
} from '../types/database';

const STATUS_STYLES: Record<string, string> = {
  // booking
  pending: 'badge-amber',
  confirmed: 'badge-blue',
  assigned: 'badge-blue',
  in_progress: 'badge-gold',
  completed: 'badge-green',
  cancelled: 'badge-red',
  rescheduled: 'badge-gray',
  // payment / invoice / admin / vehicle / assignment shared words
  successful: 'badge-green',
  failed: 'badge-red',
  refunded: 'badge-gray',
  unpaid: 'badge-amber',
  paid: 'badge-green',
  overdue: 'badge-red',
  void: 'badge-gray',
  active: 'badge-green',
  inactive: 'badge-gray',
  disabled: 'badge-red',
  // ticket / technical
  open: 'badge-blue',
  waiting_for_customer: 'badge-amber',
  resolved: 'badge-green',
  closed: 'badge-gray',
  // attendance
  present: 'badge-green',
  absent: 'badge-red',
  late: 'badge-amber',
  on_leave: 'badge-gray',
  // leave / quote / lead
  approved: 'badge-green',
  rejected: 'badge-red',
  draft: 'badge-gray',
  sent: 'badge-blue',
  accepted: 'badge-green',
  declined: 'badge-red',
  new: 'badge-blue',
  contacted: 'badge-amber',
  qualified: 'badge-gold',
  converted: 'badge-green',
  lost: 'badge-red',
  // campaign
  paused: 'badge-amber',
  // vehicle
  available: 'badge-green',
  in_use: 'badge-blue',
  maintenance: 'badge-amber',
  // assignment
  scheduled: 'badge-blue',
  en_route: 'badge-gold',
  on_site: 'badge-amber',
  // employment
  terminated: 'badge-red',
};

function labelize(value: string) {
  return value.replace(/_/g, ' ');
}

export type StatusKind =
  | BookingStatus
  | PaymentTxnStatus
  | InvoiceStatus
  | TicketStatus
  | AdminStatus
  | AttendanceStatus
  | LeaveStatus
  | CampaignStatus
  | LeadStatus
  | QuoteStatus
  | TechnicalTicketStatus
  | VehicleStatus
  | AssignmentStatus
  | string;

export function StatusBadge({ status }: { status: StatusKind }) {
  const cls = STATUS_STYLES[status] ?? 'badge-gray';
  return <span className={`badge ${cls}`}>{labelize(status)}</span>;
}
