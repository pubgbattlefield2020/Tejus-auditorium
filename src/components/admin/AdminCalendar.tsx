'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '@/types';
import { getTodayISTString } from '@/lib/time-utils';

interface AdminCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  bookings: Booking[];
  onDateClick: (dateStr: string) => void;
  onEditBooking: (booking: Booking) => void;
  onReceiptClick: (booking: Booking) => void;
  onDeleteBooking: (booking: Booking) => void;
  onOpenDayDrawer: (dateStr: string) => void;
}

export const AdminCalendar: React.FC<AdminCalendarProps> = ({
  currentDate,
  onDateChange,
  bookings,
  onDateClick,
  onOpenDayDrawer,
}) => {
  const todayIST = getTodayISTString();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const [tYear, tMonth] = todayIST.split('-').map(Number);
    onDateChange(new Date(tYear, tMonth - 1, 1));
  };

  // Build Calendar Matrix
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      day,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      day,
      isCurrentMonth: true,
    });
  }

  // Next month leading days
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const dateStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      day,
      isCurrentMonth: false,
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekdayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-4 pb-6">
      {/* Visual Status Legend (Identical to User Calendar) */}
      <div className="glass-card rounded-2xl p-2.5 sm:p-4 mb-3 sm:mb-5 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-[#FBBF24] border border-amber-400 shadow-2xs"></div>
          <span className="font-semibold text-slate-700">Morning / Evening Slot Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-[#EF4444] border border-red-500 shadow-2xs"></div>
          <span className="font-semibold text-slate-700">Full Day Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-white border border-slate-300 shadow-2xs"></div>
          <span className="font-semibold text-slate-700">Available</span>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="glass-card rounded-3xl p-3 sm:p-7 shadow-xl border border-white/80">
        {/* Month Navigation & Title */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
              {monthNames[month]} {year}
            </h2>
            <button
              type="button"
              onClick={handleToday}
              className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {weekdayNames.map((day) => (
            <div key={day} className="text-[10px] sm:text-xs font-bold text-slate-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Dates Grid (Clean Square Cells Matching User Calendar) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
          {calendarDays.map(({ dateStr, day, isCurrentMonth }, index) => {
            const dayBookings = bookings.filter(
              (b) => b.programme_date === dateStr && b.status !== 'Cancelled'
            );
            const isToday = dateStr === todayIST;
            const bookingCount = dayBookings.length;

            // Status Styling
            let bgStyle = 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-2xs';
            if (bookingCount >= 2) {
              bgStyle = 'bg-[#EF4444] hover:bg-[#DC2626] text-white border-transparent shadow-md shadow-red-500/20';
            } else if (bookingCount === 1) {
              bgStyle = 'bg-[#FBBF24] hover:bg-[#F59E0B] text-slate-900 border-amber-400/80 shadow-md shadow-amber-500/20';
            }

            if (!isCurrentMonth) {
              bgStyle = 'bg-slate-50/40 text-slate-300 border-transparent hover:bg-slate-100/40';
            }

            return (
              <button
                key={`${dateStr}-${index}`}
                type="button"
                onClick={() => {
                  if (isCurrentMonth) {
                    onOpenDayDrawer(dateStr);
                  }
                }}
                className={`relative aspect-square sm:aspect-4/3 rounded-xl sm:rounded-2xl border p-1 sm:p-2 flex flex-col items-center justify-center transition-all group cursor-pointer ${bgStyle} ${
                  isToday ? 'ring-2 ring-blue-600 ring-offset-1 sm:ring-offset-2' : ''
                }`}
                title={`${dateStr}: ${bookingCount} bookings. Click to manage.`}
              >
                <span className={`text-xs sm:text-base font-bold ${!isCurrentMonth ? 'text-slate-300' : ''}`}>
                  {day}
                </span>

                {/* Sub-label for desktop */}
                {isCurrentMonth && bookingCount === 1 && (
                  <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-90">
                    {dayBookings[0]?.slot_period || '1 Slot'}
                  </span>
                )}
                {isCurrentMonth && bookingCount >= 2 && (
                  <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-90">
                    Full
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Jump to Today Button on Mobile */}
        <div className="mt-3.5 sm:hidden flex justify-center">
          <button
            type="button"
            onClick={handleToday}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-200 cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            Jump to Today
          </button>
        </div>
      </div>
    </div>
  );
};
