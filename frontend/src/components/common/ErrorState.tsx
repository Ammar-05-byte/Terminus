import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="p-3.5 rounded-full bg-rose-50 text-rose-500 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
