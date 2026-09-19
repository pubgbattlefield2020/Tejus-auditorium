'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Phone, Headphones, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PublicSlot, DateAvailability } from '@/types';
import { DateDetailsModal } from './DateDetailsModal';
import { getTodayISTString } from '@/lib/time-utils';

interface PublicCalendarProps {
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

export const PublicCalendar: React.FC<PublicCalendarProps> = ({
  currentDate: externalDate,
  onDateChange,
}) => {
  const [todayDate, setTodayDate] = useState<string>(getTodayISTString);
  const [internalDate, setInternalDate] = useState(() => {
    const [year, month] = getTodayISTString().split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  // Keep today's date dynamically synced on mount
  useEffect(() => {
    const currentToday = getTodayISTString();
    setTodayDate(currentToday);
  }, []);

  const currentDate = externalDate || internalDate;
  const setDate = onDateChange || setInternalDate;

  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateAvailability | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch month availability
  const fetchMonthData = useCallback(async () => {
    setLoading(true);
    try {
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      const toYMD = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const startDateStr = toYMD(new Date(year, month, 1 - firstDayOfMonth.getDay()));
      const endDateStr = toYMD(new Date(year, month, lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay())));

      const { data, error } = await supabase.rpc('get_public_calendar', {
        p_start_date: startDateStr,
        p_end_date: endDateStr,
      });

      if (error) {
        console.error('Error fetching calendar data:', error);
      } else {
        setSlots(data || []);
      }
    } catch (err) {
      console.error('Calendar load error:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  // Navigate months
  const handlePrevMonth = () => {
    setDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const currentToday = getTodayISTString();
    setTodayDate(currentToday);
    const [tYear, tMonth] = currentToday.split('-').map(Number);
    setDate(new Date(tYear, tMonth - 1, 1));
  };

  // Build calendar matrix
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

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

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      day,
      isCurrentMonth: true,
    });
  }

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

  const getDateAvailability = (dateStr: string): DateAvailability => {
    const daySlots = slots.filter((s) => s.programme_date === dateStr);
    const morningSlots = daySlots.filter((s) => s.slot_period === 'Morning');
    const eveningSlots = daySlots.filter((s) => s.slot_period === 'Evening');

    const isMorningFull =
      morningSlots.some((s) => s.auditorium_area === 'Full Auditorium') ||
      (morningSlots.some((s) => s.auditorium_area === 'Ground Floor') &&
        morningSlots.some((s) => s.auditorium_area === '1st Floor'));

    const isEveningFull =
      eveningSlots.some((s) => s.auditorium_area === 'Full Auditorium') ||
      (eveningSlots.some((s) => s.auditorium_area === 'Ground Floor') &&
        eveningSlots.some((s) => s.auditorium_area === '1st Floor'));

    let status: 'available' | 'single_slot' | 'fully_booked' = 'available';
    if (daySlots.length >= 2) {
      status = 'fully_booked';
    } else if (daySlots.length === 1) {
      status = 'single_slot';
    }

    const morningDetails = {
      hasGroundFloor: morningSlots.some((s) => s.auditorium_area === 'Ground Floor'),
      hasFirstFloor: morningSlots.some((s) => s.auditorium_area === '1st Floor'),
      hasFullAuditorium: morningSlots.some((s) => s.auditorium_area === 'Full Auditorium'),
      isFullyBooked: isMorningFull,
      isPartiallyBooked: morningSlots.length > 0 && !isMorningFull,
      slots: morningSlots,
    };

    const eveningDetails = {
      hasGroundFloor: eveningSlots.some((s) => s.auditorium_area === 'Ground Floor'),
      hasFirstFloor: eveningSlots.some((s) => s.auditorium_area === '1st Floor'),
      hasFullAuditorium: eveningSlots.some((s) => s.auditorium_area === 'Full Auditorium'),
      isFullyBooked: isEveningFull,
      isPartiallyBooked: eveningSlots.length > 0 && !isEveningFull,
      slots: eveningSlots,
    };

    return {
      date: dateStr,
      hasMorningBooking: morningSlots.length > 0,
      hasEveningBooking: eveningSlots.length > 0,
      morningDetails,
      eveningDetails,
      morningSlot: morningSlots[0] || null,
      eveningSlot: eveningSlots[0] || null,
      allSlots: daySlots,
      status,
    };
  };

  const handleDateClick = (dateStr: string) => {
    const info = getDateAvailability(dateStr);
    setSelectedDateInfo(info);
    setIsModalOpen(true);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekdayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-6 py-2.5 sm:py-6">
      {/* Visual Status Legend */}
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
              onClick={handleToday}
              className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          <button
            onClick={handleNextMonth}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid Table */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs rounded-2xl z-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {weekdayNames.map((day) => (
              <div key={day} className="text-[10px] sm:text-xs font-bold text-slate-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
            {calendarDays.map(({ dateStr, day, isCurrentMonth }, index) => {
              const availability = getDateAvailability(dateStr);
              const isToday = dateStr === todayDate;

              // Color styles based on status
              let bgStyle = 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-2xs';
              if (availability.status === 'fully_booked') {
                bgStyle = 'bg-[#EF4444] hover:bg-[#DC2626] text-white border-transparent shadow-md shadow-red-500/20';
              } else if (availability.status === 'single_slot') {
                bgStyle = 'bg-[#FBBF24] hover:bg-[#F59E0B] text-slate-900 border-amber-400/80 shadow-md shadow-amber-500/20';
              }

              if (!isCurrentMonth) {
                bgStyle = 'bg-slate-50/40 text-slate-300 border-transparent hover:bg-slate-100/40';
              }

              return (
                <button
                  key={`${dateStr}-${index}`}
                  onClick={() => handleDateClick(dateStr)}
                  className={`relative aspect-square sm:aspect-4/3 rounded-xl sm:rounded-2xl border p-1 sm:p-2 flex flex-col items-center justify-center transition-all group cursor-pointer ${bgStyle} ${
                    isToday ? 'ring-2 ring-blue-600 ring-offset-1 sm:ring-offset-2' : ''
                  }`}
                >
                  <span className={`text-xs sm:text-base font-bold ${!isCurrentMonth ? 'text-slate-300' : ''}`}>
                    {day}
                  </span>

                  {/* Indicator for desktop */}
                  {isCurrentMonth && availability.status === 'single_slot' && (
                    <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-90">
                      {availability.morningDetails?.isFullyBooked
                        ? 'Morning'
                        : availability.eveningDetails?.isFullyBooked
                        ? 'Evening'
                        : 'Partial'}
                    </span>
                  )}
                  {isCurrentMonth && availability.status === 'fully_booked' && (
                    <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-90">
                      Booked
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Today Quick Action on Mobile */}
        <div className="mt-3.5 sm:hidden flex justify-center">
          <button
            onClick={handleToday}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-200 cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            Jump to Today
          </button>
        </div>
      </div>

      {/* Need Help Card */}
      <div className="mt-4 sm:mt-6 glass-card rounded-2xl p-3.5 sm:p-5 flex items-center justify-between gap-3 border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
            <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Need Help?</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">For auditorium bookings, contact admin.</p>
          </div>
        </div>

        <a
          href="tel:9447241559"
          className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call Admin</span>
        </a>
      </div>

      {/* Public Date Details Modal */}
      <DateDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dateInfo={selectedDateInfo}
      />
    </div>
  );
};
