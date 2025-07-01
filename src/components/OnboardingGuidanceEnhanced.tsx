import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface GuidanceStep {
  id: string;
  target: string; // CSS selector or ref
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'focus' | 'none';
  required?: boolean;
  showPointer?: boolean; // New: Show animated pointer for this step
}

export interface GuidanceTour {
  id: string;
  title: string;
  description: string;
  steps: GuidanceStep[];
  module: string;
  version: string;
}

export interface UserGuidanceState {
  completedTours: string[];
  dismissedPopups: string[];
  lastSeenVersion: Record<string, string>;
  activeTour?: {
    tourId: string;
    currentStep: number;
    timestamp: number;
  };
  preferences: {
    showTooltips: boolean;
    showHotspots: boolean;
    autoStartTours: boolean;
  };
}

export interface GuidanceError {
  message: string;
  type: 'loading' | 'saving' | 'network' | 'validation';
  timestamp: number;
}

// ============================================================================
// ENHANCED GUIDANCE CONTEXT
// ============================================================================

interface GuidanceContextType {
  startTour: (tourId: string) => void;
  showPopup: (popupId: string, content: string) => void;
  showHotspot: (elementId: string, message: string) => void;
  hideHotspot: (elementId: string) => void;
  markTourComplete: (tourId: string) => void;
  markPopupDismissed: (popupId: string) => void;
  isTourCompleted: (tourId: string) => boolean;
  isPopupDismissed: (popupId: string) => boolean;
  userState: UserGuidanceState;
  error: GuidanceError | null;
  clearError: () => void;
  submitFeedback: (tourId: string, rating: number, comment?: string) => void;
}

const GuidanceContext = React.createContext<GuidanceContextType | null>(null);

export const useGuidance = () => {
  const context = React.useContext(GuidanceContext);
  if (!context) {
    throw new Error('useGuidance must be used within GuidanceProvider');
  }
  return context;
};

// ============================================================================
// FOCUS TRAP HOOK
// ============================================================================

export const useFocusTrap = (active: boolean) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const focusable = ref.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };

    ref.current.addEventListener('keydown', trap);
    
    // Focus first element when trap becomes active
    first.focus();
    
    return () => ref.current?.removeEventListener('keydown', trap);
  }, [active]);

  return ref;
};

// ============================================================================
// ANIMATED POINTER COMPONENT
// ============================================================================

interface AnimatedPointerProps {
  targetSelector: string;
  visible: boolean;
  onComplete?: () => void;
}

export const AnimatedPointer: React.FC<AnimatedPointerProps> = ({ 
  targetSelector, 
  visible, 
  onComplete 
}) => {
  const pointerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!visible || !pointerRef.current) return;

    const target = document.querySelector(targetSelector);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const newPosition = {
      top: rect.top + window.scrollY - 40,
      left: rect.left + window.scrollX + rect.width / 2
    };

    setPosition(newPosition);
    setIsAnimating(true);

    // Trigger click animation after positioning
    setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, 1000);

  }, [targetSelector, visible, onComplete]);

  if (!visible) return null;

  return createPortal(
    <div
      ref={pointerRef}
      className="fixed z-[1000] pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        transition: 'top 0.5s ease-out, left 0.5s ease-out'
      }}
      aria-hidden="true"
    >
      <div className={`transform transition-transform duration-300 ${
        isAnimating ? 'scale-110' : 'scale-100'
      }`}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path 
            d="M12 30L12 8M12 8L8 12M12 8L16 12" 
            stroke="#2563eb" 
            strokeWidth="4" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="8" r="2" fill="#2563eb" />
        </svg>
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// TOUR PROGRESS BAR COMPONENT
// ============================================================================

