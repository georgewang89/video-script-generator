import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface Step {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface ProgressTrackerProps {
  steps: Step[];
  currentStep: string;
  onStepClick: (step: string) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  const currentIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = index <= currentIndex;
          
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(step.key)}
                  disabled={!isClickable}
                  className={`
                    relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200
                    ${isCompleted
                      ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                      : isCurrent
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                    }
                    ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </button>
                <span className={`
                  mt-2 text-sm font-medium text-center
                  ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'}
                `}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-4 transition-all duration-200
                  ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;