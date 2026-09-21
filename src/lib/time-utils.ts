import { SlotPeriod, AuditoriumArea, PublicSlot, SlotAreaDetails, DateAvailability } from '@/types';

/**
 * Converts HH:mm or HH:mm:ss string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to HH:mm string (24-hour for internal DB format)
 */
export function minutesToTimeString(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, minutes));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Converts 12-hour components (hour 1-12, minute, 'AM'|'PM') to 24-hour HH:mm
 */
export function convert12to24(hour12: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour12 % 12;
  if (ampm === 'PM') h += 12;
  return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Converts 24-hour HH:mm to 12-hour components
 */
export function convert24to12(time24: string): { hour: number; minute: number; ampm: 'AM' | 'PM' } {
  if (!time24) return { hour: 9, minute: 0, ampm: 'AM' };
  const parts = time24.split(':');
  let h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return { hour: h, minute: m, ampm };
}

/**
 * Formats time string (HH:mm or HH:mm:ss) into 12-hour format (e.g. 10:00 AM)
 */
export function formatTime12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Determines Slot Period based on Programme Start Time:
 * If start time is before 1:00 PM (13:00), it's Morning.
 * If 1:00 PM (13:00) or later, it's Evening.
 */
export function getSlotPeriodFromTime(fromTime: string): SlotPeriod {
  const minutes = timeToMinutes(fromTime);
  // 13:00 = 780 minutes
  return minutes < 780 ? 'Morning' : 'Evening';
}

/**
 * Formats YYYY-MM-DD to readable date string (e.g., "15 August 2026")
 */
export function formatDateReadable(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats YYYY-MM-DD to short date string (e.g., "15 Aug 2026")
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Gets today's current date in YYYY-MM-DD format (IST timezone aware)
 */
export function getTodayISTString(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.error('Error formatting IST date:', e);
  }

  // Fallback
  const now = new Date();
  const d = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Checks if two auditorium areas conflict with each other.
 * - 'Full Auditorium' conflicts with ANY area ('Ground Floor', '1st Floor', 'Full Auditorium').
 * - Same area conflicts with itself.
 * - 'Ground Floor' and '1st Floor' DO NOT conflict with each other.
 */
export function doAreasConflict(
  area1?: AuditoriumArea | string,
  area2?: AuditoriumArea | string
): boolean {
  if (!area1 || !area2) return true;
  if (area1 === 'Full Auditorium' || area2 === 'Full Auditorium') return true;
  return area1 === area2;
}

/**
 * Checks if a proposed booking time and area conflicts with an existing booking,
 * enforcing area compatibility, direct overlap checks, and the mandatory 1-hour (60 minute) buffer.
 */
export function hasBookingConflict(
  proposedFrom: string,
  proposedTo: string,
  existingFrom: string,
  existingTo: string,
  proposedArea?: AuditoriumArea | string,
  existingArea?: AuditoriumArea | string
): { hasConflict: boolean; reason?: string } {
  // If areas do not conflict (e.g. Ground Floor vs 1st Floor), no conflict!
  if (proposedArea && existingArea && !doAreasConflict(proposedArea, existingArea)) {
    return { hasConflict: false };
  }

  const propStart = timeToMinutes(proposedFrom);
  const propEnd = timeToMinutes(proposedTo);
  const existStart = timeToMinutes(existingFrom);
  const existEnd = timeToMinutes(existingTo);

  if (propStart >= propEnd) {
    return {
      hasConflict: true,
      reason: 'Start time must be strictly before end time.',
    };
  }

  const areaNote = existingArea ? ` (${existingArea})` : '';

  // Direct Overlap check
  const isOverlapping = propStart < existEnd && propEnd > existStart;
  if (isOverlapping) {
    return {
      hasConflict: true,
      reason: `Direct overlap with existing booking${areaNote} (${formatTime12Hour(existingFrom)} – ${formatTime12Hour(existingTo)}).`,
    };
  }

  // 1-Hour Buffer check (60 minutes)
  const bufferMs = 60;
  const violatesBuffer = propStart < existEnd + bufferMs && propEnd + bufferMs > existStart;

  if (violatesBuffer) {
    if (propStart >= existEnd && propStart < existEnd + bufferMs) {
      const nextAllowed = minutesToTimeString(existEnd + bufferMs);
      return {
        hasConflict: true,
        reason: `Mandatory 1-hour buffer required after existing booking${areaNote}. Booking can start at or after ${formatTime12Hour(nextAllowed)}.`,
      };
    }
    if (propEnd <= existStart && propEnd + bufferMs > existStart) {
      const maxAllowedEnd = minutesToTimeString(existStart - bufferMs);
      return {
        hasConflict: true,
        reason: `Mandatory 1-hour buffer required before existing booking${areaNote}. Booking must end at or before ${formatTime12Hour(maxAllowedEnd)}.`,
      };
    }
    return {
      hasConflict: true,
      reason: `Mandatory 1-hour buffer between bookings${areaNote} is violated.`,
    };
  }

  return { hasConflict: false };
}

/**
 * Analyzes availability for a given date given existing bookings and proposed area
 */
export function getAvailabilityConflictPreview(
  dateStr: string,
  fromTime: string,
  toTime: string,
  existingBookings: Array<{ id?: string; from_time: string; to_time: string; customer_name?: string; auditorium_area?: AuditoriumArea | string }>,
  excludeBookingId?: string,
  proposedArea?: AuditoriumArea | string
): {
  isValid: boolean;
  message?: string;
  existingSlots: Array<{ from: string; to: string; bufferTo: string; customer?: string; area?: string }>;
  suggestedNextAvailable?: string;
} {
  const filtered = existingBookings.filter((b) => !excludeBookingId || b.id !== excludeBookingId);

  const existingSlots = filtered.map((b) => {
    const endMinutes = timeToMinutes(b.to_time);
    const bufferEnd = minutesToTimeString(Math.min(1439, endMinutes + 60));
    return {
      from: formatTime12Hour(b.from_time),
      to: formatTime12Hour(b.to_time),
      bufferTo: formatTime12Hour(bufferEnd),
      customer: b.customer_name,
      area: b.auditorium_area,
    };
  });

  if (!fromTime || !toTime) {
    return {
      isValid: false,
      message: 'Please select both start time and end time.',
      existingSlots,
    };
  }

  if (timeToMinutes(fromTime) >= timeToMinutes(toTime)) {
    return {
      isValid: false,
      message: 'Start time must be before End time.',
      existingSlots,
    };
  }

  for (const b of filtered) {
    const conflict = hasBookingConflict(fromTime, toTime, b.from_time, b.to_time, proposedArea, b.auditorium_area);
    if (conflict.hasConflict) {
      const existEnd = timeToMinutes(b.to_time);
      const nextAvail = minutesToTimeString(Math.min(1439, existEnd + 60));
      return {
        isValid: false,
        message: conflict.reason,
        existingSlots,
        suggestedNextAvailable: formatTime12Hour(nextAvail),
      };
    }
  }

  return {
    isValid: true,
    existingSlots,
  };
}

/**
 * Validates Indian 10-digit mobile number format (starts with 6-9, optionally with +91)
 */
export function isValidIndianMobile(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return true;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91') && /^[6-9]\d{9}$/.test(cleaned.slice(2))) {
    return true;
  }
  return false;
}

/**
 * Cleans and formats phone number
 */
export function cleanMobileNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d\+]/g, '');
}

