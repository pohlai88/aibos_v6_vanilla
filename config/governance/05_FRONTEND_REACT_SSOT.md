# ⚛️ **REACT FRONTEND - Single Source of Truth (SSOT)**

## 📋 **Document Overview**

This document serves as the **Single Source of Truth (SSOT)** for all React frontend development, ensuring consistency, preventing architectural drift, and maintaining production-grade quality across all UI components and user interfaces.

**Last Updated**: August 29, 2025  
**Version**: 1.0.0  
**Status**: ✅ **ACTIVE - SINGLE SOURCE OF TRUTH**  
**Module**: Frontend User Interface

---

## 🎯 **REACT ARCHITECTURE PRINCIPLES**

### **1. Single Source of Truth**
- **All component definitions** follow established patterns
- **All state management** uses React Query + Context
- **All API calls** use generated TypeScript clients
- **All styling** uses Tailwind CSS utility classes

### **2. Enforced Boundaries**
- **Frontend cannot import** from `packages/backend/**`
- **All API types** come from `packages/shared/clients/**`
- **No inline styles** - everything uses Tailwind classes
- **Import boundaries** enforced by CI/CD architecture tests

### **3. Runtime Validation**
- **Environment variables** validated with Zod
- **API responses** validated with generated types
- **Form inputs** validated with React Hook Form + Zod
- **Fail fast** on validation errors with clear user feedback

---

## 🏗️ **REACT STRUCTURE & ORGANIZATION**

### **Directory Structure**
```
apps/frontend/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── globals.css      # Global styles
│   │   └── (routes)/        # Route groups
│   │       ├── dashboard/    # Dashboard routes
│   │       ├── accounting/   # Accounting routes
│   │       ├── compliance/   # Compliance routes
│   │       └── profile/      # Profile routes
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base UI components
│   │   │   ├── Button.tsx   # Button component
│   │   │   ├── Input.tsx    # Input component
│   │   │   ├── Modal.tsx    # Modal component
│   │   │   └── Table.tsx    # Table component
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.tsx   # Navigation header
│   │   │   ├── Sidebar.tsx  # Navigation sidebar
│   │   │   └── Footer.tsx   # Application footer
│   │   └── modules/         # Module-specific components
│   │       ├── Dashboard/    # Dashboard components
│   │       ├── Accounting/   # Accounting components
│   │       └── Compliance/   # Compliance components
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useApi.ts        # API interaction hook
│   │   └── useForm.ts       # Form handling hook
│   ├── lib/                  # Utility libraries
│   │   ├── api.ts           # API client setup
│   │   ├── auth.ts          # Authentication utilities
│   │   └── utils.ts         # General utilities
│   ├── types/                # TypeScript type definitions
│   │   ├── api.ts           # API response types
│   │   ├── auth.ts          # Authentication types
│   │   └── common.ts        # Shared types
│   ├── styles/               # Global styles and themes
│   │   ├── globals.css      # Global CSS
│   │   └── components.css   # Component-specific CSS
│   └── env.ts                # Environment validation
```

### **Package Dependencies**
```json
{
  "name": "aibos-frontend",
  "version": "0.1.0",
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@tanstack/react-query": "^5.81.5",
    "react-hook-form": "^7.59.0",
    "zod": "^3.23.8",
    "framer-motion": "^12.23.0",
    "@headlessui/react": "^2.2.4",
    "lucide-react": "^0.525.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "typescript": "^5.5.4",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "eslint": "^9.9.0",
    "eslint-config-next": "^14.2.5"
  }
}
```

---

## 🎨 **COMPONENT DEVELOPMENT STANDARDS**

### **1. Component Structure Pattern**
```tsx
// ✅ STANDARD: Functional component with TypeScript
import React from 'react';
import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/useApi';
import type { User } from '@/types/api';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: number) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete
}) => {
  const { mutate: deleteUser, isPending } = useApi.deleteUser();

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(user.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
        <span className="text-sm text-gray-500">{user.email}</span>
      </div>
      
      <div className="flex gap-2">
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(user)}
            className="flex-1"
          >
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        )}
      </div>
    </div>
  );
};
```

### **2. Hook Development Pattern**
```tsx
// ✅ STANDARD: Custom hook with proper typing
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/api';

export const useUsers = () => {
  const queryClient = useQueryClient();
  
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createUser = useMutation({
    mutationFn: (data: CreateUserRequest) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    users,
    isLoading,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
  };
};
```

### **3. Form Development Pattern**
```tsx
// ✅ STANDARD: Form with React Hook Form + Zod validation
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin', 'super_admin']),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel?: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Input
          label="Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Enter user name"
        />
      </div>
      
      <div>
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="Enter email address"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          {...register('role')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : 'Save User'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
```

---

## 🔌 **API INTEGRATION STANDARDS**

### **1. API Client Setup**
```tsx
// ✅ STANDARD: Centralized API client with React Query
// lib/api.ts
import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/clients/ts/openapi';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

export const api = {
  users: {
    getAll: () => apiClient.users.getAll(),
    getById: (id: number) => apiClient.users.getById(id),
    create: (data: CreateUserRequest) => apiClient.users.create(data),
    update: (id: number, data: UpdateUserRequest) => apiClient.users.update(id, data),
    delete: (id: number) => apiClient.users.delete(id),
  },
  auth: {
    login: (credentials: LoginRequest) => apiClient.auth.login(credentials),
    logout: () => apiClient.auth.logout(),
    refresh: () => apiClient.auth.refresh(),
  },
  // Add more API endpoints as needed
};
```

