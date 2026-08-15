'use client';

import React from 'react';
import { convert24to12, convert12to24 } from '@/lib/time-utils';

interface TimePicker12Props {
  value: string; // HH:mm 24-hour format
  onChange: (val: string) => void;
  label?: string;
  disabled?: boolean;
}

export const TimePicker12: React.FC<TimePicker12Props> = ({
  value,
  onChange,
  label,
  disabled = false,
}) => {
  const { hour, minute, ampm } = convert24to12(value || '09:00');

  const handleHourChange = (newHour: number) => {
    const time24 = convert12to24(newHour, minute, ampm);
    onChange(time24);
  };

  const handleMinuteChange = (newMinute: number) => {
    const time24 = convert12to24(hour, newMinute, ampm);
    onChange(time24);
  };

  const handleAmPmChange = (newAmPm: 'AM' | 'PM') => {
    const time24 = convert12to24(hour, minute, newAmPm);
    onChange(time24);
  };

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = [0, 15, 30, 45];

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1 sm:gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
        {/* Hour Dropdown */}
        <select
          disabled={disabled}
          value={hour}
          onChange={(e) => handleHourChange(Number(e.target.value))}
          className="bg-transparent font-bold text-xs sm:text-sm text-slate-900 px-1.5 py-1.5 focus:outline-none rounded-lg cursor-pointer"
        >
          {hoursList.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <span className="font-bold text-slate-400 text-xs sm:text-sm">:</span>

        {/* Minute Dropdown */}
        <select
          disabled={disabled}
          value={minute}
          onChange={(e) => handleMinuteChange(Number(e.target.value))}
          className="bg-transparent font-bold text-xs sm:text-sm text-slate-900 px-1.5 py-1.5 focus:outline-none rounded-lg cursor-pointer"
        >
          {minutesList.map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, '0')}
            </option>
          ))}
        </select>

        {/* AM / PM Segmented Control */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg ml-auto border border-slate-200/80">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleAmPmChange('AM')}
            className={`px-2 py-1 rounded-md text-[10px] font-extrabold transition-all ${
              ampm === 'AM'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleAmPmChange('PM')}
            className={`px-2 py-1 rounded-md text-[10px] font-extrabold transition-all ${
              ampm === 'PM'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};
