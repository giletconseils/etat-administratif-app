import React from 'react';

export interface Step {
  id: number;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  children?: React.ReactNode; // Contenu supplémentaire pour l'étape active
  compact?: boolean; // Mode compact pour masquer les étapes non actives
  isAnimatingCollapse?: boolean; // Animation de repli vers l'étape finale
}

export function Stepper({ steps, currentStep, onStepClick, children, compact = false, isAnimatingCollapse = false }: StepperProps) {
  return (
    <div className="w-full py-4">
      {/* Version verticale pour sidebar */}
      <div className="flex flex-col space-y-3">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && (isCompleted || isCurrent);
          
          // En mode compact, masquer les étapes non actives
          if (compact && !isCurrent && !isAnimatingCollapse) {
            return null;
          }
          
          // Pendant l'animation vers l'étape 3, les étapes 1 et 2 disparaissent
          const shouldAnimate = isAnimatingCollapse && step.id < 3;
          const animationClass = shouldAnimate ? `step-fade-out-${step.id}` : '';
          
          return (
            <React.Fragment key={step.id}>
              <div className={`flex items-start gap-4 group ${animationClass}`}>
                {/* Step circle with enhanced animations */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => isClickable && onStepClick(step.id)}
                    disabled={!isClickable}
                    className={`
                      relative w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      transition-all duration-300 ease-out
                      ${isCompleted 
                        ? 'bg-cursor-accent-green text-white shadow-md' 
                        : isCurrent 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'bg-cursor-bg-tertiary text-cursor-text-muted border-2 border-cursor-border-primary'
                      }
                      ${isClickable ? 'cursor-pointer hover:scale-110 hover:shadow-xl active:scale-100' : 'cursor-default'}
                    `}
                  >
                    {isCompleted ? (
                      <svg 
                        className="w-5 h-5 animate-in fade-in zoom-in duration-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={3} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    ) : (
                      <span className={`transition-all duration-300 ${isCurrent ? 'scale-105' : ''}`}>
                        {step.id}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Step label with fade animation */}
                <div className={`
                  flex-1 pt-2 transition-all duration-300
                  ${isCurrent ? 'translate-x-0 opacity-100' : 'translate-x-0 opacity-90'}
                `}>
                  <div className={`
                    text-base font-semibold transition-all duration-300
                    ${isCurrent 
                      ? 'text-cursor-text-primary scale-105' 
                      : isCompleted
                        ? 'text-cursor-text-secondary'
                        : 'text-cursor-text-muted'
                    }
                  `}>
                    {step.label}
                  </div>
                  {step.description && (
                    <div className={`
                      text-sm mt-1 transition-all duration-300
                      ${isCurrent 
                        ? 'text-cursor-text-secondary opacity-100' 
                        : 'text-cursor-text-muted opacity-75'
                      }
                    `}>
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Contenu additionnel pour l'étape active */}
              {isCurrent && children && (
                <div className="mt-3">
                  {children}
                </div>
              )}
              
              {/* Animated connector line verticale */}
              {index < steps.length - 1 && (
                <div className="flex items-center">
                  <div className="w-10 flex justify-center">
                    <div className="relative w-0.5 h-6">
                      {/* Background line */}
                      <div className="absolute inset-0 bg-cursor-border-primary rounded-full" />
                      
                      {/* Animated progress line */}
                      <div 
                        className={`
                          absolute inset-0 rounded-full transition-all duration-700 ease-out
                          ${isCompleted 
                            ? 'bg-cursor-accent-green shadow-sm scale-y-100' 
                            : 'bg-cursor-accent-button scale-y-0'
                          }
                          origin-top
                        `}
                        style={{
                          transform: isCompleted ? 'scaleY(1)' : 'scaleY(0)',
                        }}
                      />
                      
                      {/* Shimmer effect on active line - subtil */}
                      {isCompleted && (
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-shimmer" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

