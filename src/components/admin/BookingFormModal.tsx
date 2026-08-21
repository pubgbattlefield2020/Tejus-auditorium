'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Tag,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Building,
  Wind,
  Trash,
  HelpCircle,
  Loader2,
  Plus,
  Check,
} from 'lucide-react';
import { Booking, BookingStatus, ACType, AuditoriumArea, SlotPeriod } from '@/types';
import {
  getSlotPeriodFromTime,
  hasBookingConflict,
  getAvailabilityConflictPreview,
  formatDateReadable,
  formatTime12Hour,
  getTodayISTString,
  timeToMinutes,
  isValidIndianMobile,
  cleanMobileNumber,
} from '@/lib/time-utils';
import { syncBookingToGoogleSheets } from '@/lib/google-sheets';
import { TimePicker12 } from '@/components/common/TimePicker12';
import { supabase } from '@/lib/supabase';
import gsap from 'gsap';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  initialDate?: string;
  initialBooking?: Booking | null;
  existingBookingsOnDate?: Booking[];
  allBookings?: Booking[];
  adminEmail?: string;
}

const DEFAULT_PROGRAMME_TYPES = [
  'Wedding',
  'Wedding Reception',
  'Engagement',
  'Birthday Party',
  'Conference / Seminar',
  'Cultural Programme',
  'Meeting / Corporate',
  'Exhibition',
  'Prayer / Religious Meet',
  'Other / Custom Type',
];

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialBooking,
  existingBookingsOnDate = [],
  allBookings = [],
  adminEmail = 'admin@tejusauditorium.com',
}) => {
  const isEditMode = !!initialBooking;
  const todayIST = getTodayISTString();

  // Form States
  const [bookingId, setBookingId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [bookingDate, setBookingDate] = useState(todayIST);
  const [programmeDate, setProgrammeDate] = useState(initialDate || todayIST);
  const [fromTime, setFromTime] = useState('09:00');
  const [toTime, setToTime] = useState('13:00');

  // Programme Type States
  const [programmeTypeOptions, setProgrammeTypeOptions] = useState<string[]>(DEFAULT_PROGRAMME_TYPES);
  const [selectedProgrammeType, setSelectedProgrammeType] = useState('Wedding');
  const [customProgrammeType, setCustomProgrammeType] = useState('');
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);

  const [acType, setAcType] = useState<ACType>('AC');
  const [auditoriumArea, setAuditoriumArea] = useState<AuditoriumArea>('Full Auditorium');
  const [wasteCleaning, setWasteCleaning] = useState<boolean>(false);
  const [referredBy, setReferredBy] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>(25000);
  const [advanceAmount, setAdvanceAmount] = useState<number | ''>(5000);
  const [status, setStatus] = useState<BookingStatus>('Confirmed');

  const [dateBookings, setDateBookings] = useState<Booking[]>([]);
  const [loadingDateBookings, setLoadingDateBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculated Slot Period
  const calculatedSlotPeriod: SlotPeriod = useMemo(() => {
    return getSlotPeriodFromTime(fromTime);
  }, [fromTime]);

  // Auto-calculated Pending Amount
  const pendingAmount = useMemo(() => {
    const total = typeof totalAmount === 'number' ? totalAmount : 0;
    const advance = typeof advanceAmount === 'number' ? advanceAmount : 0;
    return Math.max(0, total - advance);
  }, [totalAmount, advanceAmount]);

  // Reset or Populate form on open
  useEffect(() => {
    if (isOpen) {
      if (initialBooking) {
        setBookingId(initialBooking.booking_id);
        setCustomerName(initialBooking.customer_name);
        setCustomerPhone(initialBooking.customer_phone || '');
        setCustomerAddress(initialBooking.customer_address || '');
        setBookingDate(initialBooking.booking_date);
        setProgrammeDate(initialBooking.programme_date);
        setFromTime(initialBooking.from_time.slice(0, 5));
        setToTime(initialBooking.to_time.slice(0, 5));

        // Check if existing programme type is in default list
        const progType = initialBooking.programme_type;
        if (DEFAULT_PROGRAMME_TYPES.includes(progType)) {
          setSelectedProgrammeType(progType);
          setShowCustomTypeInput(progType === 'Other / Custom Type');
          setCustomProgrammeType('');
        } else {
          // Custom type from before
          if (!programmeTypeOptions.includes(progType)) {
            setProgrammeTypeOptions((prev) => [progType, ...prev]);
          }
          setSelectedProgrammeType('Other / Custom Type');
          setShowCustomTypeInput(true);
          setCustomProgrammeType(progType);
        }

        setAcType(initialBooking.ac_type);
        setAuditoriumArea(initialBooking.auditorium_area);
        setWasteCleaning(initialBooking.waste_cleaning);
        setReferredBy(initialBooking.referred_by || '');
        setTotalAmount(initialBooking.total_amount);
        setAdvanceAmount(initialBooking.advance_amount);
        setStatus(initialBooking.status);
      } else {
        const freshToday = getTodayISTString();
        const defaultProgDate = initialDate || freshToday;
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const year = defaultProgDate.split('-')[0] || String(new Date().getFullYear());
        setBookingId(`TA-${year}-${randomNum}`);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setBookingDate(freshToday);
        setProgrammeDate(defaultProgDate);
        setFromTime('09:00');
        setToTime('13:00');
        setSelectedProgrammeType('Wedding');
        setShowCustomTypeInput(false);
        setCustomProgrammeType('');
        setAcType('AC');
        setAuditoriumArea('Full Auditorium');
        setWasteCleaning(false);
        setReferredBy('');
        setTotalAmount(25000);
        setAdvanceAmount(5000);
        setStatus('Confirmed');
      }
      setFormError(null);

      // GSAP Animation
      if (modalRef.current && backdropRef.current) {
        gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
        gsap.fromTo(modalRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' });
      }
    }
  }, [isOpen, initialBooking, initialDate, todayIST]);

  // Fetch active bookings on selected programme_date for real-time conflict checking
  useEffect(() => {
    if (!isOpen || !programmeDate) return;

    let active = true;
    setLoadingDateBookings(true);

    supabase
      .from('bookings')
      .select('*')
      .eq('programme_date', programmeDate)
      .is('deleted_at', null)
      .neq('status', 'Cancelled')
      .then(({ data, error }) => {
        if (active) {
          if (!error && data) {
            setDateBookings(data as Booking[]);
          }
          setLoadingDateBookings(false);
        }
      })
      .catch(() => {
        if (active) setLoadingDateBookings(false);
      });

    return () => {
      active = false;
    };
  }, [programmeDate, isOpen]);

  // Real-time conflict preview analysis with unified multi-source candidate merging
  const conflictAnalysis = useMemo(() => {
    const bookingsMap = new Map<string, Booking>();

    // 1. From allBookings in parent dashboard memory (instantaneous synchronous check)
    if (allBookings && allBookings.length > 0) {
      allBookings
        .filter((b) => b.programme_date === programmeDate && !b.deleted_at && b.status !== 'Cancelled')
        .forEach((b) => {
          const key = b.id || b.booking_id;
          if (key) bookingsMap.set(key, b);
        });
    }

    // 2. From existingBookingsOnDate prop
    if (existingBookingsOnDate && existingBookingsOnDate.length > 0) {
      existingBookingsOnDate
        .filter((b) => !b.deleted_at && b.status !== 'Cancelled')
        .forEach((b) => {
          const key = b.id || b.booking_id;
          if (key) bookingsMap.set(key, b);
        });
    }

    // 3. From locally queried dateBookings from Supabase
    if (dateBookings && dateBookings.length > 0) {
      dateBookings
        .filter((b) => b.programme_date === programmeDate && !b.deleted_at && b.status !== 'Cancelled')
        .forEach((b) => {
          const key = b.id || b.booking_id;
          if (key) bookingsMap.set(key, b);
        });
    }

    const mergedBookings = Array.from(bookingsMap.values());

    return getAvailabilityConflictPreview(
      programmeDate,
      fromTime,
      toTime,
      mergedBookings,
      initialBooking?.id
    );
  }, [programmeDate, fromTime, toTime, allBookings, existingBookingsOnDate, dateBookings, initialBooking?.id]);

  // Time preset helper
  const setTimePreset = (from: string, to: string) => {
    setFromTime(from);
    setToTime(to);
  };

  // Validation
  const isTimeOrderValid = timeToMinutes(fromTime) < timeToMinutes(toTime);
  const numTotal = Number(totalAmount) || 0;
  const numAdvance = Number(advanceAmount) || 0;
  const isAmountValid = numTotal >= 0 && numAdvance >= 0 && numAdvance <= numTotal;
  const isCustomerNameFilled = customerName.trim().length > 0;
  const isPhoneValid = isValidIndianMobile(customerPhone);
  const isConflictFree = status === 'Cancelled' || conflictAnalysis.isValid;

  // Final Programme Type String
  const resolvedProgrammeType = useMemo(() => {
    if (selectedProgrammeType === 'Other / Custom Type') {
      return customProgrammeType.trim() || 'Other Event';
    }
    return selectedProgrammeType;
  }, [selectedProgrammeType, customProgrammeType]);

  const isCustomTypeValid = selectedProgrammeType !== 'Other / Custom Type' || customProgrammeType.trim().length > 0;

  const canSubmit =
    isCustomerNameFilled &&
    isPhoneValid &&
    isTimeOrderValid &&
    isAmountValid &&
    isConflictFree &&
    isCustomTypeValid &&
    !submitting;

  const handleProgrammeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProgrammeType(val);
    if (val === 'Other / Custom Type') {
      setShowCustomTypeInput(true);
      setTimeout(() => customInputRef.current?.focus(), 100);
    } else {
      setShowCustomTypeInput(false);
    }
  };

  const handleAddNewTypeClick = () => {
    setSelectedProgrammeType('Other / Custom Type');
    setShowCustomTypeInput(true);
    setTimeout(() => customInputRef.current?.focus(), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isCustomerNameFilled) {
      setFormError('Please enter the customer name.');
      return;
    }
    if (!isPhoneValid) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 9447241559).');
      return;
    }
    if (!isTimeOrderValid) {
      setFormError('Start time must be strictly earlier than End time.');
      return;
    }
    if (!isAmountValid) {
      setFormError('Please check payment amounts (Advance cannot exceed Total).');
      return;
    }
    if (status !== 'Cancelled' && !conflictAnalysis.isValid) {
      setFormError(conflictAnalysis.message || 'Time conflict detected with an existing booking or buffer.');
      return;
    }

    setSubmitting(true);

    try {
      // Live server verification right before submission
      if (status !== 'Cancelled') {
        const { data: freshLiveBookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('programme_date', programmeDate)
          .is('deleted_at', null)
          .neq('status', 'Cancelled');

        if (freshLiveBookings) {
          setDateBookings(freshLiveBookings as Booking[]);
          const liveConflict = getAvailabilityConflictPreview(
            programmeDate,
            fromTime,
            toTime,
            freshLiveBookings as Booking[],
            initialBooking?.id
          );
          if (!liveConflict.isValid) {
            setFormError(liveConflict.message || 'Time conflict detected with an existing booking or buffer.');
            setSubmitting(false);
            return;
          }
        }
      }

      const payload: Partial<Booking> = {
        booking_id: bookingId.trim(),
        customer_name: customerName.trim(),
        customer_phone: cleanMobileNumber(customerPhone.trim()) || null,
        customer_address: customerAddress.trim() || null,
        booking_date: bookingDate,
        programme_date: programmeDate,
        from_time: fromTime,
        to_time: toTime,
        slot_period: calculatedSlotPeriod,
        programme_type: resolvedProgrammeType,
        ac_type: acType,
        auditorium_area: auditoriumArea,
        waste_cleaning: wasteCleaning,
        referred_by: referredBy.trim() || null,
        total_amount: numTotal,
        advance_amount: numAdvance,
        status: status,
      };

      if (isEditMode && initialBooking) {
        const { data, error } = await supabase
          .from('bookings')
          .update(payload)
          .eq('id', initialBooking.id)
          .select()
          .single();

        if (error) throw error;

        const isNowCancelled = payload.status === 'Cancelled' && initialBooking.status !== 'Cancelled';

        await supabase.from('activity_logs').insert({
          booking_id: bookingId.trim(),
          action: isNowCancelled ? 'CANCEL' : 'UPDATE',
          admin_email: adminEmail,
          details: {
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            programme_date: data.programme_date,
            from_time: data.from_time,
            to_time: data.to_time,
            slot_period: data.slot_period,
            previous_status: initialBooking.status,
            new_status: data.status,
            changes: payload,
            previous: initialBooking,
          },
        });

        // Google Sheets live sync (background)
        syncBookingToGoogleSheets(isNowCancelled ? 'CANCEL' : 'UPDATE', data as Booking);

        onSuccess(data as Booking);
      } else {
        const { data, error } = await supabase
          .from('bookings')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          booking_id: data.booking_id,
          action: 'CREATE',
          admin_email: adminEmail,
          details: {
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_address: data.customer_address,
            programme_date: data.programme_date,
            from_time: data.from_time,
            to_time: data.to_time,
            slot_period: data.slot_period,
            programme_type: data.programme_type,
            ac_type: data.ac_type,
            auditorium_area: data.auditorium_area,
            waste_cleaning: data.waste_cleaning,
            referred_by: data.referred_by,
            total_amount: data.total_amount,
            advance_amount: data.advance_amount,
            pending_amount: data.pending_amount,
            status: data.status,
          },
        });

        // Google Sheets live sync (background)
        syncBookingToGoogleSheets('CREATE', data as Booking);

        onSuccess(data as Booking);
      }

      onClose();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('conflict') || msg.includes('buffer')) {
        setFormError('This time slot conflicts with an existing booking or the mandatory 1-hour buffer. Please adjust the timing.');
      } else {
        setFormError(err.message || 'Unable to save booking. Please verify all fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Modal / Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-8 max-h-[92vh] overflow-y-auto z-10 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {isEditMode ? 'Edit Booking' : 'Create New Booking'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tejus Auditorium • {formatDateReadable(programmeDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Top Row: Booking ID & Booking Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Booking ID <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                required
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="TA-2026-00001"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Booking Date <span className="text-blue-600">*</span>
                </label>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                  Current Date
                </span>
              </div>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Customer Name, Mobile Number & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Customer Name <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Mobile Number Field with Real-Time Validation Feedback */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mobile Number <span className="text-blue-600">*</span>
                </label>
                {customerPhone && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      isPhoneValid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isPhoneValid ? '✓ Valid' : '10 digits (6-9)'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  maxLength={13}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9847123456"
                  className={`w-full pl-9 pr-3 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-mono ${
                    customerPhone
                      ? isPhoneValid
                        ? 'border-emerald-400 focus:border-emerald-600 ring-emerald-500/20'
                        : 'border-amber-400 focus:border-amber-600 ring-amber-500/20'
                      : 'border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Address / Place
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="City, District"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Programme Details */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Programme Schedule & Timing
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                1-Hour Buffer Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Programme Date (Event Date) <span className="text-blue-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={programmeDate}
                  onChange={(e) => setProgrammeDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              {/* Programme Type with Option to Add Custom Type */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Programme Type <span className="text-blue-600">*</span>
                  </label>
                  {!showCustomTypeInput && (
                    <button
                      type="button"
                      onClick={handleAddNewTypeClick}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Custom Type</span>
                    </button>
                  )}
                </div>

                <select
                  value={selectedProgrammeType}
                  onChange={handleProgrammeTypeChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                >
                  {programmeTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                {/* Additional Field: Custom Programme Type Input */}
                {showCustomTypeInput && (
                  <div className="mt-2 animate-in slide-in-from-top-1 duration-150">
                    <div className="relative">
                      <Tag className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        ref={customInputRef}
                        type="text"
                        required
                        value={customProgrammeType}
                        onChange={(e) => setCustomProgrammeType(e.target.value)}
                        placeholder="Enter custom programme name (e.g. Dance Fest, Annual Day)..."
                        className="w-full pl-8.5 pr-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 12-Hour Time Pickers (AM/PM) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600">
                  Timings (12-Hour AM/PM) <span className="text-blue-600">*</span>
                </label>
                {/* Presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setTimePreset('09:00', '13:00')}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 hover:border-blue-400 text-slate-700 cursor-pointer"
                  >
                    Morning (9 AM - 1 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimePreset('15:00', '19:00')}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 hover:border-blue-400 text-slate-700 cursor-pointer"
                  >
                    Evening (3 PM - 7 PM)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <TimePicker12
                  label="From Time"
                  value={fromTime}
                  onChange={setFromTime}
                />

                <TimePicker12
                  label="To Time"
                  value={toTime}
                  onChange={setToTime}
                />

                {/* Auto Calculated Slot Badge */}
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">Slot Category</div>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 flex items-center justify-between">
                    <span>{calculatedSlotPeriod} Slot</span>
                    <span className="text-[10px] font-semibold text-blue-600">
                      {calculatedSlotPeriod === 'Morning' ? '(< 1 PM)' : '(≥ 1 PM)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Conflict Preview Card & Friendly Alert */}
            <div className="pt-2">
              {loadingDateBookings ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2 text-xs">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  <span className="font-medium">Checking live availability on {formatDateReadable(programmeDate)}...</span>
                </div>
              ) : conflictAnalysis.isValid ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Time Slot Available!</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {formatTime12Hour(fromTime)} to {formatTime12Hour(toTime)} is clear and respects the mandatory 1-hour buffer.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Slot Unavailable / Buffer Conflict</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">{conflictAnalysis.message}</p>
                    </div>
                  </div>

                  {conflictAnalysis.existingSlots.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200/60 text-[11px]">
                      <span className="font-bold text-amber-900">Existing on {formatDateReadable(programmeDate)}:</span>
                      <ul className="mt-1 space-y-1">
                        {conflictAnalysis.existingSlots.map((s, idx) => (
                          <li key={idx} className="flex items-center justify-between">
                            <span>
                              • {s.from} – {s.to} {s.customer ? `(${s.customer})` : ''}
                            </span>
                            <span className="font-semibold text-amber-700">1h Buffer until: {s.bufferTo}</span>
                          </li>
                        ))}
                      </ul>
                      {conflictAnalysis.suggestedNextAvailable && (
                        <div className="mt-1.5 font-bold text-emerald-700">
                          Suggested next start time: {conflictAnalysis.suggestedNextAvailable} onwards
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Area, AC, Waste Cleaning, and Referred By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auditorium Area */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Auditorium Area <span className="text-slate-400 text-[10px] font-normal">(Informational)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Ground Floor', 'Full Auditorium'] as AuditoriumArea[]).map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setAuditoriumArea(area)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      auditoriumArea === area
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* AC / Non-AC */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                AC / Non-AC Option
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['AC', 'Non-AC'] as ACType[]).map((ac) => (
                  <button
                    key={ac}
                    type="button"
                    onClick={() => setAcType(ac)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      acType === ac
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {ac}
                  </button>
                ))}
              </div>
            </div>

            {/* Waste Cleaning */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Waste Cleaning
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'No', val: false },
                  { label: 'Yes (Included)', val: true },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setWasteCleaning(item.val)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      wasteCleaning === item.val
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Referred By */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Referred By <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                placeholder="e.g. Mr. Sharma / Agent"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Payment & Billing Details
              </span>
              <span className="text-xs font-bold text-slate-600">Currency: INR (₹)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Total Amount (₹) <span className="text-blue-600">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Advance Amount (₹) <span className="text-blue-600">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={typeof totalAmount === 'number' ? totalAmount : undefined}
                  required
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pending Balance (₹)
                </label>
                <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-amber-900 font-mono flex items-center justify-between">
                  <span>₹ {pendingAmount.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-amber-700 font-semibold">(Auto)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Booking Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Confirmed', 'Completed', 'Cancelled'] as BookingStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    status === st
                      ? st === 'Confirmed'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : st === 'Completed'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2 ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/25 cursor-pointer'
                  : 'bg-slate-400 opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Booking...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Update Booking' : 'Confirm & Save Booking'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
