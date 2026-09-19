'use client';

import React from 'react';
import { X, Plus, Edit, FileText, Trash2, Calendar, Clock, User, Phone, DollarSign } from 'lucide-react';
import { Booking } from '@/types';
import { formatDateReadable, formatTime12Hour } from '@/lib/time-utils';

interface AdminDayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  bookings: Booking[];
  onAddBooking: (dateStr: string) => void;
  onEditBooking: (booking: Booking) => void;
  onReceiptClick: (booking: Booking) => void;
  onDeleteBooking: (booking: Booking) => void;
}

export const AdminDayDrawer: React.FC<AdminDayDrawerProps> = ({
  isOpen,
  onClose,
  dateStr,
  bookings,
  onAddBooking,
  onEditBooking,
  onReceiptClick,
  onDeleteBooking,
}) => {
  if (!isOpen || !dateStr) return null;

  const dayBookings = bookings.filter((b) => b.programme_date === dateStr && b.status !== 'Cancelled');
  const canAddMore = dayBookings.length < 2;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" />

      {/* Drawer Card */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-7 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{formatDateReadable(dateStr)}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {dayBookings.length} {dayBookings.length === 1 ? 'Booking' : 'Bookings'} Scheduled
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bookings List */}
        <div className="space-y-3 mb-5">
          {dayBookings.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600">No bookings on this date</p>
              <p className="text-xs text-slate-400 mt-0.5">Slots are completely available.</p>
            </div>
          ) : (
            dayBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs space-y-3"
              >
                {/* Top Info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {b.booking_id}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{b.customer_name}</span>
                    </div>

                    {/* Customer Mobile Number */}
                    {b.customer_phone && (
                      <div className="mt-1">
                        <a
                          href={`tel:${b.customer_phone}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{b.customer_phone}</span>
                        </a>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 font-medium mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTime12Hour(b.from_time)} – {formatTime12Hour(b.to_time)}
                      </span>
                      <span className="font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-full text-[10px]">
                        {b.slot_period} Slot
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          b.auditorium_area === 'Full Auditorium'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : b.auditorium_area === '1st Floor'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}
                      >
                        {b.auditorium_area}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Event: <span className="font-semibold text-slate-800">{b.programme_type}</span> ({b.ac_type})
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      Total: ₹{Number(b.total_amount).toLocaleString('en-IN')}{' '}
                      <span className="font-semibold text-amber-700 font-mono">
                        (Pending: ₹{Number(b.pending_amount).toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      b.status === 'Confirmed'
                        ? 'bg-blue-100 text-blue-800'
                        : b.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {/* Big Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => {
                      onEditBooking(b);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      onReceiptClick(b);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Receipt</span>
                  </button>

                  <button
                    onClick={() => {
                      onDeleteBooking(b);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Trash</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>

          {canAddMore ? (
            <button
              onClick={() => {
                onAddBooking(dateStr);
                onClose();
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Booking on this Date</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
              Fully Booked (All Areas Reserved)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
