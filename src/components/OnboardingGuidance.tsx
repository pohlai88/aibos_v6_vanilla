import React, { useState, useEffect, useRef } from 'react';
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
  preferences: {
    showTooltips: boolean;
    showHotspots: boolean;
    autoStartTours: boolean;
  };
}

// ============================================================================
// GUIDANCE CONTEXT
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
// GUIDANCE PROVIDER
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

  // Load user guidance state
  useEffect(() => {
    loadUserGuidanceState();
  }, [userId, organizationId]);

  const loadUserGuidanceState = async () => {
    try {
      const response = await fetch(`/api/guidance/state/${userId}/${organizationId}`);
      if (response.ok) {
        const state = await response.json();
        setUserState(state);
      }
    } catch (error) {
      console.error('Failed to load guidance state:', error);
    }
  };

  const saveUserGuidanceState = async (newState: Partial<UserGuidanceState>) => {
    try {
      const updatedState = { ...userState, ...newState };
      await fetch(`/api/guidance/state/${userId}/${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedState)
      });
      setUserState(updatedState);
    } catch (error) {
      console.error('Failed to save guidance state:', error);
    }
  };

  const startTour = (tourId: string) => {
    // Load tour configuration
    const tour = getTourConfiguration(tourId);
    if (tour && !userState.completedTours.includes(tourId)) {
      setActiveTour(tour);
      setCurrentStepIndex(0);
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
    saveUserGuidanceState({ completedTours: newCompletedTours });
    setActiveTour(null);
    setCurrentStepIndex(0);
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

  const contextValue: GuidanceContextType = {
    startTour,
    showPopup,
    showHotspot,
    hideHotspot,
    markTourComplete,
    markPopupDismissed,
    isTourCompleted,
    isPopupDismissed,
    userState
  };

  return (
    <GuidanceContext.Provider value={contextValue}>
      {children}
      
      {/* Render active components */}
      {activeTour && (
        <InteractiveTour
          tour={activeTour}
          currentStep={currentStepIndex}
          onNext={() => setCurrentStepIndex(prev => prev + 1)}
          onPrevious={() => setCurrentStepIndex(prev => prev - 1)}
          onComplete={() => markTourComplete(activeTour.id)}
          onSkip={() => setActiveTour(null)}
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
    </GuidanceContext.Provider>
  );
};

// ============================================================================
// INTERACTIVE TOUR COMPONENT
// ============================================================================

interface InteractiveTourProps {
  tour: GuidanceTour;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

const InteractiveTour: React.FC<InteractiveTourProps> = ({
  tour,
  currentStep,
  onNext,
  onPrevious,
  onComplete,
  onSkip
}) => {
  const step = tour.steps[currentStep];
  const isLastStep = currentStep === tour.steps.length - 1;
  const isFirstStep = currentStep === 0;

  if (!step) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{step.title || tour.title}</h3>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">{step.content}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {!isFirstStep && (
              <button
                onClick={onPrevious}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
              >
                Complete
              </button>
            ) : (
              <button
                onClick={onNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// GUIDANCE POPUP COMPONENT
// ============================================================================

interface GuidancePopupProps {
  id: string;
  content: string;
  onDismiss: () => void;
}

const GuidancePopup: React.FC<GuidancePopupProps> = ({ content, onDismiss }) => {
  const [showRemindLater, setShowRemindLater] = useState(false);

  return createPortal(
    <div className="fixed top-4 right-4 z-40 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <button
            onClick={onDismiss}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <p className="text-sm text-gray-700 mb-3">{content}</p>
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRemindLater(!showRemindLater)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {showRemindLater ? 'Don\'t show again' : 'Remind me later'}
          </button>
          
          <button
            onClick={onDismiss}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// HOTSPOT HIGHLIGHT COMPONENT
// ============================================================================

interface HotspotHighlightProps {
  elementId: string;
  message: string;
  onHide: () => void;
}

const HotspotHighlight: React.FC<HotspotHighlightProps> = ({ elementId, message, onHide }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = document.querySelector(elementId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
      setIsVisible(true);
    }
  }, [elementId]);

  if (!isVisible) return null;

  return createPortal(
    <div
      className="absolute z-30 animate-pulse"
      style={{ top: position.top, left: position.left }}
    >
      <div className="bg-blue-500 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs">
        <div className="flex items-start">
          <span className="flex-1">{message}</span>
          <button
            onClick={onHide}
            className="ml-2 text-white hover:text-gray-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-blue-500"></div>
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// CONTEXTUAL TOOLTIP COMPONENT
// ============================================================================

interface ContextualTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX
      });
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && createPortal(
        <div
          className={`absolute z-40 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs ${
            position === 'top' ? '-translate-y-full -translate-x-1/2' :
            position === 'bottom' ? 'translate-y-full -translate-x-1/2' :
            position === 'left' ? '-translate-x-full -translate-y-1/2' :
            'translate-x-full -translate-y-1/2'
          }`}
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          {content}
          <div className={`absolute w-0 h-0 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900' :
            'right-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900'
          }`}></div>
        </div>,
        document.body
      )}
    </>
  );
};

// ============================================================================
// WELCOME BANNER COMPONENT
// ============================================================================

interface WelcomeBannerProps {
  title: string;
  description: string;
  checklist: string[];
  onDismiss: () => void;
  onStartTour: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  title,
  description,
  checklist,
  onDismiss,
  onStartTour
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-4">{description}</p>
          
          <div className="space-y-2">
            {checklist.map((item, index) => (
              <div key={index} className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-3 mt-4">
            <button
              onClick={onStartTour}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Take a Tour
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 ml-4"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getTourConfiguration = (tourId: string): GuidanceTour | null => {
  // This would typically load from an API or configuration file
  const tours: Record<string, GuidanceTour> = {
    'organization-setup': {
      id: 'organization-setup',
      title: 'Organization Setup',
      description: 'Learn how to configure your organization',
      module: 'organization',
      version: '1.0.0',
      steps: [
        {
          id: 'org-name',
          target: '#organization-name',
          content: 'Enter your organization name. This will be used throughout the system.',
          title: 'Organization Name',
          position: 'bottom'
        },
        {
          id: 'org-type',
          target: '#organization-type',
          content: 'Select your organization type to enable relevant features.',
          title: 'Organization Type',
          position: 'bottom'
        },
        {
          id: 'employee-count',
          target: '#employee-count',
          content: 'Set your employee count to customize the experience for your organization size.',
          title: 'Employee Count',
          position: 'bottom'
        }
      ]
    }
  };
  
  return tours[tourId] || null;
};

const OnboardingGuidance = {
  Provider: GuidanceProvider,
  useGuidance,
  InteractiveTour,
  GuidancePopup,
  HotspotHighlight,
  ContextualTooltip,
  WelcomeBanner
};

export default OnboardingGuidance; 