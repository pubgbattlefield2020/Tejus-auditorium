'use client';

import React, { useState } from 'react';
import { CheckCircle2, DollarSign, Calendar, Clock, User, X, Loader2 } from 'lucide-react';
import { Booking } from '@/types';
import { formatDateReadable, formatTime12Hour } from '@/lib/time-utils';

interface BalancePaidModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (booking: Booking) => Promise<void>;
}

export const BalancePaidModal: React.FC<BalancePaidModalProps> = ({
  booking,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const totalAmount = Number(booking.total_amount) || 0;
  const advanceAmount = Number(booking.advance_amount) || 0;
  const balanceDue = Number(booking.pending_amount ?? (totalAmount - advanceAmount)) || 0;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm(booking);
      onClose();
    } catch (err) {
      console.error('Error confirming balance paid:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => !submitting && onClose()}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-7 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Confirm Balance Payment</h3>
              <p className="text-xs text-slate-500 font-medium">Record final balance settlement</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking Details Card */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 mb-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {booking.booking_id}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {booking.auditorium_area} • {booking.ac_type}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <User className="w-4 h-4 text-slate-400" />
            <span>{booking.customer_name}</span>
            {booking.customer_phone && (
              <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 ml-auto">
                📞 {booking.customer_phone}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium pt-1 border-t border-slate-200/60">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDateReadable(booking.programme_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatTime12Hour(booking.from_time)} – {formatTime12Hour(booking.to_time)} ({booking.slot_period})
            </span>
          </div>
        </div>

        {/* Financial Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Total Contract</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
              ₹ {totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-700 block mb-1">Advance Received</span>
            <span className="text-sm sm:text-base font-bold text-blue-900 font-mono">
              ₹ {advanceAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center ring-2 ring-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">Balance Due</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono">
              ₹ {balanceDue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Informational Prompt */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 mb-6 text-xs text-emerald-950 leading-relaxed">
          <DollarSign className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            Confirming this will mark the full balance of{' '}
            <strong className="font-bold text-emerald-800">₹ {balanceDue.toLocaleString('en-IN')}</strong> as
            received. The pending amount will become <strong className="font-bold">₹0</strong>, and dashboard gross
            collections and receipts will automatically update.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Balance Paid (₹{balanceDue.toLocaleString('en-IN')})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
