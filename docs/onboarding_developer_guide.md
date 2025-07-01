# 🛠️ AIBOS V6 Onboarding Developer Guide

## 📋 Quick Start

This guide shows you how to integrate and use the enhanced onboarding system in AIBOS V6.

---

## 🚀 Basic Integration

### 1. **Setup the Guidance Provider**

Wrap your app with the `GuidanceProvider`:

```tsx
import { GuidanceProvider } from './components/OnboardingGuidanceEnhanced';

function App() {
  return (
    <GuidanceProvider userId="user123" organizationId="org456">
      <YourApp />
    </GuidanceProvider>
  );
}
```

### 2. **Use the Enhanced Organization Setup**

```tsx
import { GuidedOrganizationSetupEnhanced } from './modules/organization/components/GuidedOrganizationSetupEnhanced';

function OnboardingPage() {
  return <GuidedOrganizationSetupEnhanced />;
}
```

---

## 🎯 Core Components

### **AnimatedPointer**
Shows an animated cursor for tour guidance:

```tsx
import { AnimatedPointer } from './components/OnboardingGuidanceEnhanced';

<AnimatedPointer
  targetSelector="#my-field"
  visible={showPointer}
  onComplete={() => setShowPointer(false)}
/>
```

### **TourProgressBar**
Displays tour progress:

```tsx
import { TourProgressBar } from './components/OnboardingGuidanceEnhanced';

<TourProgressBar 
  current={2} 
  total={5} 
  className="mb-4" 
/>
```

### **TourFeedback**
Collects user feedback:

```tsx
import { TourFeedback } from './components/OnboardingGuidanceEnhanced';

<TourFeedback
  tourId="my-tour"
  onSubmit={(rating, comment) => {
    console.log('Rating:', rating, 'Comment:', comment);
  }}
  onSkip={() => console.log('Skipped feedback')}
/>
```

### **ErrorToast**
Shows error notifications:

```tsx
import { ErrorToast } from './components/OnboardingGuidanceEnhanced';

<ErrorToast
  error={{
    message: 'Failed to save preferences',
    type: 'saving',
    timestamp: Date.now()
  }}
  onDismiss={() => setError(null)}
/>
```

---

## 🔧 Custom Hooks

### **useGuidance**
Main hook for guidance functionality:

```tsx
import { useGuidance } from './components/OnboardingGuidanceEnhanced';

function MyComponent() {
  const {
    startTour,
    markTourComplete,
    submitFeedback,
    userState,
    error,
    clearError
  } = useGuidance();

  // Start a tour
  const handleStartTour = () => {
    startTour('my-tour-id');
  };

  // Mark tour complete
  const handleComplete = () => {
    markTourComplete('my-tour-id');
  };

  // Submit feedback
  const handleFeedback = (rating: number, comment?: string) => {
    submitFeedback('my-tour-id', rating, comment);
  };

  return (
    <div>
      <button onClick={handleStartTour}>Start Tour</button>
      <button onClick={handleComplete}>Complete Tour</button>
      
      {error && (
        <div className="text-red-600">
          {error.message}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
```

### **useFocusTrap**
For modal accessibility:

```tsx
import { useFocusTrap } from './components/OnboardingGuidanceEnhanced';

function MyModal({ isOpen }) {
  const trapRef = useFocusTrap(isOpen);

  return (
    <div ref={trapRef} className="modal">
      <button>First focusable</button>
      <button>Last focusable</button>
    </div>
  );
}
```

---

## 🎨 Tour Configuration

### **Define Tour Steps**

```typescript
const tourConfig: GuidanceTour = {
  id: 'organization-setup',
  title: 'Organization Setup',
  description: 'Set up your organization',
  module: 'organization',
  version: '1.0.0',
  steps: [
    {
      id: 'welcome',
      target: '#organization-name',
      content: 'Welcome! Let\'s start with your organization name.',
      title: 'Welcome',
      showPointer: true // Shows animated pointer
    },
    {
      id: 'email',
      target: '#organization-email',
      content: 'Now add your primary email address.',
      position: 'bottom'
    },
    {
      id: 'complete',
      target: '#submit-button',
      content: 'Great! Click here to complete setup.',
      action: 'click'
    }
  ]
};
```

### **Tour Actions**

```typescript
// Available actions for tour steps
type TourAction = 'click' | 'hover' | 'focus' | 'none';

// Available positions for tooltips
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';
```

---

## 📱 Mobile Optimization

### **Responsive Progress Bars**

```tsx
// Desktop progress bar
<div className="hidden md:block">
  <TourProgressBar current={currentStep} total={totalSteps} />
</div>

// Mobile progress bar
<div className="md:hidden">
  <div className="flex items-center space-x-2">
    {steps.map((step, index) => (
      <div
        key={step.id}
        className={`flex-1 h-2 rounded-full ${
          index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      />
    ))}
  </div>
</div>
```

### **Touch-Friendly Interactions**

```tsx
// Ensure adequate touch targets
<button className="px-6 py-3 min-h-[44px]"> // 44px minimum for touch
  Touch Target
