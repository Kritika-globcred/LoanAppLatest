
'use client';

import type React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile'; // Corrected import path
import type { LoanStep } from '@/lib/loan-steps';

interface LoanProgressBarProps {
  steps: LoanStep[];
}

export function LoanProgressBar({ steps }: LoanProgressBarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const currentStepIndex = steps.findIndex(step => pathname.startsWith(step.path));

  // Don't render if steps are not defined or current step is not found
  if (!steps || steps.length === 0 || currentStepIndex === -1) {
    return null;
  }

  const renderStep = (step: LoanStep, index: number, isCurrent: boolean, isFirstOrLastInMobileChunk: boolean = false) => (
    <div
      key={step.path}
      className={cn(
        "flex items-center shrink-0",
        isCurrent ? "font-bold text-white" : "text-gray-400",
        isMobile && !isCurrent && !isFirstOrLastInMobileChunk ? "hidden" : "", // Hide non-current intermediate steps on mobile unless explicitly shown
         isMobile && isFirstOrLastInMobileChunk && "text-xs", // Smaller text for first/last on mobile
         isMobile && isCurrent && "text-sm" // Slightly larger for current on mobile
      )}
    >
      {isCurrent && <span className="progress-dot-active"></span>}
      <span className={cn(isCurrent ? "text-sm md:text-base" : "text-xs md:text-sm")}>{step.name}</span>
    </div>
  );

  const mobileElements: React.ReactNode[] = [];
  if (steps.length > 0) {
    // First step
    mobileElements.push(renderStep(steps[0], 0, currentStepIndex === 0, true));

    // Ellipsis after first if current is not 0, 1 and there are more than 2 steps
    if (currentStepIndex > 1 && steps.length > 2) {
        mobileElements.push(<span key="ellipsis-start" className="text-gray-400 text-xs px-1 shrink-0">...</span>);
    }

    // Current step if it's not the first and not the last
    if (currentStepIndex > 0 && currentStepIndex < steps.length - 1) {
        mobileElements.push(renderStep(steps[currentStepIndex], currentStepIndex, true, true));
    }

    // Ellipsis before last if current is not last, last-1 and there are more than 2 steps
    if (currentStepIndex < steps.length - 2 && steps.length > 2) {
         mobileElements.push(<span key="ellipsis-end" className="text-gray-400 text-xs px-1 shrink-0">...</span>);
    }
    
    // Last step, only if total steps > 1 and it's not the same as the first step already rendered
    if (steps.length > 1) {
        // Avoid re-rendering if it's the same as the first step (i.e. currentStepIndex is 0, and it's also the last step)
        if (currentStepIndex !== steps.length -1 || steps[0].path !== steps[steps.length -1].path ) {
             // Also avoid re-rendering if current is last and it was already rendered by the middle condition
            if(!(currentStepIndex === steps.length -1 && currentStepIndex > 0 && currentStepIndex < steps.length -1)){
                 mobileElements.push(renderStep(steps[steps.length - 1], steps.length - 1, currentStepIndex === steps.length - 1, true));
            }
        }
    }
  }


  return (
    <div className="w-full py-3 px-2 mb-3 border-b border-[hsl(var(--border)/0.3)]">
      <div className={cn(
        "flex items-center",
        isMobile ? "justify-between space-x-1" : "justify-around space-x-2"
      )}>
        {isMobile ? (
          mobileElements
        ) : (
          steps.map((step, index) => (
            <React.Fragment key={step.path}>
              {renderStep(step, index, index === currentStepIndex)}
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-[hsl(var(--border)/0.2)] mx-1 md:mx-2 min-w-[20px]"></div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}
