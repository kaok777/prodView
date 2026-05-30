import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ConsentProvider } from "./contexts/ConsentContext";
import "./index.css";
import App from "./App";

// Fixed: CQ4.3.1 - Global error handlers for unhandled promise rejections
// Prevents uncaught async errors from crashing the app silently
window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 Unhandled Promise Rejection:', event.reason);
  // In production, send to error tracking service (Sentry, LogRocket, etc.)
  // For now, just log to console
  event.preventDefault(); // Prevent default browser error handling
});

window.addEventListener('error', (event) => {
  console.error('🔴 Uncaught Error:', event.error);
  // In production, send to error tracking service
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ConsentProvider>
      <App />
    </ConsentProvider>
  </HelmetProvider>
);
