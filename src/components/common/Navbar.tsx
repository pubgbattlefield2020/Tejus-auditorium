'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Phone, Shield, Grid, CalendarDays } from 'lucide-react';

interface NavbarProps {
  viewMode?: 'month' | 'year';
  onViewModeChange?: (mode: 'month' | 'year') => void;
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode = 'month',
  onViewModeChange,
  isAdmin = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-nav shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Nav Bar */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900">TEJUS</span>
                <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  AUDITORIUM
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Live Availability Calendar</p>
            </div>
          </Link>

          {/* Desktop Center View Switcher (Hidden on small mobile, shown on sm+) */}
          {onViewModeChange && (
            <div className="hidden sm:flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => onViewModeChange('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Month View</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('year')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'year'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Year View (12M)</span>
              </button>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Phone Call Link */}
            <a
              href="tel:9447241559"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white/90 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 shadow-2xs transition-all"
              title="Booking Enquiries: 9447241559"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] sm:text-xs">9447241559</span>
            </a>

            {/* Admin Portal Link */}
            {!isAdmin ? (
              <Link
                href="/admin/login"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent transition-colors flex items-center gap-1"
                title="Admin Sign In"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            ) : (
              <Link
                href="/admin"
                className="px-2.5 py-1 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Mobile View Switcher Row (Only visible on small mobile screens below sm) */}
        {onViewModeChange && (
          <div className="sm:hidden pb-2.5 pt-0.5">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => onViewModeChange('month')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Month View</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('year')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'year'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Year View (12M)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
