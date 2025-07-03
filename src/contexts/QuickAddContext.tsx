import React, { useState, createContext, useContext } from "react";

export interface QuickAddAction {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
}

const defaultActions: QuickAddAction[] = [
  { id: "addTask", label: "Add Task", icon: "➕", enabled: true },
  {
    id: "scheduleMeeting",
    label: "Schedule Meeting",
    icon: "🗓",
    enabled: true,
  },
  { id: "newNote", label: "New Note", icon: "📝", enabled: true },
  { id: "uploadFile", label: "Upload File", icon: "📤", enabled: true },
];

export const QuickAddActionsContext = createContext<{
  actions: QuickAddAction[];
  setActions: React.Dispatch<React.SetStateAction<QuickAddAction[]>>;
} | null>(null);

export const useQuickAddActions = () => {
  const ctx = useContext(QuickAddActionsContext);
  if (!ctx)
    throw new Error(
      "useQuickAddActions must be used within QuickAddActionsProvider"
    );
  return ctx;
};

export const QuickAddActionsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [actions, setActions] = useState<QuickAddAction[]>(defaultActions);
  return (
    <QuickAddActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </QuickAddActionsContext.Provider>
  );
};
