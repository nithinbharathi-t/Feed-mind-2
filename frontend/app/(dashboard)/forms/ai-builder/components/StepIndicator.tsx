'use client';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {/* Step 1 */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
            currentStep >= 1
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground'
          }`}
        >
          1
        </div>
        <span
          className={
            currentStep >= 1
              ? 'text-primary font-medium'
              : 'text-muted-foreground'
          }
        >
          Describe
        </span>
      </div>

      {/* Divider 1 */}
      <div
        className={`w-5.5 h-0.5 ${
          currentStep >= 2 ? 'bg-primary' : 'bg-border'
        }`}
      />

      {/* Step 2 */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
            currentStep >= 2
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground'
          }`}
        >
          2
        </div>
        <span
          className={
            currentStep >= 2
              ? 'text-primary font-medium'
              : 'text-muted-foreground'
          }
        >
          Review
        </span>
      </div>

      {/* Divider 2 */}
      <div
        className={`w-5.5 h-0.5 ${
          currentStep >= 3 ? 'bg-primary' : 'bg-border'
        }`}
      />

      {/* Step 3 */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
            currentStep >= 3
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground'
          }`}
        >
          3
        </div>
        <span
          className={
            currentStep >= 3
              ? 'text-primary font-medium'
              : 'text-muted-foreground'
          }
        >
          Build
        </span>
      </div>
    </div>
  );
}
