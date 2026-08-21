'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { PublicCalendar } from '@/components/public/PublicCalendar';
import { YearlyCalendar } from '@/components/public/YearlyCalendar';
import { getTodayISTString } from '@/lib/time-utils';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const today = getTodayISTString();
    const [year, month] = today.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  // Ensure live IST date is synchronized on client mount
  useEffect(() => {
    const today = getTodayISTString();
    const [year, month] = today.split('-').map(Number);
    setCurrentDate(new Date(year, month - 1, 1));
  }, []);

  const handleMonthSelect = (selectedYear: number, monthIndex: number) => {
    setCurrentDate(new Date(selectedYear, monthIndex, 1));
    setViewMode('month');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar viewMode={viewMode} onViewModeChange={setViewMode} />
      <main className="flex-1 pb-12">
        {viewMode === 'month' ? (
          <PublicCalendar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        ) : (
          <YearlyCalendar
            isAdmin={false}
            onMonthClick={handleMonthSelect}
          />
        )}
      </main>
    </div>
  );
}
