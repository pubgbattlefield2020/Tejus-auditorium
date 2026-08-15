'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  History,
  Shield,
  Clock,
  FileText,
  Loader2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Phone,
  Calendar,
  DollarSign,
  Tag,
  Ban,
  Trash2,
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { ActivityLog } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatDateReadable, formatTime12Hour } from '@/lib/time-utils';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data as ActivityLog[]) || []);
    } catch (err) {
      console.error('Error loading activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      setSelectedLog(null);
      setShowRawJson(false);
    }
  }, [isOpen]);

  const formatIST = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return {
          label: 'CREATED',
          className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
        };
      case 'UPDATE':
        return {
          label: 'MODIFIED',
          className: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: RefreshCw,
        };
      case 'CANCEL':
        return {
          label: 'CANCELLED',
          className: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: Ban,
        };
      case 'DELETE':
        return {
          label: 'MOVED TO TRASH',
          className: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Trash2,
        };
      case 'RESTORE':
        return {
          label: 'RESTORED',
          className: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: RefreshCw,
        };
      case 'PERMANENT_DELETE':
        return {
          label: 'PERMANENT DELETE',
          className: 'bg-red-100 text-red-800 border-red-300',
          icon: Trash2,
        };
      case 'RECEIPT_DOWNLOAD':
      case 'RECEIPT_PRINT':
        return {
          label: action === 'RECEIPT_PRINT' ? 'RECEIPT PRINTED' : 'RECEIPT DOWNLOADED',
          className: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: Printer,
        };
      default:
        return {
          label: action,
          className: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: FileText,
        };
    }
  };

  // Filter & Search
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter by Action
      if (filterAction !== 'ALL') {
        if (filterAction === 'RECEIPT') {
          if (!log.action.startsWith('RECEIPT')) return false;
        } else if (log.action !== filterAction) {
          return false;
        }
      }

      // Search by text
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const bId = (log.booking_id || '').toLowerCase();
        const custName = (log.details?.customer_name || '').toLowerCase();
        const custPhone = (log.details?.customer_phone || '').toLowerCase();
        const adminEmail = (log.admin_email || '').toLowerCase();

        return (
          bId.includes(query) ||
          custName.includes(query) ||
          custPhone.includes(query) ||
          adminEmail.includes(query)
        );
      }

      return true;
    });
  }, [logs, filterAction, searchTerm]);

  // Helper to extract field changes for UPDATE actions with exact value normalization
  const getChangedFields = (details: any) => {
    if (!details || !details.changes || !details.previous) return [];
    const changes = details.changes;
    const previous = details.previous;
    const diffs: Array<{ field: string; oldVal: string; newVal: string }> = [];

    const fieldLabels: Record<string, string> = {
      customer_name: 'Customer Name',
      customer_phone: 'Mobile Phone',
      customer_address: 'Address / Place',
      programme_date: 'Event Date',
      from_time: 'From Time',
      to_time: 'To Time',
      slot_period: 'Slot Period',
      programme_type: 'Programme Type',
      ac_type: 'AC Option',
      auditorium_area: 'Auditorium Area',
      waste_cleaning: 'Waste Cleaning',
      referred_by: 'Referred By',
      total_amount: 'Total Amount',
      advance_amount: 'Advance Paid',
      pending_amount: 'Balance Pending',
      status: 'Booking Status',
    };

    Object.keys(fieldLabels).forEach((key) => {
      if (!(key in changes) && !(key in previous)) return;

      const rawPrev = previous[key];
      const rawNew = changes[key] !== undefined ? changes[key] : rawPrev;

      let isChanged = false;
      let displayPrev = '';
      let displayNew = '';

      if (key === 'from_time' || key === 'to_time') {
        const pNorm = (rawPrev || '').toString().slice(0, 5);
        const nNorm = (rawNew || '').toString().slice(0, 5);
        if (pNorm !== nNorm) {
          isChanged = true;
          displayPrev = pNorm ? formatTime12Hour(pNorm) : '—';
          displayNew = nNorm ? formatTime12Hour(nNorm) : '—';
        }
      } else if (key === 'total_amount' || key === 'advance_amount' || key === 'pending_amount') {
        const pNum = Number(rawPrev || 0);
        const nNum = Number(rawNew || 0);
        if (pNum !== nNum) {
          isChanged = true;
          displayPrev = `₹ ${pNum.toLocaleString('en-IN')}`;
          displayNew = `₹ ${nNum.toLocaleString('en-IN')}`;
        }
      } else if (key === 'programme_date') {
        const pStr = (rawPrev || '').toString().slice(0, 10);
        const nStr = (rawNew || '').toString().slice(0, 10);
        if (pStr !== nStr) {
          isChanged = true;
          displayPrev = pStr ? formatDateReadable(pStr) : '—';
          displayNew = nStr ? formatDateReadable(nStr) : '—';
        }
      } else {
        const pStr = (rawPrev !== null && rawPrev !== undefined ? String(rawPrev) : '').trim();
        const nStr = (rawNew !== null && rawNew !== undefined ? String(rawNew) : '').trim();
        if (pStr !== nStr) {
          isChanged = true;
          displayPrev = pStr || '—';
          displayNew = nStr || '—';
        }
      }

      if (isChanged) {
        diffs.push({
          field: fieldLabels[key],
          oldVal: displayPrev,
          newVal: displayNew,
        });
      }
    });

    return diffs;
  };

  // Helper to extract full snapshot of booking from log details
  const getBookingSnapshot = (details: any) => {
    if (!details) return null;
    const snap = { ...(details.previous || {}), ...(details.changes || {}), ...details };

    return {
      customer_name: snap.customer_name || '—',
      customer_phone: snap.customer_phone || '—',
      customer_address: snap.customer_address || '—',
      programme_date: snap.programme_date ? formatDateReadable(snap.programme_date) : '—',
      from_time: snap.from_time ? formatTime12Hour(snap.from_time.slice(0, 5)) : '',
      to_time: snap.to_time ? formatTime12Hour(snap.to_time.slice(0, 5)) : '',
      slot_period: snap.slot_period || '—',
      programme_type: snap.programme_type || '—',
      ac_type: snap.ac_type || '—',
      auditorium_area: snap.auditorium_area || '—',
      waste_cleaning: snap.waste_cleaning || '—',
      referred_by: snap.referred_by || '—',
      total_amount: Number(snap.total_amount || 0),
      advance_amount: Number(snap.advance_amount || 0),
      pending_amount: Number(snap.pending_amount || (Number(snap.total_amount || 0) - Number(snap.advance_amount || 0))),
      status: snap.status || snap.new_status || 'Confirmed',
    };
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Outer Audit Trail Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" />

        {/* Main Modal Card */}
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 sm:p-7 max-h-[92vh] overflow-y-auto z-10 my-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Activity Audit Trail</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Click on any log entry below to view full details and change history
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Action Filter Tabs */}
          <div className="space-y-2.5 mb-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Booking ID, Customer Name, or Admin..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>

            {/* Action Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'ALL', label: 'All Activities' },
                { id: 'CREATE', label: 'Created' },
                { id: 'UPDATE', label: 'Modified' },
                { id: 'CANCEL', label: 'Cancelled' },
                { id: 'DELETE', label: 'Trash' },
                { id: 'RESTORE', label: 'Restored' },
                { id: 'RECEIPT', label: 'Receipts' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterAction(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs shrink-0 transition-all cursor-pointer ${
                    filterAction === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logs List Container */}
          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-xs font-semibold">Loading audit logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-slate-600">No activity logs found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search query.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.action);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={log.id}
                    onClick={() => {
                      setSelectedLog(log);
                      setShowRawJson(false);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.8 rounded-full font-bold border flex items-center gap-1 text-[11px] ${badge.className}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>

                      <span className="font-mono font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {log.booking_id}
                      </span>

                      {log.details?.customer_name && (
                        <span className="text-slate-700 font-semibold">• {log.details.customer_name}</span>
                      )}

                      {log.details?.programme_date && (
                        <span className="text-slate-500 font-normal">
                          ({formatDateReadable(log.details.programme_date)})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px] self-end sm:self-center">
                      <span className="text-slate-600 font-medium">{log.admin_email || 'Admin'}</span>
                      <span>•</span>
                      <span>{formatIST(log.created_at)}</span>
                      <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                        View Details →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredLogs.length} of {logs.length} audit entries
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Close Logs
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVITY DETAIL POPUP MODAL (HIGH Z-INDEX OVERLAY) */}
      {/* ========================================================================= */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Nested High-Priority Backdrop */}
          <div
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity z-[101]"
          />

          {/* Detail Card */}
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-7 max-h-[90vh] overflow-y-auto z-[102] my-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                {(() => {
                  const badge = getActionBadge(selectedLog.action);
                  const BadgeIcon = badge.icon;
                  return (
                    <span className={`px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 text-xs ${badge.className}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  );
                })()}
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-mono">
                    Booking {selectedLog.booking_id}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Performer & Timestamp Info Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Performed By (Admin)
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {selectedLog.admin_email || 'tejusauditorium@gmail.com'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Date & Time (IST)
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {formatIST(selectedLog.created_at)}
                </span>
              </div>
            </div>

            {/* Specific Action Breakdown */}
            <div className="space-y-4">
              {/* 1. CANCELLATION DETAILS */}
              {selectedLog.action === 'CANCEL' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>Booking Cancelled</span>
                  </div>
                  <p className="text-rose-800 leading-relaxed">
                    This reservation was marked as <strong>Cancelled</strong>. The time slot has been freed up and is now available for new bookings on the calendar.
                  </p>

                  <div className="pt-2 border-t border-rose-200/80 grid grid-cols-2 gap-2 text-rose-950 font-medium">
                    <div>
                      Customer: <span className="font-bold">{selectedLog.details?.customer_name || '—'}</span>
                    </div>
                    <div>
                      Event Date: <span className="font-bold">{selectedLog.details?.programme_date ? formatDateReadable(selectedLog.details.programme_date) : '—'}</span>
                    </div>
                    {selectedLog.details?.customer_phone && (
                      <div>
                        Mobile: <span className="font-mono font-bold">{selectedLog.details.customer_phone}</span>
                      </div>
                    )}
                    <div>
                      Previous Status: <span className="font-semibold">{selectedLog.details?.previous_status || 'Confirmed'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. UPDATE (MODIFIED) DETAILS - BEFORE VS AFTER */}
              {selectedLog.action === 'UPDATE' && (
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Specific Changes in this Update (Before vs After)</span>
                    </h5>

                    {(() => {
                      const diffs = getChangedFields(selectedLog.details);
                      if (diffs.length === 0) {
                        return (
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                            General update saved for booking {selectedLog.booking_id}.
                          </div>
                        );
                      }

                      return (
                        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                                <th className="py-2 px-3">Field</th>
                                <th className="py-2 px-3 text-amber-700">Previous Value</th>
                                <th className="py-2 px-3 text-emerald-700">New Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {diffs.map((d, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80">
                                  <td className="py-2.5 px-3 font-bold text-slate-800">{d.field}</td>
                                  <td className="py-2.5 px-3 text-amber-800 bg-amber-50/40 font-mono">
                                    {d.oldVal}
                                  </td>
                                  <td className="py-2.5 px-3 text-emerald-800 bg-emerald-50/40 font-mono font-bold">
                                    {d.newVal}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Complete Booking Snapshot for Context */}
                  {(() => {
                    const snap = getBookingSnapshot(selectedLog.details);
                    if (!snap) return null;

                    return (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Complete Booking Snapshot (After Update)
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-slate-700">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer</span>
                            <span className="font-bold text-slate-900 block">{snap.customer_name}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mobile Phone</span>
                            <span className="font-mono font-bold text-blue-700 block">{snap.customer_phone}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Event Date</span>
                            <span className="font-bold text-slate-900 block">{snap.programme_date}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Timing</span>
                            <span className="font-medium text-slate-800 block">
                              {snap.from_time} – {snap.to_time} ({snap.slot_period})
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Event Type</span>
                            <span className="font-medium text-slate-800 block">{snap.programme_type}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Venue Options</span>
                            <span className="font-medium text-slate-800 block">
                              {snap.auditorium_area}, {snap.ac_type}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Amount</span>
                            <span className="font-mono font-bold text-slate-900 block">
                              ₹ {snap.total_amount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Advance Paid</span>
                            <span className="font-mono font-bold text-emerald-700 block">
                              ₹ {snap.advance_amount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pending Balance</span>
                            <span className="font-mono font-bold text-amber-800 block">
                              ₹ {snap.pending_amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 3. CREATE (NEW BOOKING) DETAILS */}
              {selectedLog.action === 'CREATE' && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>New Booking Created</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                      <span className="font-bold text-slate-900">{selectedLog.details?.customer_name || '—'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile Phone</span>
                      <span className="font-mono font-bold text-blue-700">{selectedLog.details?.customer_phone || '—'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Event Date</span>
                      <span className="font-bold text-slate-900">
                        {selectedLog.details?.programme_date ? formatDateReadable(selectedLog.details.programme_date) : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Timings</span>
                      <span className="font-medium text-slate-800">
                        {selectedLog.details?.from_time ? formatTime12Hour(selectedLog.details.from_time) : ''} –{' '}
                        {selectedLog.details?.to_time ? formatTime12Hour(selectedLog.details.to_time) : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Event Type</span>
                      <span className="font-medium text-slate-800">{selectedLog.details?.programme_type || '—'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Venue & AC</span>
                      <span className="font-medium text-slate-800">
                        {selectedLog.details?.auditorium_area || 'Full Auditorium'}, {selectedLog.details?.ac_type || 'AC'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Amount</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹ {Number(selectedLog.details?.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Advance Paid</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ₹ {Number(selectedLog.details?.advance_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Balance</span>
                      <span className="font-mono font-bold text-amber-800">
                        ₹ {Number(selectedLog.details?.pending_amount || (Number(selectedLog.details?.total_amount || 0) - Number(selectedLog.details?.advance_amount || 0))).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. TRASH / DELETE DETAILS */}
              {selectedLog.action === 'DELETE' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                    <Trash2 className="w-4 h-4 text-amber-600" />
                    <span>Moved to Trash (Soft-Deleted)</span>
                  </div>
                  <p>
                    Booking for <strong>{selectedLog.details?.customer_name}</strong> on{' '}
                    <strong>{selectedLog.details?.programme_date}</strong> was moved to the trash folder. It can be restored from the Trash manager.
                  </p>
                </div>
              )}

              {/* 5. RESTORE DETAILS */}
              {selectedLog.action === 'RESTORE' && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-purple-900">
                    <RefreshCw className="w-4 h-4 text-purple-600" />
                    <span>Restored from Trash</span>
                  </div>
                  <p>
                    Booking <strong>{selectedLog.booking_id}</strong> was restored back to active bookings.
                  </p>
                </div>
              )}

              {/* 6. RECEIPT DETAILS */}
              {(selectedLog.action === 'RECEIPT_PRINT' || selectedLog.action === 'RECEIPT_DOWNLOAD') && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
                    <Printer className="w-4 h-4 text-indigo-600" />
                    <span>Customer Receipt Action</span>
                  </div>
                  <p>
                    Receipt <strong>{selectedLog.details?.receipt_no}</strong> was generated/printed for booking{' '}
                    <strong>{selectedLog.booking_id}</strong>.
                  </p>
                </div>
              )}

              {/* Collapsible Technical Audit JSON Inspector */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  {showRawJson ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Technical Audit Payload (JSON)</span>
                </button>

                {showRawJson && (
                  <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl text-[10px] font-mono overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 pt-3.5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
