import React, { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * DARLEK CANN v3.0 - Entry Point Orchestrator
 * Architecture: Sovereign-Kernel / OMEGA-Core
 * Integration: Unitary-Core / SN-OMEGA Telemetry
 */

const ErrorBoundary = lazy(() => import('./components/system/ErrorBoundary'));
const LoadingFallback = () => (
  <div className="system-init-pulse" role="status" aria-live="polite">
    INITIALIZING_OMEGA_CORE_SYSTEM...
  </div>
);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('CRITICAL_FAILURE: Root DOM node not found. System cannot initialize.');
}

const initializeSystem = () => {
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

// Performance-optimized initialization using requestIdleCallback
// Siphoned from sovereign-kernel lifecycle patterns
if (typeof window !== 'undefined') {
  const init = () => {
    initializeSystem();
    console.info('DARLEK_CANN_SYSTEM: OMEGA_CORE_ONLINE. Telemetry active.');
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(init);
  } else {
    setTimeout(init, 1);
  }
}

export default initializeSystem;