### **2. Error Handling Pattern**
```tsx
// ✅ STANDARD: Consistent error handling
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

export const UsersList: React.FC = () => {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load users"
        message={error.message}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};

// Wrap with error boundary
export const UsersListWithErrorBoundary: React.FC = () => (
  <ErrorBoundary fallback={<ErrorDisplay title="Something went wrong" />}>
    <UsersList />
  </ErrorBoundary>
);
```

---

## 🎨 **STYLING & DESIGN STANDARDS**

### **1. Tailwind CSS Usage**
```tsx
// ✅ STANDARD: Consistent Tailwind class usage
// Use semantic class combinations
const buttonVariants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors",
  destructive: "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors",
  outline: "border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors",
};

// ✅ STANDARD: Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
  {/* Content */}
</div>

// ✅ STANDARD: Dark mode support
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* Content */}
</div>
```

### **2. Component Variants**
```tsx
// ✅ STANDARD: Component variant system
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

---

## 🧪 **TESTING & QUALITY STANDARDS**

### **1. Test Structure**
```tsx
// ✅ STANDARD: Component testing with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserForm } from './UserForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('UserForm', () => {
  it('renders form fields correctly', () => {
    renderWithQueryClient(<UserForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithQueryClient(<UserForm onSubmit={jest.fn()} />);
    
    fireEvent.click(screen.getByText(/save user/i));
    
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    renderWithQueryClient(<UserForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    });
    
    fireEvent.click(screen.getByText(/save user/i));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      });
    });
  });
});
```

### **2. Quality Gates**
```bash
# ✅ MANDATORY: All tests must pass
npm run test

# ✅ MANDATORY: Code coverage >80%
npm run test:coverage

# ✅ MANDATORY: Type checking
npm run type-check

# ✅ MANDATORY: Linting
npm run lint

# ✅ MANDATORY: Build validation
npm run build
```

---

## 🚀 **PERFORMANCE & OPTIMIZATION**

### **1. Code Splitting**
```tsx
// ✅ STANDARD: Dynamic imports for code splitting
import dynamic from 'next/dynamic';

const UserForm = dynamic(() => import('./UserForm'), {
  loading: () => <div>Loading form...</div>,
  ssr: false, // Disable SSR for forms if needed
});

const Dashboard = dynamic(() => import('./Dashboard'), {
  loading: () => <div>Loading dashboard...</div>,
});
```

### **2. Memoization**
```tsx
// ✅ STANDARD: Use memoization for expensive operations
import React, { useMemo, useCallback } from 'react';

export const UsersList: React.FC<{ users: User[]; filter: string }> = ({
  users,
  filter
}) => {
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(filter.toLowerCase()) ||
      user.email.toLowerCase().includes(filter.toLowerCase())
    );
  }, [users, filter]);

  const handleUserUpdate = useCallback((userId: number, data: UpdateUserRequest) => {
    // Update logic
  }, []);

  return (
    <div>
      {filteredUsers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onUpdate={(data) => handleUserUpdate(user.id, data)}
        />
      ))}
    </div>
  );
};
```

---

## 🚨 **COMPLIANCE & GOVERNANCE RULES**

### **1. Development Rules**
- ✅ **All new components** must follow established patterns
- ✅ **All API calls** must use generated TypeScript clients
- ✅ **All forms** must use React Hook Form + Zod validation
- ✅ **All styling** must use Tailwind CSS utility classes
- ✅ **All state management** must use React Query + Context
- ✅ **All error handling** must use consistent error patterns

### **2. Code Review Rules**
- ✅ **Component changes** require pattern compliance review
- ✅ **New dependencies** require security review
- ✅ **Performance changes** require load testing
- ✅ **Accessibility changes** require compliance review
- ✅ **Styling changes** require design system review

### **3. Deployment Rules**
- ✅ **All tests must pass** before deployment
- ✅ **Code coverage must be >80%** before deployment
- ✅ **Build must succeed** before deployment
- ✅ **Accessibility tests must pass** before deployment
- ✅ **Performance tests must pass** before deployment

---

## 📚 **RELATED DOCUMENTATION**

- **[Configuration SSOT](00_CONFIGURATION_SSOT.md)** - Configuration governance
- **[FastAPI SSOT](04_FASTAPI_SSOT.md)** - Backend API governance
- **[Monorepo Architecture](../../management/05_MONOREPO_ARCHITECTURE.md)** - Architecture principles
- **[Migration Strategy](../../management/06_MIGRATION_STRATEGY.md)** - Migration guidelines

---

## 🔄 **DOCUMENT MAINTENANCE**

**Last Updated**: August 29, 2025  
**Next Review**: September 5, 2025  
**Reviewer**: AIBOS Development Team  
**Approval**: Technical Lead

**Change Log**:
- **v1.0.0** (2025-08-29): Initial React Frontend SSOT creation

---

**This document is the SINGLE SOURCE OF TRUTH for all React frontend development. All UI development, refactoring, and new features must reference this document to ensure consistency and prevent architectural drift.**
