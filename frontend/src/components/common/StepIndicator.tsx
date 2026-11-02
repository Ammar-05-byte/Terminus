import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: number;
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = '',
}) => {
  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && step.id <= currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step item */}
              <div
                className={`flex flex-col items-center relative ${
                  isClickable ? 'cursor-pointer' : ''
                }`}
                onClick={() => isClickable && onStepClick(step.id)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border-2 ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <div className="text-center mt-2">
                  <p
                    className={`text-xs font-semibold whitespace-nowrap ${
                      isCurrent
                        ? 'text-blue-700'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-slate-400 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connecting line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-6 transition-colors duration-200 ${
                    step.id < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
