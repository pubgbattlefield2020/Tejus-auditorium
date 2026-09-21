'use client';

import React, { useRef, useState } from 'react';
import { X, Printer, Download, Building2, CheckCircle2, ShieldCheck, Phone, Loader2, Calendar } from 'lucide-react';
import { Booking } from '@/types';
import { formatDateReadable, formatTime12Hour, getTodayISTString } from '@/lib/time-utils';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  adminEmail?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  booking,
  isOpen,
  onClose,
  adminEmail = 'admin@tejusauditorium.com',
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const printTemplateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !booking) return null;

  const receiptNo = booking.receipt_no || `RC-${booking.booking_id.replace('TA-', '')}`;
  const todayIST = getTodayISTString();

  const handlePrint = () => {
    supabase.from('activity_logs').insert({
      booking_id: booking.booking_id,
      action: 'RECEIPT_PRINT',
      admin_email: adminEmail,
      details: { receipt_no: receiptNo },
    });
    window.print();
  };

  const handleDownloadPDF = async () => {
    const targetElement = printTemplateRef.current || receiptRef.current;
    if (!targetElement) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2; // 190 mm
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, Math.min(pdfHeight - margin * 2, contentHeight));
      pdf.save(`Tejus_Receipt_${receiptNo}.pdf`);

      await supabase.from('activity_logs').insert({
        booking_id: booking.booking_id,
        action: 'RECEIPT_DOWNLOAD',
        admin_email: adminEmail,
        details: { receipt_no: receiptNo },
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF. You can use the Print button to Save as PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal / Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 sm:p-8 max-h-[95vh] overflow-y-auto z-10 my-auto">
        {/* Top Control Bar */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">Official Customer Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div
          ref={receiptRef}
          className="receipt-container bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs"
        >
          {/* Header */}
          <div className="text-center pb-5 border-b-2 border-slate-800">
            <div className="inline-flex items-center gap-2 mb-1">
              <Building2 className="w-7 h-7 text-blue-700" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 uppercase">
                Tejus Auditorium
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium tracking-wide uppercase">
              Auditorium Booking & Payment Receipt
            </p>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              Enquiries & Booking: <span className="font-bold text-blue-800">9447241559</span>
            </p>
          </div>

          {/* Reference Numbers & Dates (Crystal-Clear Distinction) */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 uppercase font-semibold text-[10px]">Receipt Number</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{receiptNo}</div>

              <div className="text-slate-500 uppercase font-semibold text-[10px] mt-2.5">Booking ID</div>
              <div className="font-mono font-bold text-blue-700 text-sm mt-0.5">{booking.booking_id}</div>
            </div>

            <div className="text-right">
              {/* Highlight Event / Programme Date Prominently */}
              <div className="text-blue-600 uppercase font-bold text-[10px] tracking-wider">
                ★ Programme Date (Event Date)
              </div>
              <div className="font-bold text-blue-900 text-base mt-0.5">
                {formatDateReadable(booking.programme_date)}
              </div>

              <div className="text-slate-500 uppercase font-semibold text-[10px] mt-2">
                Booking Date: <span className="font-bold text-slate-800 font-normal">{formatDateReadable(booking.booking_date)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information with Phone */}
          <div className="py-4 border-b border-slate-200 text-xs">
            <div className="text-slate-500 uppercase font-bold text-[10px] tracking-wider mb-2">
              Customer Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500">Name: </span>
                <span className="font-bold text-slate-900 text-sm block">{booking.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Mobile Phone: </span>
                <span className="font-bold text-blue-800 text-sm font-mono block">
                  {booking.customer_phone || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Address / Place: </span>
                <span className="font-medium text-slate-800 block">{booking.customer_address || '—'}</span>
              </div>
              {booking.referred_by && (
                <div>
                  <span className="text-slate-500">Referred By: </span>
                  <span className="font-medium text-slate-800">{booking.referred_by}</span>
                </div>
              )}
            </div>
          </div>

          {/* Event & Reservation Details */}
          <div className="py-4 border-b border-slate-200 text-xs">
            <div className="text-slate-500 uppercase font-bold text-[10px] tracking-wider mb-2">
              Programme & Event Details
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500">Programme Event: </span>
                <span className="font-bold text-slate-900 block">{booking.programme_type}</span>
              </div>
              <div>
                <span className="text-slate-500">Event Date: </span>
                <span className="font-bold text-blue-800 block">{formatDateReadable(booking.programme_date)}</span>
              </div>
              <div>
                <span className="text-slate-500">Slot / Timing: </span>
                <span className="font-bold text-slate-900 block">
                  {formatTime12Hour(booking.from_time)} – {formatTime12Hour(booking.to_time)}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">({booking.slot_period} Slot)</span>
              </div>
              <div>
                <span className="text-slate-500">Area Reserved: </span>
                <span className="font-bold text-slate-900 block">{booking.auditorium_area}</span>
              </div>
              <div>
                <span className="text-slate-500">Air Conditioning: </span>
                <span className="font-bold text-slate-900 block">{booking.ac_type}</span>
              </div>
              <div>
                <span className="text-slate-500">Booking Status: </span>
                <span className="font-bold text-emerald-700 block">{booking.status}</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="py-5 border-b-2 border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase text-[10px] text-left">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 font-medium text-slate-800">
                    Auditorium Reservation Charges ({booking.auditorium_area}, {booking.ac_type})
                  </td>
                  <td className="py-2.5 font-mono font-bold text-slate-900 text-right">
                    ₹ {Number(booking.total_amount).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className="bg-emerald-50/60">
                  <td className="py-2.5 px-1 font-semibold text-emerald-900">
                    {Number(booking.pending_amount) <= 0 ? 'Total Payment Received (Fully Paid)' : 'Advance Payment Received'}
                  </td>
                  <td className="py-2.5 px-1 font-mono font-bold text-emerald-800 text-right">
                    ₹ {Number(booking.advance_amount).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className={Number(booking.pending_amount) <= 0 ? 'bg-emerald-50/30 font-bold' : 'bg-amber-50/60 font-bold'}>
                  <td className={`py-3 px-1 text-sm ${Number(booking.pending_amount) <= 0 ? 'text-emerald-950' : 'text-amber-950'}`}>
                    Pending Balance Due
                  </td>
                  <td className={`py-3 px-1 font-mono text-sm text-right ${Number(booking.pending_amount) <= 0 ? 'text-emerald-800' : 'text-amber-900'}`}>
                    ₹ {Number(booking.status === 'Cancelled' ? 0 : booking.pending_amount).toLocaleString('en-IN')}
                    {Number(booking.pending_amount) <= 0 && <span className="text-[10px] text-emerald-600 font-sans ml-1">(Nil)</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Signature & Terms */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="text-[11px] leading-relaxed">
                * This receipt is computer generated and valid upon confirmation of advance payment.
                <br />
                * Cancellation rules apply as per auditorium management policy.
              </p>
            </div>
            <div className="text-right flex flex-col items-end justify-end">
              <div className="w-44 border-t border-slate-400 pt-1 text-center font-bold text-slate-800">
                Authorised Signatory
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 text-center w-44">Tejus Auditorium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen Standard A4 Print Template (794px @ 96DPI, Zero Media Query Interference) */}
      <div
        ref={printTemplateRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '794px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '44px 48px',
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          zIndex: -100,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: '2px solid #0f172a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <Building2 style={{ width: '28px', height: '28px', color: '#1d4ed8' }} />
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px', color: '#020617', textTransform: 'uppercase' }}>
              Tejus Auditorium
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Auditorium Booking & Payment Receipt
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
            Enquiries & Booking: <span style={{ fontWeight: 700, color: '#1e40af' }}>9447241559</span>
          </p>
        </div>

        {/* Reference Numbers & Dates */}
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', padding: '6px 0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Receipt Number</div>
                <div style={{ fontSize: '15px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{receiptNo}</div>
                
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: '10px' }}>Booking ID</div>
                <div style={{ fontSize: '15px', fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8', marginTop: '2px' }}>{booking.booking_id}</div>
              </td>
              <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'right', padding: '6px 0' }}>
                <div style={{ fontSize: '11px', color: '#2563eb', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                  ★ Programme Date (Event Date)
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                  {formatDateReadable(booking.programme_date)}
                </div>

                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginTop: '10px' }}>
                  Booking Date: <span style={{ color: '#0f172a', fontWeight: 700 }}>{formatDateReadable(booking.booking_date)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Customer Information */}
        <div style={{ margin: '16px 0', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>
            Customer Information
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '33.33%', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Name:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{booking.customer_name}</div>
                </td>
                <td style={{ width: '33.33%', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Mobile Phone:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e40af', fontFamily: 'monospace', marginTop: '2px' }}>
                    {booking.customer_phone || '—'}
                  </div>
                </td>
                <td style={{ width: '33.33%', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Address / Place:</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b', marginTop: '2px' }}>{booking.customer_address || '—'}</div>
                </td>
              </tr>
              {booking.referred_by && (
                <tr>
                  <td colSpan={3} style={{ paddingTop: '8px', fontSize: '12px', color: '#64748b' }}>
                    Referred By: <span style={{ fontWeight: 600, color: '#0f172a' }}>{booking.referred_by}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Programme & Event Details */}
        <div style={{ margin: '16px 0', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>
            Programme & Event Details
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '33.33%', verticalAlign: 'top', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Programme Event:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{booking.programme_type}</div>
                </td>
                <td style={{ width: '33.33%', verticalAlign: 'top', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Event Date:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', marginTop: '2px' }}>{formatDateReadable(booking.programme_date)}</div>
                </td>
                <td style={{ width: '33.33%', verticalAlign: 'top', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Slot / Timing:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {formatTime12Hour(booking.from_time)} – {formatTime12Hour(booking.to_time)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>({booking.slot_period} Slot)</div>
                </td>
              </tr>
              <tr>
                <td style={{ width: '33.33%', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Area Reserved:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{booking.auditorium_area}</div>
                </td>
                <td style={{ width: '33.33%', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Air Conditioning:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{booking.ac_type}</div>
                </td>
                <td style={{ width: '33.33%', verticalAlign: 'top' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Booking Status:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#047857', marginTop: '2px' }}>{booking.status}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown Table */}
        <div style={{ margin: '18px 0', paddingBottom: '18px', borderBottom: '2px solid #0f172a' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #cbd5e1', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px', fontWeight: 700 }}>Description</th>
                <th style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 4px', fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                  Auditorium Reservation Charges ({booking.auditorium_area}, {booking.ac_type})
                </td>
                <td style={{ padding: '10px 4px', fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>
                  ₹ {Number(booking.total_amount).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#ecfdf5' }}>
                <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: 700, color: '#065f46' }}>
                  {Number(booking.pending_amount) <= 0 ? 'Total Payment Received (Fully Paid)' : 'Advance Payment Received'}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#065f46', textAlign: 'right' }}>
                  ₹ {Number(booking.advance_amount).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ backgroundColor: Number(booking.pending_amount) <= 0 ? '#f0fdf4' : '#fef3c7' }}>
                <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: 800, color: Number(booking.pending_amount) <= 0 ? '#166534' : '#78350f' }}>
                  Pending Balance Due
                </td>
                <td style={{ padding: '12px 8px', fontSize: '16px', fontFamily: 'monospace', fontWeight: 800, color: Number(booking.pending_amount) <= 0 ? '#166534' : '#78350f', textAlign: 'right' }}>
                  ₹ {Number(booking.status === 'Cancelled' ? 0 : booking.pending_amount).toLocaleString('en-IN')}
                  {Number(booking.pending_amount) <= 0 && ' (Nil)'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Signature & Terms */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
          <tbody>
            <tr>
              <td style={{ width: '60%', verticalAlign: 'bottom', fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                * This receipt is computer generated and valid upon confirmation of advance payment.
                <br />
                * Cancellation rules apply as per auditorium management policy.
              </td>
              <td style={{ width: '40%', verticalAlign: 'bottom', textAlign: 'right' }}>
                <div style={{ display: 'inline-block', width: '180px', borderTop: '1px solid #94a3b8', paddingTop: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Authorised Signatory</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Tejus Auditorium</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
