import { Booking } from '@/types';
import { formatDateReadable, formatTime12Hour, getTodayISTString } from './time-utils';

export type GoogleSheetSyncAction = 'CREATE' | 'UPDATE' | 'CANCEL' | 'DELETE' | 'RESTORE' | 'PERMANENT_DELETE';

/**
 * Syncs a booking record to Google Sheets via Google Apps Script Webhook.
 * Runs in the background (fire-and-forget) to ensure zero UI delay.
 */
export async function syncBookingToGoogleSheets(
  action: GoogleSheetSyncAction,
  booking: Partial<Booking>
): Promise<boolean> {
  const webhookUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || !booking.booking_id) {
    // If webhook URL is not configured yet, skip quietly
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

    // Send POST request with text/plain or json
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors', // Google Apps Script Web App redirects return opaque responses
    });

    return true;
  } catch (err) {
    console.warn('Google Sheets background sync notice:', err);
    return false;
  }
}

/**
 * Bulk syncs all active and trashed bookings to Google Sheets.
 */
export async function syncAllBookingsToGoogleSheets(bookings: Booking[]): Promise<{ success: boolean; count: number }> {
  const webhookUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    return { success: false, count: 0 };
  }

  let successCount = 0;
  for (const b of bookings) {
    const action = b.deleted_at ? 'DELETE' : b.status === 'Cancelled' ? 'CANCEL' : 'UPDATE';
    const ok = await syncBookingToGoogleSheets(action, b);
    if (ok) successCount++;
    // Small delay between rows to avoid rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  return { success: true, count: successCount };
}
