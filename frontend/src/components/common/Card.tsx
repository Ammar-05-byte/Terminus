import React, { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClassName = '',
  footer,
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            {title && (
              <div className="text-base font-semibold text-slate-800">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
};
