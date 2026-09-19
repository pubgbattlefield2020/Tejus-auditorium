'use client';

import React, { useEffect, useRef } from 'react';
import { X, Calendar, Clock, Phone, MessageCircle, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { DateAvailability } from '@/types';
import { formatDateReadable, formatTime12Hour } from '@/lib/time-utils';
import gsap from 'gsap';

interface DateDetailsModalProps {
  dateInfo: DateAvailability | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DateDetailsModal: React.FC<DateDetailsModalProps> = ({
  dateInfo,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current && backdropRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalRef.current,
        { scale: 0.95, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' }
      );
    }
  }, [isOpen]);

  if (!isOpen || !dateInfo) return null;

  const formattedDate = formatDateReadable(dateInfo.date);
  const isFullyBooked = dateInfo.status === 'fully_booked';
  const isAvailable = dateInfo.status === 'available';
  const isPartiallyBooked = dateInfo.status === 'single_slot';

  const whatsappMessage = encodeURIComponent(
    `Hello, I would like to enquire about booking Tejus Auditorium for the date: ${formattedDate}.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 overflow-hidden z-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Date Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{formattedDate}</h3>
            <p className="text-xs text-slate-500 font-medium">Auditorium Slot Availability</p>
          </div>
        </div>

        {/* Status Indicator Banner */}
        <div
          className={`p-3.5 rounded-2xl mb-6 flex items-center gap-3 ${
            isAvailable
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : isFullyBooked
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {isAvailable ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : isFullyBooked ? (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div className="text-xs font-semibold">
            {isAvailable && 'Full Day Available for Booking'}
            {isFullyBooked && 'Fully Booked for this Date'}
            {isPartiallyBooked && 'Partially Booked — Slot / Floor Available'}
          </div>
        </div>

        {/* Slots Breakdown */}
        <div className="space-y-3 mb-6">
          {/* Morning Slot */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Morning Slot</span>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <Clock className="w-4 h-4 text-slate-400" />
                {dateInfo.morningSlot ? (
                  <span>
                    {formatTime12Hour(dateInfo.morningSlot.from_time)} – {formatTime12Hour(dateInfo.morningSlot.to_time)}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium">9:00 AM – 1:00 PM</span>
                )}
              </div>
              {/* Floor Status Description */}
              <div className="text-[11px] font-medium text-slate-600 mt-1">
                {dateInfo.morningDetails?.isFullyBooked ? (
                  <span className="text-rose-600 font-semibold">Both Floors Booked</span>
                ) : dateInfo.morningDetails?.hasGroundFloor ? (
                  <span>Ground Floor Booked • <strong className="text-emerald-700">1st Floor Available</strong></span>
                ) : dateInfo.morningDetails?.hasFirstFloor ? (
                  <span>1st Floor Booked • <strong className="text-emerald-700">Ground Floor Available</strong></span>
                ) : (
                  <span className="text-emerald-600">Full Slot Available (Ground & 1st Floor)</span>
                )}
              </div>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold shrink-0 ${
                dateInfo.morningDetails?.isFullyBooked
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : dateInfo.morningDetails?.isPartiallyBooked
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {dateInfo.morningDetails?.isFullyBooked
                ? 'Full'
                : dateInfo.morningDetails?.isPartiallyBooked
                ? 'Partial'
                : 'Available'}
            </span>
          </div>

          {/* Evening Slot */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Evening Slot</span>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <Clock className="w-4 h-4 text-slate-400" />
                {dateInfo.eveningSlot ? (
                  <span>
                    {formatTime12Hour(dateInfo.eveningSlot.from_time)} – {formatTime12Hour(dateInfo.eveningSlot.to_time)}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium">3:00 PM – 7:00 PM</span>
                )}
              </div>
              {/* Floor Status Description */}
              <div className="text-[11px] font-medium text-slate-600 mt-1">
                {dateInfo.eveningDetails?.isFullyBooked ? (
                  <span className="text-rose-600 font-semibold">Both Floors Booked</span>
                ) : dateInfo.eveningDetails?.hasGroundFloor ? (
                  <span>Ground Floor Booked • <strong className="text-emerald-700">1st Floor Available</strong></span>
                ) : dateInfo.eveningDetails?.hasFirstFloor ? (
                  <span>1st Floor Booked • <strong className="text-emerald-700">Ground Floor Available</strong></span>
                ) : (
                  <span className="text-emerald-600">Full Slot Available (Ground & 1st Floor)</span>
                )}
              </div>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold shrink-0 ${
                dateInfo.eveningDetails?.isFullyBooked
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : dateInfo.eveningDetails?.isPartiallyBooked
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {dateInfo.eveningDetails?.isFullyBooked
                ? 'Full'
                : dateInfo.eveningDetails?.isPartiallyBooked
                ? 'Partial'
                : 'Available'}
            </span>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center mb-3">
            To reserve or enquire about auditorium dates, please contact the administrator:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href="tel:9447241559"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Call Admin</span>
            </a>
            <a
              href={`https://wa.me/919447241559?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
