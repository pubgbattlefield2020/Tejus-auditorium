'use client';

import React, { useState, useEffect } from 'react';
import { X, History, Shield, Clock, FileText, Loader2, ArrowRight } from 'lucide-react';
import { ActivityLog } from '@/types';
import { supabase } from '@/lib/supabase';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

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
      hour12: true,
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DELETE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'RESTORE':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PERMANENT_DELETE':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'RECEIPT_DOWNLOAD':
      case 'RECEIPT_PRINT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-8 max-h-[90vh] overflow-y-auto z-10 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Activity Audit Trail</h3>
              <p className="text-xs text-slate-500 font-medium">Audit logs of all booking and system operations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-xs font-semibold">Loading audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-slate-600">No activity recorded yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Logs will appear as bookings are created or updated.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full font-bold border ${getActionBadge(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{log.booking_id}</span>
                  {log.details?.customer_name && (
                    <span className="text-slate-600 font-medium">• {log.details.customer_name}</span>
                  )}
                  {log.details?.programme_date && (
                    <span className="text-slate-500 font-normal">({log.details.programme_date})</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[11px] self-end sm:self-center">
                  <span className="text-slate-500 font-medium">{log.admin_email || 'Admin'}</span>
                  <span>•</span>
                  <span>{formatIST(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
};
