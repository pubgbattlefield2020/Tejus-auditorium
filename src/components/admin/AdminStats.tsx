'use client';

import React from 'react';
import { Calendar, DollarSign, Clock, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { DashboardStats } from '@/types';

interface AdminStatsProps {
  stats: DashboardStats;
}

export const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const statItems = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      subtitle: `${stats.currentMonthBookings} this month`,
      icon: Calendar,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingBookings,
      subtitle: 'Future scheduled events',
      icon: Clock,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100',
    },
    {
      title: 'Gross Amount',
      value: formatCurrency(stats.totalAmount),
      subtitle: 'Gross booking value',
      icon: DollarSign,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-100',
    },
    {
      title: 'Advance Collected',
      value: formatCurrency(stats.totalAdvance),
      subtitle: 'Received payments',
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Pending Balance',
      value: formatCurrency(stats.totalPending),
      subtitle: 'To be collected',
      icon: AlertCircle,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        const isLastItem = idx === statItems.length - 1;

        return (
          <div
            key={idx}
            className={`glass-card rounded-2xl p-3 sm:p-5 border ${item.borderColor} shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
              isLastItem ? 'col-span-2 lg:col-span-1' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">{item.title}</span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${item.bgColor} flex items-center justify-center ${item.iconColor}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight font-mono">
                {item.value}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">{item.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
