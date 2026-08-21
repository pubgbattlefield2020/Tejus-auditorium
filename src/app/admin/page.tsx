'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  Grid,
  List,
  Loader2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  Edit,
  Trash2,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Booking, DashboardStats } from '@/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminCalendar } from '@/components/admin/AdminCalendar';
import { AdminDayDrawer } from '@/components/admin/AdminDayDrawer';
import { BookingFormModal } from '@/components/admin/BookingFormModal';
import { ReceiptModal } from '@/components/admin/ReceiptModal';
import { CustomerSearchModal } from '@/components/admin/CustomerSearchModal';
import { TrashModal } from '@/components/admin/TrashModal';
import { ActivityLogsModal } from '@/components/admin/ActivityLogsModal';
import { YearlyCalendar } from '@/components/public/YearlyCalendar';
import { formatDateReadable, formatTime12Hour, getTodayISTString } from '@/lib/time-utils';
import { syncBookingToGoogleSheets, syncAllBookingsToGoogleSheets } from '@/lib/google-sheets';

export default function AdminPage() {
  const router = useRouter();
  const [todayIST, setTodayIST] = useState<string>(getTodayISTString);

  // Auth State
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>('tejusauditorium@gmail.com');

  // View States
  const [viewMode, setViewMode] = useState<'calendar' | 'yearly' | 'table'>('calendar');
  const [currentDate, setCurrentDate] = useState(() => {
    const [year, month] = getTodayISTString().split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trashCount, setTrashCount] = useState<number>(0);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [syncingSheets, setSyncingSheets] = useState(false);

  // Modal / Drawer States
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState(false);
  const [selectedDrawerDate, setSelectedDrawerDate] = useState<string>(getTodayISTString);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState<string>(getTodayISTString);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);

  // Sync today's date upon mount
  useEffect(() => {
    const liveToday = getTodayISTString();
    setTodayIST(liveToday);
    const [year, month] = liveToday.split('-').map(Number);
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDrawerDate(liveToday);
    setSelectedDateForBooking(liveToday);
  }, []);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<Booking | null>(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Check Auth & Redirect seamlessly
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session && session.user) {
          setIsAuthenticated(true);
          setAdminEmail(session.user.email || 'tejusauditorium@gmail.com');
          setSessionLoading(false);
        } else {
          setIsAuthenticated(false);
          setSessionLoading(false);
          router.replace('/admin/login');
        }
      } catch (err) {
        if (!isMounted) return;
        setIsAuthenticated(false);
        setSessionLoading(false);
        router.replace('/admin/login');
      }
    };

    verifySession();

    // Timeout safety fallback (max 1.5 seconds)
    const timer = setTimeout(() => {
      if (isMounted && sessionLoading) {
        setSessionLoading(false);
      }
    }, 1500);

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session && session.user) {
        setIsAuthenticated(true);
        setAdminEmail(session.user.email || 'tejusauditorium@gmail.com');
        setSessionLoading(false);
      } else {
        setIsAuthenticated(false);
        setSessionLoading(false);
        router.replace('/admin/login');
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Fetch Bookings and Trash count
  const fetchAdminData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingBookings(true);
    try {
      // 1. Active bookings
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .is('deleted_at', null)
        .order('programme_date', { ascending: true })
        .order('from_time', { ascending: true });

      if (error) throw error;
      setBookings((data as Booking[]) || []);

      // 2. Trash count
      const { count, error: trashErr } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .not('deleted_at', 'is', null);

      if (!trashErr && typeof count === 'number') {
        setTrashCount(count);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated, fetchAdminData]);

  // Compute Dashboard Stats
  const dashboardStats: DashboardStats = React.useMemo(() => {
    const active = bookings.filter((b) => b.status !== 'Cancelled');
    const totalAmount = active.reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0);
    const totalAdvance = active.reduce((acc, b) => acc + (Number(b.advance_amount) || 0), 0);
    const totalPending = active.reduce((acc, b) => acc + (Number(b.pending_amount) || 0), 0);

    const upcomingBookings = active.filter((b) => b.programme_date >= todayIST).length;
    const currentYearMonth = todayIST.slice(0, 7);
    const currentMonthBookings = active.filter((b) => b.programme_date.startsWith(currentYearMonth)).length;

    return {
      totalBookings: active.length,
      totalAmount,
      totalAdvance,
      totalPending,
      upcomingBookings,
      currentMonthBookings,
    };
  }, [bookings, todayIST]);

  // Handlers
  const handleOpenNewBooking = (dateStr?: string) => {
    setSelectedDateForBooking(dateStr || todayIST);
    setSelectedBookingForEdit(null);
    setIsBookingModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBookingForEdit(booking);
    setSelectedDateForBooking(booking.programme_date);
    setIsBookingModalOpen(true);
  };

  const handleOpenReceipt = (booking: Booking) => {
    setSelectedBookingForReceipt(booking);
    setIsReceiptModalOpen(true);
  };

  const handleOpenDayDrawer = (dateStr: string) => {
    setSelectedDrawerDate(dateStr);
    setIsDayDrawerOpen(true);
  };

  const handleDeleteToTrash = async (booking: Booking) => {
    const confirmTrash = window.confirm(
      `Move booking ${booking.booking_id} (${booking.customer_name}) to Trash?`
    );
    if (!confirmTrash) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', booking.id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        booking_id: booking.booking_id,
        action: 'DELETE',
        admin_email: adminEmail,
        details: {
          customer_name: booking.customer_name,
          programme_date: booking.programme_date,
        },
      });

      // Google Sheets sync
      syncBookingToGoogleSheets('DELETE', booking);

      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to move booking to trash.');
    }
  };

  const handleSyncAllToSheets = async () => {
    const webhookUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) {
      alert('Google Sheet Webhook URL is not configured yet.\n\nPlease follow the simple steps in GOOGLE_SHEETS_SETUP.md and add NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL to your environment variables.');
      return;
    }

    setSyncingSheets(true);
    try {
      const res = await syncAllBookingsToGoogleSheets(bookings);
      if (res.success) {
        alert(`Successfully synced ${res.count} bookings to your Google Sheet!`);
      } else {
        alert('Failed to sync to Google Sheet. Please check your Webhook URL.');
      }
    } catch (err: any) {
      alert(err.message || 'Error syncing to Google Sheet.');
    } finally {
      setSyncingSheets(false);
    }
  };

  const filteredTableBookings = bookings.filter((b) => {
    if (filterStatus === 'ALL') return true;
    return b.status === filterStatus;
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-3 text-center shadow-lg max-w-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Verifying Admin Access...</h3>
            <p className="text-xs text-slate-500 mt-0.5">Connecting to secure session</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-4 text-center shadow-xl max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Admin Sign In Required</h3>
            <p className="text-xs text-slate-500 mt-1">Please sign in to manage auditorium bookings</p>
          </div>
          <Link
            href="/admin/login"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <span>Go to Admin Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Admin Navbar */}
      <AdminHeader
        adminEmail={adminEmail}
        trashCount={trashCount}
        onNewBookingClick={() => handleOpenNewBooking()}
        onSearchClick={() => setIsSearchModalOpen(true)}
        onTrashClick={() => setIsTrashModalOpen(true)}
        onLogsClick={() => setIsLogsModalOpen(true)}
        onSyncSheetsClick={handleSyncAllToSheets}
        syncingSheets={syncingSheets}
      />

      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16">
        {/* Dashboard Statistics */}
        <AdminStats stats={dashboardStats} />

        {/* View Switcher Bar */}
        <div className="glass-card rounded-2xl p-2.5 sm:p-3 mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'yearly'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Year (3x4)</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Quick Action Info */}
          <div className="flex items-center gap-2">
            {viewMode === 'table' && (
              <div className="flex items-center gap-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}

            <button
              onClick={() => handleOpenNewBooking()}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Booking</span>
            </button>
          </div>
        </div>

        {/* Dynamic Views */}
        {viewMode === 'calendar' && (
          <AdminCalendar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            bookings={bookings}
            onDateClick={handleOpenNewBooking}
            onEditBooking={handleEditBooking}
            onReceiptClick={handleOpenReceipt}
            onDeleteBooking={handleDeleteToTrash}
            onOpenDayDrawer={handleOpenDayDrawer}
          />
        )}

        {viewMode === 'yearly' && (
          <YearlyCalendar
            isAdmin={true}
            onMonthClick={(selYear, monthIndex) => {
              setCurrentDate(new Date(selYear, monthIndex, 1));
              setViewMode('calendar');
            }}
            onAdminAddBooking={handleOpenNewBooking}
            onAdminEditBooking={handleEditBooking}
            onAdminReceiptClick={handleOpenReceipt}
            onAdminDeleteBooking={handleDeleteToTrash}
          />
        )}

        {viewMode === 'table' && (
          <div className="glass-card rounded-3xl p-4 sm:p-7 shadow-xl border border-white/80 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              All Active Bookings ({filteredTableBookings.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-3 px-3">Booking ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Programme Date</th>
                    <th className="py-3 px-3">Timing</th>
                    <th className="py-3 px-3">Area & AC</th>
                    <th className="py-3 px-3 text-right">Total (₹)</th>
                    <th className="py-3 px-3 text-right">Pending (₹)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTableBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{b.booking_id}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{b.customer_name}</span>
                        {b.customer_phone && (
                          <a
                            href={`tel:${b.customer_phone}`}
                            className="text-[11px] text-blue-600 hover:underline font-semibold block font-mono"
                          >
                            📞 {b.customer_phone}
                          </a>
                        )}
                        {b.customer_address && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                            {b.customer_address}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {formatDateReadable(b.programme_date)}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {formatTime12Hour(b.from_time)} – {formatTime12Hour(b.to_time)}
                        <span className="block text-[10px] text-slate-400 font-semibold">{b.slot_period}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="font-medium">{b.auditorium_area}</span>
                        <span className="text-[10px] text-slate-400 block">{b.ac_type}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">
                        ₹ {Number(b.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-700 text-right">
                        ₹ {Number(b.pending_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.status === 'Confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : b.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReceipt(b)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditBooking(b)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteToTrash(b)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Day Drawer for Mobile and Quick Inspections */}
      <AdminDayDrawer
        isOpen={isDayDrawerOpen}
        onClose={() => {
          setIsDayDrawerOpen(false);
          fetchAdminData();
        }}
        dateStr={selectedDrawerDate}
        bookings={bookings}
        onAddBooking={handleOpenNewBooking}
        onEditBooking={handleEditBooking}
        onReceiptClick={handleOpenReceipt}
        onDeleteBooking={handleDeleteToTrash}
      />

      {/* Booking Form Modal */}
      <BookingFormModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={(savedBooking) => {
          setBookings((prev) => {
            const filtered = prev.filter((b) => b.id !== savedBooking.id);
            return [savedBooking, ...filtered];
          });
          fetchAdminData();
        }}
        initialDate={selectedDateForBooking}
        initialBooking={selectedBookingForEdit}
        allBookings={bookings}
        adminEmail={adminEmail}
      />

      {/* Customer Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        booking={selectedBookingForReceipt}
        adminEmail={adminEmail}
      />

      {/* Customer Search Modal */}
      <CustomerSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectBookingForEdit={handleEditBooking}
        onSelectBookingForReceipt={handleOpenReceipt}
      />

      {/* Trash Modal */}
      <TrashModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        onRestoreSuccess={() => fetchAdminData()}
        onEditBooking={handleEditBooking}
        adminEmail={adminEmail}
      />

      {/* Activity Logs Modal */}
      <ActivityLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />
    </div>
  );
}