interface TourProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export const TourProgressBar: React.FC<TourProgressBarProps> = ({ 
  current, 
  total, 
  className = "" 
}) => {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Tour progress: step ${current + 1} of ${total}`}
      />
    </div>
  );
};

// ============================================================================
// TOUR FEEDBACK COMPONENT
// ============================================================================

interface TourFeedbackProps {
  tourId: string;
  onSubmit: (rating: number, comment?: string) => void;
  onSkip: () => void;
}

export const TourFeedback: React.FC<TourFeedbackProps> = ({ 
  tourId, 
  onSubmit, 
  onSkip 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center p-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="text-center mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          How helpful was this tour?
        </h4>
        <div className="flex justify-center space-x-1">
          {[1, 2, 3, 4, 5].map(val => (
            <button
              key={val}
              onClick={() => setRating(val)}
              className={`w-8 h-8 rounded-full transition-colors ${
                rating >= val 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              aria-label={`Rate ${val} stars`}
              type="button"
            >
              ★
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <textarea
          placeholder="Any additional comments? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700"
          type="button"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ERROR TOAST COMPONENT
// ============================================================================

interface ErrorToastProps {
  error: GuidanceError;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return createPortal(
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getErrorIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {error.type === 'network' ? 'Connection Error' : 'Error'}
            </h3>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="ml-2 text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// ENHANCED GUIDANCE PROVIDER
// ============================================================================

interface GuidanceProviderProps {
  children: React.ReactNode;
  userId: string;
  organizationId: string;
}

export const GuidanceProvider: React.FC<GuidanceProviderProps> = ({
  children,
  userId,
  organizationId
}) => {
  const [userState, setUserState] = useState<UserGuidanceState>({
    completedTours: [],
    dismissedPopups: [],
    lastSeenVersion: {},
    preferences: {
      showTooltips: true,
      showHotspots: true,
      autoStartTours: true
    }
  });

  const [activeTour, setActiveTour] = useState<GuidanceTour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activePopups, setActivePopups] = useState<Map<string, string>>(new Map());
  const [activeHotspots, setActiveHotspots] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<GuidanceError | null>(null);
  const [showPointer, setShowPointer] = useState(false);

  // Load user guidance state
  useEffect(() => {
    loadUserGuidanceState();
  }, [userId, organizationId]);

  // Check for resumable tours on mount
  useEffect(() => {
    if (userState.activeTour) {
      const tour = getTourConfiguration(userState.activeTour.tourId);
      if (tour) {
        const timeSinceInterruption = Date.now() - userState.activeTour.timestamp;
        const shouldResume = timeSinceInterruption < 30 * 60 * 1000; // 30 minutes
        
        if (shouldResume) {
          showResumePrompt(tour, userState.activeTour.currentStep);
        } else {
          // Clear stale tour state
          saveUserGuidanceState({ activeTour: undefined });
        }
      }
    }
  }, [userState.activeTour]);

  const loadUserGuidanceState = async () => {
    try {
      const response = await fetch(`/api/guidance/state/${userId}/${organizationId}`);
      if (response.ok) {
        const state = await response.json();
        setUserState(state);
      } else {
        throw new Error('Failed to load guidance state');
      }
    } catch (error) {
      setError({
        message: 'Unable to load your preferences. Some features may not work correctly.',
        type: 'loading',
        timestamp: Date.now()
      });
    }
  };

  const saveUserGuidanceState = async (newState: Partial<UserGuidanceState>) => {
    try {
      const updatedState = { ...userState, ...newState };
      const response = await fetch(`/api/guidance/state/${userId}/${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedState)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save guidance state');
      }
      
      setUserState(updatedState);
    } catch (error) {
      setError({
        message: 'Unable to save your preferences. Changes may not persist.',
        type: 'saving',
        timestamp: Date.now()
      });
    }
  };

  const showResumePrompt = (tour: GuidanceTour, stepIndex: number) => {
    const shouldResume = window.confirm(
      `Would you like to resume the "${tour.title}" tour from where you left off?`
    );
    
    if (shouldResume) {
      setActiveTour(tour);
      setCurrentStepIndex(stepIndex);
    } else {
      saveUserGuidanceState({ activeTour: undefined });
    }
  };

  const startTour = (tourId: string) => {
    const tour = getTourConfiguration(tourId);
    if (tour && !userState.completedTours.includes(tourId)) {
      setActiveTour(tour);
      setCurrentStepIndex(0);
      
      // Save tour state for potential resumption
      saveUserGuidanceState({
        activeTour: {
          tourId,
          currentStep: 0,
          timestamp: Date.now()
        }
      });
    }
  };

  const showPopup = (popupId: string, content: string) => {
    if (!userState.dismissedPopups.includes(popupId)) {
      setActivePopups(prev => new Map(prev).set(popupId, content));
    }
  };

  const showHotspot = (elementId: string, message: string) => {
    if (userState.preferences.showHotspots) {
      setActiveHotspots(prev => new Map(prev).set(elementId, message));
    }
  };

  const hideHotspot = (elementId: string) => {
    setActiveHotspots(prev => {
      const newMap = new Map(prev);
      newMap.delete(elementId);
      return newMap;
    });
  };

  const markTourComplete = (tourId: string) => {
    const newCompletedTours = [...userState.completedTours, tourId];
    saveUserGuidanceState({ 
      completedTours: newCompletedTours,
      activeTour: undefined // Clear active tour state
    });
    setActiveTour(null);
    setCurrentStepIndex(0);
    setShowPointer(false);
  };

  const markPopupDismissed = (popupId: string) => {
    const newDismissedPopups = [...userState.dismissedPopups, popupId];
    saveUserGuidanceState({ dismissedPopups: newDismissedPopups });
    setActivePopups(prev => {
      const newMap = new Map(prev);
      newMap.delete(popupId);
      return newMap;
    });
  };

  const isTourCompleted = (tourId: string) => {
    return userState.completedTours.includes(tourId);
  };

  const isPopupDismissed = (popupId: string) => {
    return userState.dismissedPopups.includes(popupId);
  };

  const clearError = () => {
    setError(null);
  };

  const submitFeedback = async (tourId: string, rating: number, comment?: string) => {
    try {
      await fetch('/api/guidance/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId,
          rating,
          comment,
          userId,
          organizationId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const contextValue: GuidanceContextType = {
    startTour,
    showPopup,
    showHotspot,
    hideHotspot,
    markTourComplete,
    markPopupDismissed,
    isTourCompleted,
    isPopupDismissed,
    userState,
    error,
    clearError,
    submitFeedback
  };

  return (
    <GuidanceContext.Provider value={contextValue}>
      {children}
      
      {/* Render active components */}
      {activeTour && (
        <EnhancedInteractiveTour
          tour={activeTour}
          currentStep={currentStepIndex}
          onNext={() => setCurrentStepIndex(prev => prev + 1)}
          onPrevious={() => setCurrentStepIndex(prev => prev - 1)}
          onComplete={() => markTourComplete(activeTour.id)}
          onSkip={() => {
            setActiveTour(null);
            setCurrentStepIndex(0);
            setShowPointer(false);
            saveUserGuidanceState({ activeTour: undefined });
          }}
          showPointer={showPointer}
          setShowPointer={setShowPointer}
        />
      )}
      
      {Array.from(activePopups.entries()).map(([id, content]) => (
        <GuidancePopup
          key={id}
          id={id}
          content={content}
          onDismiss={() => markPopupDismissed(id)}
        />
      ))}
      
      {Array.from(activeHotspots.entries()).map(([elementId, message]) => (
        <HotspotHighlight
          key={elementId}
          elementId={elementId}
          message={message}
          onHide={() => hideHotspot(elementId)}
        />
      ))}

      {error && (
        <ErrorToast
          error={error}
          onDismiss={clearError}
        />
      )}
    </GuidanceContext.Provider>
  );
};

// ============================================================================
// ENHANCED INTERACTIVE TOUR COMPONENT
// ============================================================================

interface EnhancedInteractiveTourProps {
  tour: GuidanceTour;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onSkip: () => void;
  showPointer: boolean;
  setShowPointer: (show: boolean) => void;
}

const EnhancedInteractiveTour: React.FC<EnhancedInteractiveTourProps> = ({
  tour,
  currentStep,
  onNext,
  onPrevious,
  onComplete,
  onSkip,
  showPointer,
  setShowPointer
}) => {
  const step = tour.steps[currentStep];
  const isLastStep = currentStep === tour.steps.length - 1;
  const isFirstStep = currentStep === 0;
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    if (step?.showPointer) {
      setShowPointer(true);
    } else {
      setShowPointer(false);
    }
  }, [step, setShowPointer]);

  if (!step) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <div 
          ref={trapRef}
          className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6"
          role="dialog"
          aria-labelledby="tour-title"
          aria-describedby="tour-content"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 id="tour-title" className="text-lg font-semibold text-gray-900">
              {step.title || tour.title}
            </h3>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Skip tour"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <TourProgressBar 
            current={currentStep} 
            total={tour.steps.length} 
            className="mb-4"
          />
          
          <p id="tour-content" className="text-gray-600 mb-6">{step.content}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {!isFirstStep && (
                <button
                  onClick={onPrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  aria-label="Previous step"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {currentStep + 1} of {tour.steps.length}
              </span>
              
              {isLastStep ? (
                <button
                  onClick={onComplete}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  aria-label="Complete tour"
                >
                  Complete
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  aria-label="Next step"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPointer && step.target && (
        <AnimatedPointer
          targetSelector={step.target}
          visible={showPointer}
          onComplete={() => setShowPointer(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getTourConfiguration = (tourId: string): GuidanceTour | null => {
  // This would typically fetch from an API or configuration file
  const tours: Record<string, GuidanceTour> = {
    'organization-setup': {
      id: 'organization-setup',
      title: 'Organization Setup',
      description: 'Set up your organization structure',
      module: 'organization',
      version: '1.0.0',
      steps: [
        {
          id: 'welcome',
          target: '#organization-name',
          content: 'Welcome! Let\'s set up your organization. Start by entering your organization name.',
          title: 'Welcome',
          showPointer: true
        },
        {
          id: 'basic-info',
          target: '#organization-email',
          content: 'Now let\'s add your primary contact email.',
          showPointer: true
        }
      ]
    }
  };
  
  return tours[tourId] || null;
};

// Placeholder components for existing functionality
const GuidancePopup: React.FC<{id: string, content: string, onDismiss: () => void}> = () => null;
const HotspotHighlight: React.FC<{elementId: string, message: string, onHide: () => void}> = () => null;

export default OnboardingGuidanceEnhanced; 