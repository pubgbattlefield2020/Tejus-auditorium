'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, Edit } from 'lucide-react';
import { Booking } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatDateReadable, formatTime12Hour, hasBookingConflict } from '@/lib/time-utils';
import { syncBookingToGoogleSheets } from '@/lib/google-sheets';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
  onEditBooking: (booking: Booking) => void;
  adminEmail?: string;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
  onEditBooking,
  adminEmail = 'admin@tejusauditorium.com',
}) => {
  const [deletedBookings, setDeletedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDeleted = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedBookings((data as Booking[]) || []);
    } catch (err: any) {
      console.error('Error loading trash:', err);
      setErrorMessage(err.message || 'Failed to load deleted bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDeleted();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleRestore = async (booking: Booking) => {
    setActionLoadingId(booking.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Check for conflict with active bookings on that date
      const { data: activeOnDate, error: activeErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('programme_date', booking.programme_date)
        .is('deleted_at', null)
        .neq('status', 'Cancelled');

      if (activeErr) throw activeErr;

      // Validate 1-hour buffer and overlaps
      for (const active of activeOnDate || []) {
        const conflict = hasBookingConflict(
          booking.from_time,
          booking.to_time,
          active.from_time,
          active.to_time
        );
        if (conflict.hasConflict) {
          setErrorMessage(
            `This booking cannot be restored because its timing (${formatTime12Hour(booking.from_time)} – ${formatTime12Hour(booking.to_time)}) conflicts with active booking ${active.booking_id} (${formatTime12Hour(active.from_time)} – ${formatTime12Hour(active.to_time)}) on ${formatDateReadable(booking.programme_date)}. Please edit the timing first.`
          );
          setActionLoadingId(null);
          return;
        }
      }

      // 2. Perform restore
      const { error: restoreErr } = await supabase
        .from('bookings')
        .update({ deleted_at: null, status: 'Confirmed' })
        .eq('id', booking.id);

      if (restoreErr) throw restoreErr;

      // 3. Log activity
      await supabase.from('activity_logs').insert({
        booking_id: booking.booking_id,
        action: 'RESTORE',
        admin_email: adminEmail,
        details: {
          customer_name: booking.customer_name,
          programme_date: booking.programme_date,
        },
      });

      // Google Sheets sync
      syncBookingToGoogleSheets('RESTORE', { ...booking, status: 'Confirmed', deleted_at: null });

      setSuccessMessage(`Booking ${booking.booking_id} restored successfully.`);
      fetchDeleted();
      onRestoreSuccess();
    } catch (err: any) {
      console.error('Restore error:', err);
      setErrorMessage(err.message || 'Failed to restore booking due to database validation conflict.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePermanentDelete = async (booking: Booking) => {
    const confirmDelete = window.confirm(
      `Permanently delete booking ${booking.booking_id} (${booking.customer_name})? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setActionLoadingId(booking.id);
    setErrorMessage(null);

    try {
      // 1. Delete record
      const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
      if (error) throw error;

      // 2. Log activity
      await supabase.from('activity_logs').insert({
        booking_id: booking.booking_id,
        action: 'PERMANENT_DELETE',
        admin_email: adminEmail,
        details: {
          customer_name: booking.customer_name,
          programme_date: booking.programme_date,
          total_amount: booking.total_amount,
        },
      });

      // Google Sheets sync
      syncBookingToGoogleSheets('PERMANENT_DELETE', booking);

      setSuccessMessage(`Booking ${booking.booking_id} permanently deleted.`);
      fetchDeleted();
      onRestoreSuccess();
    } catch (err: any) {
      console.error('Permanent delete error:', err);
      setErrorMessage(err.message || 'Failed to permanently delete booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-8 max-h-[90vh] overflow-y-auto z-10 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Trash Management</h3>
              <p className="text-xs text-slate-500 font-medium">Recoverable deleted bookings ({deletedBookings.length})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2.5 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-xs font-semibold">Loading trash items...</span>
          </div>
        ) : deletedBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Trash2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-slate-600">Trash is empty</p>
            <p className="text-xs text-slate-400 mt-0.5">No deleted bookings found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deletedBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {b.booking_id}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{b.customer_name}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>📅 {formatDateReadable(b.programme_date)}</span>
                    <span>⏰ {formatTime12Hour(b.from_time)} – {formatTime12Hour(b.to_time)}</span>
                    <span>💰 ₹ {Number(b.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Edit Timing button if needed */}
                  <button
                    onClick={() => {
                      onEditBooking(b);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors"
                    title="Edit booking"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {/* Restore Button */}
                  <button
                    disabled={actionLoadingId === b.id}
                    onClick={() => handleRestore(b)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60"
                  >
                    {actionLoadingId === b.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Restore</span>
                  </button>

                  {/* Permanent Delete Button */}
                  <button
                    disabled={actionLoadingId === b.id}
                    onClick={() => handlePermanentDelete(b)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Close Trash
          </button>
        </div>
      </div>
    </div>
  );
};
