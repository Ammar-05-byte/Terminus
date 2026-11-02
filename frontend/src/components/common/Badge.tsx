import React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  status?: string;
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  status,
  variant,
  size = 'md',
  className = '',
}) => {
  const normalized = (status || (typeof children === 'string' ? children : '')).toUpperCase().trim();

  let selectedVariant: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' = 'gray';

  if (variant) {
    selectedVariant = variant;
  } else {
    switch (normalized) {
      case 'CONFIRMED':
      case 'SUCCESS':
      case 'ACTIVE':
      case 'COMPLETED':
      case 'ON_TIME':
      case 'AVAILABLE':
        selectedVariant = 'green';
        break;
      case 'PENDING':
      case 'WAITING':
      case 'SCHEDULED':
      case 'IN_PROGRESS':
        selectedVariant = 'amber';
        break;
      case 'CANCELLED':
      case 'FAILED':
      case 'BOOKED':
      case 'DELAYED':
        selectedVariant = 'red';
        break;
      case 'REFUND_SUCCESS':
      case 'REFUNDED':
      case 'EXPRESS':
      case 'SUPERFAST':
        selectedVariant = 'blue';
        break;
      case 'EXPIRED':
      case 'INACTIVE':
      default:
        selectedVariant = 'gray';
        break;
    }
  }

  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/20',
    red: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/20',
    gray: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ring-1 ring-inset ${variantStyles[selectedVariant]} ${sizeStyles[size]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {children || status}
    </span>
  );
};
