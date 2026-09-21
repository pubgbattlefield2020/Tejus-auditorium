'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PublicSlot, DateAvailability, Booking } from '@/types';
import { DateDetailsModal } from './DateDetailsModal';
import { AdminDayDrawer } from '@/components/admin/AdminDayDrawer';
import { getTodayISTString, calculateDateAvailability } from '@/lib/time-utils';

interface YearlyCalendarProps {
  isAdmin?: boolean;
  onMonthClick?: (year: number, monthIndex: number) => void;
  onAdminEditBooking?: (booking: Booking) => void;
  onAdminReceiptClick?: (booking: Booking) => void;
  onAdminDeleteBooking?: (booking: Booking) => void;
  onAdminAddBooking?: (dateStr: string) => void;
}

export const YearlyCalendar: React.FC<YearlyCalendarProps> = ({
  isAdmin = false,
  onMonthClick,
  onAdminEditBooking,
  onAdminReceiptClick,
  onAdminDeleteBooking,
  onAdminAddBooking,
}) => {
  const [todayDate, setTodayDate] = useState<string>(getTodayISTString);
  const [year, setYear] = useState<number>(() => {
    return parseInt(getTodayISTString().split('-')[0], 10);
  });
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [adminBookings, setAdminBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync today's date upon mount
  useEffect(() => {
    const liveToday = getTodayISTString();
    setTodayDate(liveToday);
  }, []);

  // Modal / Drawer state
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateAvailability | null>(null);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState<boolean>(false);
  const [selectedAdminDate, setSelectedAdminDate] = useState<string>('');
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState<boolean>(false);

  const fetchYearData = useCallback(async () => {
    setLoading(true);
    try {
      const startDateStr = `${year}-01-01`;
      const endDateStr = `${year}-12-31`;

      if (isAdmin) {
        // Fetch full bookings for admin
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .gte('programme_date', startDateStr)
          .lte('programme_date', endDateStr)
          .is('deleted_at', null)
          .neq('status', 'Cancelled');

        if (!error && data) {
          setAdminBookings(data as Booking[]);
          // Map to slots
          const mappedSlots: PublicSlot[] = data.map((b: any) => ({
            programme_date: b.programme_date,
            from_time: b.from_time,
            to_time: b.to_time,
            slot_period: b.slot_period,
            status: b.status,
            auditorium_area: b.auditorium_area,
          }));
          setSlots(mappedSlots);
        }
      } else {
        // Fetch public slots via security-safe RPC
        const { data, error } = await supabase.rpc('get_public_calendar', {
          p_start_date: startDateStr,
          p_end_date: endDateStr,
        });

        if (!error && data) {
          setSlots(data || []);
        }
      }
    } catch (err) {
      console.error('Error loading yearly data:', err);
    } finally {
      setLoading(false);
    }
  }, [year, isAdmin]);

  useEffect(() => {
    fetchYearData();
  }, [fetchYearData]);

  // Helpers
  const months = [
    { name: 'Jan', fullName: 'January', index: 0 },
    { name: 'Feb', fullName: 'February', index: 1 },
    { name: 'Mar', fullName: 'March', index: 2 },
    { name: 'Apr', fullName: 'April', index: 3 },
    { name: 'May', fullName: 'May', index: 4 },
    { name: 'Jun', fullName: 'June', index: 5 },
    { name: 'Jul', fullName: 'July', index: 6 },
    { name: 'Aug', fullName: 'August', index: 7 },
    { name: 'Sept', fullName: 'September', index: 8 },
    { name: 'Oct', fullName: 'October', index: 9 },
    { name: 'Nov', fullName: 'November', index: 10 },
    { name: 'Dec', fullName: 'December', index: 11 },
  ];

  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getDateAvailability = (dateStr: string): DateAvailability => {
    return calculateDateAvailability(dateStr, slots);
  };

  const handleMonthCardClick = (monthIndex: number) => {
    if (onMonthClick) {
      onMonthClick(year, monthIndex);
    }
  };

  // Build matrix with Monday as 1st column
  const getMonthMatrix = (monthIndex: number) => {
    const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 is Sun
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1; // 0 is Mon, 6 is Sun
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, dateStr });
    }

    return cells;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-6 py-2 sm:py-6">
      {/* Visual Status Legend */}
      <div className="glass-card rounded-2xl p-2.5 sm:p-3.5 mb-3 sm:mb-5 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-[#FBBF24] border border-amber-400 shadow-2xs"></div>
          <span className="font-semibold text-slate-700">Morning / Evening Slot Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-[#EF4444] border border-red-500 shadow-2xs"></div>
          <span className="font-semibold text-slate-700">Full Day Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-white border border-slate-300 shadow-2xs"></div>
          <span className="font-semibold text-slate-700">Available</span>
        </div>
      </div>

      {/* Main 3x4 Yearly Matrix Card */}
      <div className="glass-card rounded-3xl p-2.5 sm:p-6 shadow-xl border border-white/80">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <button
            onClick={() => setYear(year - 1)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Previous Year"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              {year}
            </h2>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">
              Tap any month for full calendar view
            </p>
          </div>

          <button
            onClick={() => setYear(year + 1)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Next Year"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 3 Columns x 4 Rows Matrix (All 12 Months Visible on 1 Screen) */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs rounded-2xl z-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
            {months.map(({ name, fullName, index }) => {
              const matrix = getMonthMatrix(index);

              return (
                <div
                  key={name}
                  onClick={() => handleMonthCardClick(index)}
                  className="bg-white/95 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 border border-slate-200/80 shadow-2xs flex flex-col justify-between transition-all cursor-pointer hover:border-blue-400 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group"
                  title={`Click to view full ${fullName} calendar`}
                >
                  {/* Month Header */}
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <h3 className="text-center font-bold text-[11px] sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      {name}
                    </h3>
                    <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all hidden sm:inline" />
                  </div>

                  {/* Weekday Row (M T W T F S S) */}
                  <div className="grid grid-cols-7 gap-0.5 text-center mb-0.5">
                    {weekdays.map((w, wi) => (
                      <span
                        key={wi}
                        className={`text-[8px] sm:text-[10px] font-bold ${
                          wi === 6 ? 'text-red-500' : 'text-slate-400'
                        }`}
                      >
                        {w}
                      </span>
                    ))}
                  </div>

                  {/* Days Matrix */}
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {matrix.map((cell, ci) => {
                      if (!cell) {
                        return <div key={`empty-${ci}`} className="w-full aspect-square" />;
                      }

                      const availability = getDateAvailability(cell.dateStr);
                      const isToday = cell.dateStr === todayDate;
                      const dayOfWeek = (ci % 7); // 6 = Sunday

                      let cellBg = 'bg-transparent text-slate-700 hover:bg-slate-100';
                      if (availability.status === 'fully_booked') {
                        cellBg = 'bg-[#EF4444] text-white font-bold rounded-sm shadow-2xs';
                      } else if (availability.status === 'single_slot') {
                        cellBg = 'bg-[#FBBF24] text-slate-900 font-bold rounded-sm shadow-2xs';
                      }

                      return (
                        <div
                          key={cell.dateStr}
                          className={`w-full aspect-square text-[8px] sm:text-[11px] font-semibold flex items-center justify-center transition-all select-none pointer-events-none ${cellBg} ${
                            isToday && availability.status === 'available'
                              ? 'border border-blue-600 text-blue-600 font-bold'
                              : ''
                          } ${dayOfWeek === 6 && availability.status === 'available' ? 'text-red-500 font-medium' : ''}`}
                        >
                          {cell.day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Public Date Details Modal */}
      {!isAdmin && (
        <DateDetailsModal
          isOpen={isPublicModalOpen}
          onClose={() => setIsPublicModalOpen(false)}
          dateInfo={selectedDateInfo}
        />
      )}

      {/* Admin Day Management Drawer */}
      {isAdmin && (
        <AdminDayDrawer
          isOpen={isAdminDrawerOpen}
          onClose={() => {
            setIsAdminDrawerOpen(false);
            fetchYearData();
          }}
          dateStr={selectedAdminDate}
          bookings={adminBookings}
          onAddBooking={(dateStr) => {
            if (onAdminAddBooking) onAdminAddBooking(dateStr);
          }}
          onEditBooking={(booking) => {
            if (onAdminEditBooking) onAdminEditBooking(booking);
          }}
          onReceiptClick={(booking) => {
            if (onAdminReceiptClick) onAdminReceiptClick(booking);
          }}
          onDeleteBooking={(booking) => {
            if (onAdminDeleteBooking) onAdminDeleteBooking(booking);
          }}
        />
      )}
    </div>
  );
};
