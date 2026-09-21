'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, User, Phone, Calendar, Clock, DollarSign, Edit, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Booking } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatDateReadable, formatTime12Hour } from '@/lib/time-utils';

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBookingForEdit: (booking: Booking) => void;
  onSelectBookingForReceipt: (booking: Booking) => void;
}

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectBookingForEdit,
  onSelectBookingForReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search by Name or Mobile Phone
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const query = searchTerm.trim();
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`)
          .is('deleted_at', null)
          .order('programme_date', { ascending: false })
          .limit(20);

        if (!error && data) {
          setResults(data as Booking[]);
        }
      } catch (err) {
        console.error('Customer search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-8 max-h-[90vh] overflow-y-auto z-10 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Search Bookings</h3>
              <p className="text-xs text-slate-500 font-medium">Find bookings by customer name or phone number</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative mb-5">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type customer name or mobile number (e.g. Rahul, 9447...)..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
          {loading && (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Results Container */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {hasSearched && results.length === 0 && !loading && (
            <div className="py-10 text-center text-slate-400">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-slate-600">No bookings found</p>
              <p className="text-xs text-slate-400">Try searching with a different name or number</p>
            </div>
          )}

          {results.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {b.booking_id}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{b.customer_name}</span>
                  {b.customer_phone && (
                    <a
                      href={`tel:${b.customer_phone}`}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{b.customer_phone}</span>
                    </a>
                  )}
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
                </div>

                <div className="text-xs text-slate-600 font-medium mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>📅 {formatDateReadable(b.programme_date)}</span>
                  <span>
                    💰 Total: ₹{Number(b.total_amount).toLocaleString('en-IN')}{' '}
                    {Number(b.pending_amount) > 0 ? (
                      <span className="text-amber-700 font-bold">(Pending: ₹{Number(b.pending_amount).toLocaleString('en-IN')})</span>
                    ) : (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">✓ Paid in Full</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    onSelectBookingForReceipt(b);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Receipt</span>
                </button>

                <button
                  onClick={() => {
                    onSelectBookingForEdit(b);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
