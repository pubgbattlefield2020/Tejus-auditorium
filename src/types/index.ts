export type SlotPeriod = 'Morning' | 'Evening';
export type BookingStatus = 'Confirmed' | 'Cancelled' | 'Completed';
export type ACType = 'AC' | 'Non-AC';
export type AuditoriumArea = 'Ground Floor' | '1st Floor' | 'Full Auditorium';

export interface Booking {
  id: string;
  booking_id: string;
  receipt_no: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  booking_date: string; // YYYY-MM-DD
  programme_date: string; // YYYY-MM-DD
  from_time: string; // HH:mm:ss or HH:mm
  to_time: string; // HH:mm:ss or HH:mm
  slot_period: SlotPeriod;
  programme_type: string;
  ac_type: ACType;
  auditorium_area: AuditoriumArea;
  waste_cleaning: boolean;
  referred_by: string | null;
  total_amount: number;
  advance_amount: number;
  pending_amount: number;
  status: BookingStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicSlot {
  programme_date: string;
  from_time: string;
  to_time: string;
  slot_period: SlotPeriod;
  status: BookingStatus;
  auditorium_area?: AuditoriumArea;
}

export interface SlotAreaDetails {
  hasGroundFloor: boolean;
  hasFirstFloor: boolean;
  hasFullAuditorium: boolean;
  isFullyBooked: boolean; // hasFullAuditorium || (hasGroundFloor && hasFirstFloor)
  isPartiallyBooked: boolean;
  slots: PublicSlot[];
  groundFloorBlockedByBuffer?: boolean;
  groundFloorAvailableFrom?: string;
  firstFloorBlockedByBuffer?: boolean;
  firstFloorAvailableFrom?: string;
  bothFloorsAvailableFrom?: string;
}

export interface DateAvailability {
  date: string; // YYYY-MM-DD
  hasMorningBooking: boolean;
  hasEveningBooking: boolean;
  morningDetails?: SlotAreaDetails;
  eveningDetails?: SlotAreaDetails;
  morningSlot?: PublicSlot | null;
  eveningSlot?: PublicSlot | null;
  allSlots: PublicSlot[];
  status: 'available' | 'single_slot' | 'fully_booked';
}

export interface ActivityLog {
  id: string;
  booking_id: string;
  action: string;
  admin_email: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface DashboardStats {
  totalBookings: number;
  totalAmount: number;
  totalAdvance: number;
  totalPending: number;
  upcomingBookings: number;
  currentMonthBookings: number;
}
