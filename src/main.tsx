/* global console, document */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./styles/globals.css";
import { QuickAddActionsProvider } from "./contexts/QuickAddContext";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// console.log('main.tsx: Starting app initialization')

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <QuickAddActionsProvider>
          <App />
        </QuickAddActionsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// console.log('main.tsx: App rendered to DOM')
