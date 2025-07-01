import { useState, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface StepConfig {
  id: string;
  title: string;
  required?: boolean;
  skippable?: boolean;
  completed?: boolean;
}

export interface StepStatus {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'error';
  timestamp?: number;
  error?: string;
}

export interface UseStepNavigationProps {
  steps: StepConfig[];
  initialStep?: number;
  onStepChange?: (currentStep: number, previousStep: number) => void;
  onStepComplete?: (stepId: string, stepIndex: number) => void;
  onStepSkip?: (stepId: string, stepIndex: number) => void;
  onFlowComplete?: () => void;
  validateStep?: (stepIndex: number, stepData?: any) => boolean | string;
  persistProgress?: boolean;
  storageKey?: string;
}

export interface UseStepNavigationReturn {
  currentStep: number;
  currentStepConfig: StepConfig;
  totalSteps: number;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  canSkipCurrent: boolean;
  stepStatuses: Record<string, StepStatus>;
  
  // Navigation methods
  goToNext: () => void;
  goToPrevious: () => void;
  goToStep: (stepIndex: number) => void;
  skipCurrent: () => void;
  reset: () => void;
  
  // Step management
  markStepComplete: (stepId: string) => void;
  markStepError: (stepId: string, error: string) => void;
  getStepStatus: (stepId: string) => StepStatus | undefined;
  
  // Analytics helpers
  getStepAnalytics: () => {
    completedSteps: number;
    skippedSteps: number;
    errorSteps: number;
    totalTime: number;
    averageTimePerStep: number;
  };
}

// ============================================================================
// ENHANCED STEP NAVIGATION HOOK
// ============================================================================

export const useStepNavigation = ({
  steps,
  initialStep = 0,
  onStepChange,
  onStepComplete,
  onStepSkip,
  onFlowComplete,
  persistProgress = false,
  storageKey = 'step-navigation-progress'
}: UseStepNavigationProps): UseStepNavigationReturn => {
  
  // Initialize step statuses from localStorage if persistence is enabled
  const getInitialStepStatuses = (): Record<string, StepStatus> => {
    if (!persistProgress) return {};
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.stepStatuses || {};
      }
    } catch (error) {
      console.warn('Failed to load persisted step progress:', error);
    }
    
    return {};
  };

  const [currentStep, setCurrentStep] = useState(() => {
    if (persistProgress) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.currentStep || initialStep;
        }
      } catch (error) {
        console.warn('Failed to load persisted step:', error);
      }
    }
    return initialStep;
  });

  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(getInitialStepStatuses);
  const [startTime] = useState(Date.now());

  // Persist progress to localStorage
  const persistProgressToStorage = useCallback((step: number, statuses: Record<string, StepStatus>) => {
    if (!persistProgress) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        currentStep: step,
        stepStatuses: statuses,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to persist step progress:', error);
    }
  }, [persistProgress, storageKey]);

  // Update step status
  const updateStepStatus = useCallback((stepId: string, status: Partial<StepStatus>) => {
    setStepStatuses(prev => {
      const updated = {
        ...prev,
        [stepId]: {
          ...prev[stepId],
          ...status,
          timestamp: status.timestamp || Date.now()
        }
      };
      
      persistProgressToStorage(currentStep, updated);
      return updated;
    });
  }, [currentStep, persistProgressToStorage]);

  // Computed values
  const currentStepConfig = useMemo(() => steps[currentStep], [steps, currentStep]);
  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  const progress = useMemo(() => {
    const completedSteps = Object.values(stepStatuses).filter(s => s.status === 'completed').length;
    return Math.round((completedSteps / totalSteps) * 100);
  }, [stepStatuses, totalSteps]);

  const canGoNext = useMemo(() => {
    if (isLastStep) return false;
    
    // Check if current step is completed or skippable
    const currentStatus = stepStatuses[currentStepConfig.id];
    return currentStatus?.status === 'completed' || currentStepConfig.skippable || false;
  }, [isLastStep, currentStepConfig, stepStatuses]);

  const canGoPrevious = !isFirstStep;
  const canSkipCurrent = (currentStepConfig.skippable && !currentStepConfig.required) || false;

  // Navigation methods
  const goToNext = useCallback(() => {
    if (!canGoNext) return;
    
    const previousStep = currentStep;
    const nextStep = currentStep + 1;
    
    setCurrentStep(nextStep);
    updateStepStatus(currentStepConfig.id, { status: 'active' });
    
    onStepChange?.(nextStep, previousStep);
    
    // Check if flow is complete
    if (isLastStep) {
      onFlowComplete?.();
    }
  }, [canGoNext, currentStep, currentStepConfig.id, onStepChange, onFlowComplete, isLastStep, updateStepStatus]);

  const goToPrevious = useCallback(() => {
    if (!canGoPrevious) return;
    
    const previousStep = currentStep;
    const newStep = currentStep - 1;
    
    setCurrentStep(newStep);
    updateStepStatus(steps[newStep].id, { status: 'active' });
    
    onStepChange?.(newStep, previousStep);
  }, [canGoPrevious, currentStep, steps, onStepChange, updateStepStatus]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= totalSteps) return;
    
    const previousStep = currentStep;
    setCurrentStep(stepIndex);
    updateStepStatus(steps[stepIndex].id, { status: 'active' });
    
    onStepChange?.(stepIndex, previousStep);
  }, [currentStep, totalSteps, steps, onStepChange, updateStepStatus]);

  const skipCurrent = useCallback(() => {
    if (!canSkipCurrent) return;
    
    updateStepStatus(currentStepConfig.id, { status: 'skipped' });
    onStepSkip?.(currentStepConfig.id, currentStep);
    
    goToNext();
  }, [canSkipCurrent, currentStepConfig.id, currentStep, onStepSkip, goToNext, updateStepStatus]);

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    setStepStatuses({});
    
    if (persistProgress) {
      localStorage.removeItem(storageKey);
    }
  }, [initialStep, persistProgress, storageKey]);

  // Step management methods
  const markStepComplete = useCallback((stepId: string) => {
    updateStepStatus(stepId, { status: 'completed' });
    onStepComplete?.(stepId, steps.findIndex(s => s.id === stepId));
  }, [updateStepStatus, onStepComplete, steps]);

  const markStepError = useCallback((stepId: string, error: string) => {
    updateStepStatus(stepId, { status: 'error', error });
  }, [updateStepStatus]);

  const getStepStatus = useCallback((stepId: string) => {
    return stepStatuses[stepId];
  }, [stepStatuses]);

  // Analytics helpers
  const getStepAnalytics = useCallback(() => {
    const statusArray = Object.values(stepStatuses);
    const completedSteps = statusArray.filter(s => s.status === 'completed').length;
    const skippedSteps = statusArray.filter(s => s.status === 'skipped').length;
    const errorSteps = statusArray.filter(s => s.status === 'error').length;
    const totalTime = Date.now() - startTime;
    const averageTimePerStep = completedSteps > 0 ? totalTime / completedSteps : 0;

    return {
      completedSteps,
      skippedSteps,
      errorSteps,
      totalTime,
      averageTimePerStep
    };
  }, [stepStatuses, startTime]);

  return {
    currentStep,
    currentStepConfig,
    totalSteps,
    progress,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious,
    canSkipCurrent,
    stepStatuses,
    
    goToNext,
    goToPrevious,
    goToStep,
    skipCurrent,
    reset,
    
    markStepComplete,
    markStepError,
    getStepStatus,
    
    getStepAnalytics
  };
};

export default useStepNavigation; 