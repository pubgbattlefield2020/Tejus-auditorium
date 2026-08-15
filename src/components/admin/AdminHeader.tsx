'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  History,
  LogOut,
  Eye,
  Shield,
  Menu,
  X,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  adminEmail?: string;
  trashCount: number;
  onNewBookingClick: () => void;
  onSearchClick: () => void;
  onTrashClick: () => void;
  onLogsClick: () => void;
  onSyncSheetsClick?: () => void;
  syncingSheets?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminEmail,
  trashCount,
  onNewBookingClick,
  onSearchClick,
  onTrashClick,
  onLogsClick,
  onSyncSheetsClick,
  syncingSheets = false,
}) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand & Admin Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900">TEJUS</span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block">{adminEmail || 'Admin Control'}</p>
            </div>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* New Booking Button */}
          <button
            onClick={onNewBookingClick}
            className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>New</span>
          </button>

          {/* Search Button */}
          <button
            onClick={onSearchClick}
            className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Search bookings"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            <span className="hidden md:inline">Search</span>
          </button>

          {/* Desktop Only Buttons */}
          <div className="hidden lg:flex items-center gap-1.5">
            {/* Sync to Google Sheets */}
            {onSyncSheetsClick && (
              <button
                onClick={onSyncSheetsClick}
                disabled={syncingSheets}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Sync all bookings to Google Sheets"
              >
                {syncingSheets ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                )}
                <span>{syncingSheets ? 'Syncing...' : 'Google Sheets'}</span>
              </button>
            )}

            {/* Trash Button */}
            <button
              onClick={onTrashClick}
              className="relative p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Manage Trash"
            >
              <Trash2 className="w-4 h-4 text-slate-500" />
              <span>Trash</span>
              {trashCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {trashCount}
                </span>
              )}
            </button>

            {/* Activity Logs Button */}
            <button
              onClick={onLogsClick}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="View Activity Logs"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>Logs</span>
            </button>

            {/* View Public Calendar */}
            <Link
              href="/"
              target="_blank"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Open Public View"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Public View</span>
            </Link>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer relative"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {trashCount > 0 && !mobileMenuOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {onSyncSheetsClick && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSyncSheetsClick();
                }}
                disabled={syncingSheets}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{syncingSheets ? 'Syncing...' : 'Sync Sheets'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onTrashClick();
              }}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-slate-500" />
                Trash
              </span>
              {trashCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
                  {trashCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogsClick();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <History className="w-4 h-4 text-slate-500" />
              Activity Logs
            </button>

            <Link
              href="/"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              Public View
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 col-span-2 sm:col-span-1"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
