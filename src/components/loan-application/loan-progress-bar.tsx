
'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { LoanStep, ApplicationType } from '@/lib/loan-steps';

interface LoanProgressBarProps {
  steps: LoanStep[];
  hasOfferLetter?: boolean;
  applicationType?: ApplicationType;
}

export function LoanProgressBar({ steps, hasOfferLetter = false, applicationType = 'loan' }: LoanProgressBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get application type from URL params if not provided
  const urlApplicationType = searchParams?.get('type') as ApplicationType || 'loan';
  const effectiveAppType = applicationType || urlApplicationType;

  // Filter steps based on application type and offer letter status
  const filteredSteps = steps.filter(step => {
    // If step has no showForTypes, show it (backward compatibility)
    if (!step.showForTypes) return true;
    
    // Check if step is for current application type
    const isForCurrentType = step.showForTypes.includes(effectiveAppType);
    
    // If step doesn't depend on offer letter status, return based on type
    if (step.requiresOfferLetter === undefined) return isForCurrentType;
    
    // If step depends on offer letter status, check that too
    return isForCurrentType && (step.requiresOfferLetter === hasOfferLetter);
  });

  // Find current step index in filtered steps
  let currentStepIndex = -1;
  
  // First try to find by direct path match
  const currentPath = pathname || '';
  currentStepIndex = filteredSteps.findIndex(step => currentPath.startsWith(step.path));

  // If no direct match, check subStepPaths
  if (currentStepIndex === -1) {
    currentStepIndex = filteredSteps.findIndex(step =>
      step.subStepPaths?.some(subPath => currentPath.startsWith(subPath))
    );
  }

  // If we still can't find the current step, try to find it in the original steps
  if (currentStepIndex === -1) {
    const originalIndex = steps.findIndex(step => 
      currentPath.startsWith(step.path) || 
      step.subStepPaths?.some(subPath => currentPath.startsWith(subPath))
    );
    
    if (originalIndex !== -1) {
      // If we found the step in the original steps, find its position in filtered steps
      const stepPath = steps[originalIndex].path;
      currentStepIndex = filteredSteps.findIndex(step => step.path === stepPath);
    }
  }

  // Don't render if no steps to show
  if (!filteredSteps.length) {
    return null;
  }

  // Auto-scroll to current step when it changes
  useEffect(() => {
    if (scrollContainerRef.current && currentStepIndex !== -1) {
      const container = scrollContainerRef.current;
      const stepElements = container.querySelectorAll('[data-step-index]');
      const currentStepElement = stepElements[currentStepIndex] as HTMLElement;
      
      if (currentStepElement) {
        const containerWidth = container.clientWidth;
        const stepLeft = currentStepElement.offsetLeft;
        const stepWidth = currentStepElement.offsetWidth;
        const scrollTo = stepLeft + stepWidth / 2 - containerWidth / 2;
        
        container.scrollTo({
          left: scrollTo,
          behavior: 'smooth'
        });
      }
    }
  }, [currentStepIndex]);

  const renderStep = (step: LoanStep, index: number, isCurrent: boolean, isFirstOrLastInMobileChunk: boolean = false) => {
    return (
      <div
        key={step.path}
        data-step-index={index}
        className={cn(
          "flex items-center shrink-0 px-2 py-1",
          isCurrent ? "font-bold text-white" : "text-gray-400",
          isMobile && !isCurrent && !isFirstOrLastInMobileChunk ? "hidden" : "", // Hide non-current intermediate steps on mobile unless explicitly shown
          isMobile && isFirstOrLastInMobileChunk ? "text-xs" : "", // Smaller text for first/last on mobile
          isMobile && isCurrent ? "text-sm" : "" // Slightly larger for current on mobile
        )}
      >
        {isCurrent && <span className="progress-dot-active"></span>}
        <span className={cn(isCurrent ? "text-sm md:text-base" : "text-xs md:text-sm")}>
          {step.name}
        </span>
      </div>
    );
  };

  const mobileElements: React.ReactNode[] = [];
  if (filteredSteps.length > 0) {
    // First step
    mobileElements.push(renderStep(filteredSteps[0], 0, currentStepIndex === 0, true));

    // Ellipsis after first if current is not 0, 1 and there are more than 2 steps
    if (currentStepIndex > 1 && filteredSteps.length > 2) {
      mobileElements.push(
        <span key="ellipsis-start" className="text-gray-400 text-xs px-1 shrink-0">
          ...
        </span>
      );
    }

    // Current step if it's not the first and not the last
    if (currentStepIndex > 0 && currentStepIndex < filteredSteps.length - 1) {
      // Check if this step is already the first one rendered, to avoid duplication
      if (filteredSteps[currentStepIndex].path !== filteredSteps[0].path) {
        mobileElements.push(renderStep(filteredSteps[currentStepIndex], currentStepIndex, true, true));
      }
    }

    // Ellipsis before last if current is not last, last-1 and there are more than 2 steps
    if (currentStepIndex < filteredSteps.length - 2 && filteredSteps.length > 2) {
      // Avoid double ellipsis if current step is right before the last ellipsis segment
      if (!(currentStepIndex > 0 && currentStepIndex < filteredSteps.length - 1 && currentStepIndex + 1 === filteredSteps.length - 2)) {
        mobileElements.push(
          <span key="ellipsis-end" className="text-gray-400 text-xs px-1 shrink-0">
            ...
          </span>
        );
      }
    }

    // Last step, only if total steps > 1
    if (filteredSteps.length > 1) {
      // Avoid re-rendering if it's the same as the first step (i.e., currentStepIndex is 0, and it's also the last step)
      // Or if it's the same as the currently rendered middle step
      const isLastSameAsFirst = filteredSteps[0].path === filteredSteps[filteredSteps.length - 1].path && currentStepIndex === 0;
      const isLastSameAsCurrentMiddle = currentStepIndex > 0 && currentStepIndex < filteredSteps.length - 1 && currentStepIndex === filteredSteps.length - 1;

      if (!isLastSameAsFirst && !isLastSameAsCurrentMiddle) {
        mobileElements.push(
          renderStep(
            filteredSteps[filteredSteps.length - 1],
            filteredSteps.length - 1,
            currentStepIndex === filteredSteps.length - 1,
            true
          )
        );
      }
    }
  }


  return (
    <div className="w-full py-3 px-2 mb-3 border-b border-[hsl(var(--border)/0.3)]">
      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex items-center overflow-x-auto scrollbar-hide",
          isMobile ? "justify-between space-x-1" : "space-x-2",
          "whitespace-nowrap"
        )}
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE and Edge
        }}
      >
        {isMobile ? (
          mobileElements
        ) : (
          <>
            {filteredSteps.map((step, index) => (
              <React.Fragment key={`${step.path}-${index}`}>
                {renderStep(step, index, index === currentStepIndex)}
                {index < filteredSteps.length - 1 && (
                  <div className="h-px bg-[hsl(var(--border)/0.2)] mx-1 md:mx-2 min-w-[20px] flex-shrink-0"></div>
                )}
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
