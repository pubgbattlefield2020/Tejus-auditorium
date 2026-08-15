import { Booking } from '@/types';
import { formatDateReadable, formatTime12Hour, getTodayISTString } from './time-utils';

export type GoogleSheetSyncAction = 'CREATE' | 'UPDATE' | 'CANCEL' | 'DELETE' | 'RESTORE' | 'PERMANENT_DELETE';

/**
 * Syncs a booking record to Google Sheets via server-side API route.
 * Runs in the background (fire-and-forget) with zero UI lag.
 */
export async function syncBookingToGoogleSheets(
  action: GoogleSheetSyncAction,
  booking: Partial<Booking>
): Promise<boolean> {
  if (!booking.booking_id) {
    return false;
  }

  try {
    const fromFormatted = booking.from_time ? formatTime12Hour(booking.from_time.slice(0, 5)) : '';
    const toFormatted = booking.to_time ? formatTime12Hour(booking.to_time.slice(0, 5)) : '';
    const timeSlotStr = fromFormatted && toFormatted ? `${fromFormatted} – ${toFormatted}` : '';

    let statusDisplay = booking.status || 'Confirmed';
    if (action === 'DELETE') {
      statusDisplay = 'Deleted (Trash)';
    } else if (action === 'PERMANENT_DELETE') {
      statusDisplay = 'Permanently Deleted';
    } else if (action === 'CANCEL') {
      statusDisplay = 'Cancelled';
    } else if (action === 'RESTORE') {
      statusDisplay = 'Confirmed';
    }

    const payload = {
      action,
      booking_id: booking.booking_id,
      receipt_no: booking.receipt_no || `RC-${booking.booking_id.replace('TA-', '')}`,
      customer_name: booking.customer_name || '—',
      customer_phone: booking.customer_phone || '—',
      customer_address: booking.customer_address || '—',
      programme_date: booking.programme_date || '—',
      timings: timeSlotStr || '—',
      slot_period: booking.slot_period || '—',
      programme_type: booking.programme_type || '—',
      auditorium_area: booking.auditorium_area || 'Full Auditorium',
      ac_type: booking.ac_type || 'AC',
      waste_cleaning: booking.waste_cleaning || 'Yes',
      referred_by: booking.referred_by || '—',
      total_amount: Number(booking.total_amount || 0),
      advance_amount: Number(booking.advance_amount || 0),
      pending_amount: Number(booking.pending_amount || (Number(booking.total_amount || 0) - Number(booking.advance_amount || 0))),
      status: statusDisplay,
      booking_date: booking.booking_date || getTodayISTString(),
      last_updated_ist: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };

    // Primary: Call local Next.js server proxy
    const res = await fetch('/api/sync-sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.warn('Google Sheets background sync notice:', err);
    return false;
  }
}

/**
 * Bulk syncs all active and trashed bookings to Google Sheets.
 */
export async function syncAllBookingsToGoogleSheets(bookings: Booking[]): Promise<{ success: boolean; count: number }> {
  let successCount = 0;
  for (const b of bookings) {
    const action = b.deleted_at ? 'DELETE' : b.status === 'Cancelled' ? 'CANCEL' : 'UPDATE';
    const ok = await syncBookingToGoogleSheets(action, b);
    if (ok) successCount++;
    // Small delay between rows to avoid rate limits
    await new Promise((r) => setTimeout(r, 150));
  }

  return { success: successCount > 0, count: successCount };
}
