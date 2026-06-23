import React, { StrictMode, Suspense, lazy } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * DARLEK CANN v3.0 - Entry Point Orchestrator
 * Architecture: Sovereign-Kernel / OMEGA-Core
 * Purpose: High-availability root mounting with diagnostic telemetry.
 */

const ErrorBoundary = lazy(() => import('./components/system/ErrorBoundary'));
const LoadingFallback = () => <div className="system-init-pulse">INITIALIZING_CORE_SYSTEM...</div>;

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('CRITICAL_FAILURE: Root DOM node not found. System cannot initialize.');
}

const renderApp = () => {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Suspense>
    </StrictMode>
  );
};

// Performance-aware initialization
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.info('DARLEK_CANN_SYSTEM: Initialization sequence complete.');
    renderApp();
  });
}

export default renderApp;