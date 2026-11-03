import React from 'react';
import { Check } from 'lucide-react';

const steps = [
  { id: 1, label: 'Sınav Bilgileri' },
  { id: 2, label: 'Öğrenci Listesi' },
  { id: 3, label: 'Salon Bilgileri' },
  { id: 4, label: 'Seçenekler' },
  { id: 5, label: 'Oturma Planı' },
];

export default function StepIndicator({ currentStep, maxStep, onStepClick }) {
  return (
    <div className="flex items-center justify-center gap-0 py-6 select-none">
      {steps.map((step, i) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isReachable = step.id <= maxStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => isReachable && onStepClick(step.id)}
                disabled={!isReachable}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 cursor-pointer'
                    : isCurrent
                    ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-100 cursor-default scale-105'
                    : isReachable
                    ? 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer border border-slate-200'
                    : 'bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </button>
              <span
                className={`text-xs font-semibold hidden sm:block transition-colors ${
                  isCurrent
                    ? 'text-indigo-700 font-bold'
                    : isReachable
                    ? 'text-slate-500 hover:text-indigo-600 cursor-pointer'
                    : 'text-slate-300 opacity-60'
                }`}
                onClick={() => isReachable && onStepClick(step.id)}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-10 md:w-16 mx-1 mb-4 transition-all duration-500 ${
                  currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