</button>
```

---

## 🔒 Error Handling

### **Comprehensive Error Management**

```tsx
function MyComponent() {
  const { error, clearError } = useGuidance();

  // Handle different error types
  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return <NetworkIcon />;
      case 'validation':
        return <ValidationIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  return (
    <div>
      {error && (
        <div className="error-toast">
          {getErrorIcon(error.type)}
          <span>{error.message}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}
    </div>
  );
}
```

### **Validation Patterns**

```tsx
const validateStep = (stepId: string): boolean => {
  const errors: Record<string, string> = {};

  switch (stepId) {
    case 'basic':
      if (!organization.name.trim()) {
        errors.name = 'Organization name is required';
      }
      if (!organization.email.trim()) {
        errors.email = 'Email is required';
      } else if (!isValidEmail(organization.email)) {
        errors.email = 'Please enter a valid email';
      }
      break;
  }

  setErrors(errors);
  return Object.keys(errors).length === 0;
};
```

---

## 🎯 Best Practices

### **1. Progressive Enhancement**

```tsx
// Start with basic functionality
const [showAdvanced, setShowAdvanced] = useState(false);

// Enhance based on user preferences
useEffect(() => {
  if (userState.preferences.autoStartTours) {
    startTour('welcome-tour');
  }
}, []);
```

### **2. Accessibility First**

```tsx
// Always include ARIA attributes
<div
  role="dialog"
  aria-labelledby="tour-title"
  aria-describedby="tour-content"
>
  <h3 id="tour-title">Tour Title</h3>
  <p id="tour-content">Tour content</p>
</div>
```

### **3. Performance Optimization**

```tsx
// Lazy load heavy components
const TourFeedback = React.lazy(() => import('./TourFeedback'));

// Use React.memo for expensive components
const AnimatedPointer = React.memo(({ targetSelector, visible }) => {
  // Component logic
});
```

### **4. State Management**

```tsx
// Centralize tour state
const [tourState, setTourState] = useState({
  activeTour: null,
  currentStep: 0,
  isPaused: false
});

// Persist state for resumption
useEffect(() => {
  localStorage.setItem('tourState', JSON.stringify(tourState));
}, [tourState]);
```

---

## 🔄 Integration Examples

### **Form Integration**

```tsx
function OrganizationForm() {
  const { startTour } = useGuidance();
  const [formData, setFormData] = useState({});

  const handleFieldFocus = (fieldId: string) => {
    // Highlight field during tour
    document.getElementById(fieldId)?.classList.add('tour-highlight');
  };

  const handleFieldBlur = (fieldId: string) => {
    // Remove highlight
    document.getElementById(fieldId)?.classList.remove('tour-highlight');
  };

  return (
    <form>
      <input
        id="org-name"
        onFocus={() => handleFieldFocus('org-name')}
        onBlur={() => handleFieldBlur('org-name')}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
      />
      <button type="button" onClick={() => startTour('form-tour')}>
        Start Form Tour
      </button>
    </form>
  );
}
```

### **Dashboard Integration**

```tsx
function Dashboard() {
  const { isTourCompleted, showPopup } = useGuidance();

  useEffect(() => {
    // Show welcome popup for new users
    if (!isTourCompleted('dashboard-intro')) {
      showPopup('welcome', 'Welcome to your dashboard!');
    }
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

---

## 🧪 Testing

### **Component Testing**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GuidanceProvider } from './OnboardingGuidanceEnhanced';

test('tour starts when button is clicked', () => {
  render(
    <GuidanceProvider userId="test" organizationId="test">
      <MyComponent />
    </GuidanceProvider>
  );

  const startButton = screen.getByText('Start Tour');
  fireEvent.click(startButton);

  expect(screen.getByText('Tour Title')).toBeInTheDocument();
});
```

### **Hook Testing**

```tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useGuidance } from './OnboardingGuidanceEnhanced';

test('useGuidance provides expected methods', () => {
  const { result } = renderHook(() => useGuidance(), {
    wrapper: ({ children }) => (
      <GuidanceProvider userId="test" organizationId="test">
        {children}
      </GuidanceProvider>
    )
  });

  expect(result.current.startTour).toBeDefined();
  expect(result.current.markTourComplete).toBeDefined();
  expect(result.current.submitFeedback).toBeDefined();
});
```

---

## 📚 API Reference

### **GuidanceProvider Props**

```typescript
interface GuidanceProviderProps {
  children: React.ReactNode;
  userId: string;
  organizationId: string;
}
```

### **useGuidance Return Value**

```typescript
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
```

---

## 🆘 Troubleshooting

### **Common Issues**

1. **Tour not starting**: Check if `GuidanceProvider` is wrapping your component
2. **Pointer not showing**: Verify `targetSelector` matches an existing element
3. **Focus trap not working**: Ensure `useFocusTrap` is called with `true` when modal is open
4. **State not persisting**: Check API endpoints and network connectivity

### **Debug Mode**

```tsx
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Tour state:', userState);
  console.log('Active tour:', activeTour);
  console.log('Current step:', currentStep);
}
```

---

*This guide covers the essential aspects of using the enhanced onboarding system. For more detailed information, refer to the individual component files and the comprehensive enhancement summary.* 