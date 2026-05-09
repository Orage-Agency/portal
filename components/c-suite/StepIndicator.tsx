interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = [
  'Offer & Info',
  'Payment',
  'Client Details',
  'Pricing',
  'Customizations',
  'Signature',
  'Documents'
];

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 -z-10" />
        {/* Progress bar fill */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-[#B68039] -z-10 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
        
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div key={stepNumber} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-heading text-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-[#B68039] text-black scale-110'
                    : isCompleted
                    ? 'bg-[#B68039]/60 text-black'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {stepNumber}
              </div>
              <span className={`mt-2 text-xs font-body ${isActive ? 'text-[#B68039]' : 'text-white/50'}`}>
                {stepLabels[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