/**
 * Accurately calculates availability for a specific date given the list of public slots,
 * taking into account floor combinations and mandatory 1-hour buffers that cross slot boundaries.
 */
export function calculateDateAvailability(dateStr: string, slots: PublicSlot[]): DateAvailability {
  const daySlots = slots.filter((s) => s.programme_date === dateStr);
  const morningSlots = daySlots.filter((s) => s.slot_period === 'Morning');
  const eveningSlots = daySlots.filter((s) => s.slot_period === 'Evening');

  // Direct Morning bookings
  const morningHasGround = morningSlots.some((s) => s.auditorium_area === 'Ground Floor');
  const morningHasFirst = morningSlots.some((s) => s.auditorium_area === '1st Floor');
  const morningHasFull = morningSlots.some((s) => s.auditorium_area === 'Full Auditorium');
  const isMorningFull = morningHasFull || (morningHasGround && morningHasFirst);

  // Direct Evening bookings
  let eveningHasGround = eveningSlots.some((s) => s.auditorium_area === 'Ground Floor');
  let eveningHasFirst = eveningSlots.some((s) => s.auditorium_area === '1st Floor');
  let eveningHasFull = eveningSlots.some((s) => s.auditorium_area === 'Full Auditorium');

  // Buffer spillage from Morning into Evening (standard evening slot starts at 15:00 / 3:00 PM)
  const bufferMinutes = 60;
  const eveningStandardStart = 900; // 15:00 in minutes
  const eveningStandardEnd = 1140; // 19:00 in minutes

  let groundFloorBlockedByBuffer = false;
  let groundFloorAvailableFrom: string | undefined = undefined;
  let firstFloorBlockedByBuffer = false;
  let firstFloorAvailableFrom: string | undefined = undefined;

  for (const b of morningSlots) {
    const bEnd = timeToMinutes(b.to_time);
    const bBufferEnd = bEnd + bufferMinutes;

    // If booking runs through the entire evening window (ends at or after 19:00)
    if (bEnd >= eveningStandardEnd) {
      if (b.auditorium_area === 'Full Auditorium') {
        eveningHasFull = true;
      } else if (b.auditorium_area === 'Ground Floor') {
        eveningHasGround = true;
      } else if (b.auditorium_area === '1st Floor') {
        eveningHasFirst = true;
      }
      continue;
    }

    // If buffer pushes past 15:00
    if (bBufferEnd > eveningStandardStart) {
      const availTimeStr = formatTime12Hour(minutesToTimeString(bBufferEnd));
      if (doAreasConflict('Ground Floor', b.auditorium_area) && !eveningHasGround && !eveningHasFull) {
        groundFloorBlockedByBuffer = true;
        groundFloorAvailableFrom = availTimeStr;
      }
      if (doAreasConflict('1st Floor', b.auditorium_area) && !eveningHasFirst && !eveningHasFull) {
        firstFloorBlockedByBuffer = true;
        firstFloorAvailableFrom = availTimeStr;
      }
    }
  }

  const isEveningFull = eveningHasFull || (eveningHasGround && eveningHasFirst);
  const bothFloorsBlockedByBuffer = groundFloorBlockedByBuffer && firstFloorBlockedByBuffer;
  const bothFloorsAvailableFrom = bothFloorsBlockedByBuffer ? groundFloorAvailableFrom : undefined;

  const isEveningPartiallyBooked =
    !isEveningFull &&
    (eveningSlots.length > 0 || groundFloorBlockedByBuffer || firstFloorBlockedByBuffer);

  const morningDetails: SlotAreaDetails = {
    hasGroundFloor: morningHasGround,
    hasFirstFloor: morningHasFirst,
    hasFullAuditorium: morningHasFull,
    isFullyBooked: isMorningFull,
    isPartiallyBooked: morningSlots.length > 0 && !isMorningFull,
    slots: morningSlots,
  };

  const eveningDetails: SlotAreaDetails = {
    hasGroundFloor: eveningHasGround,
    hasFirstFloor: eveningHasFirst,
    hasFullAuditorium: eveningHasFull,
    isFullyBooked: isEveningFull,
    isPartiallyBooked: isEveningPartiallyBooked,
    slots: eveningSlots,
    groundFloorBlockedByBuffer,
    groundFloorAvailableFrom,
    firstFloorBlockedByBuffer,
    firstFloorAvailableFrom,
    bothFloorsAvailableFrom,
  };

  const isDayFullyBooked = isMorningFull && isEveningFull;
  const isDayPartiallyBooked =
    !isDayFullyBooked &&
    (daySlots.length > 0 || morningDetails.isPartiallyBooked || eveningDetails.isPartiallyBooked);

  let status: 'available' | 'single_slot' | 'fully_booked' = 'available';
  if (isDayFullyBooked) {
    status = 'fully_booked';
  } else if (isDayPartiallyBooked) {
    status = 'single_slot';
  }

  return {
    date: dateStr,
    hasMorningBooking: morningSlots.length > 0,
    hasEveningBooking: eveningSlots.length > 0 || eveningHasGround || eveningHasFirst || eveningHasFull,
    morningDetails,
    eveningDetails,
    morningSlot: morningSlots[0] || null,
    eveningSlot: eveningSlots[0] || null,
    allSlots: daySlots,
    status,
  };
}

