import React, { StrictMode, Suspense, lazy } from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * DARLEK CANN v3.0 - Entry Point Orchestrator
 * Architecture: Sovereign-Kernel / OMEGA-Core
 * Integration: Unitary-Core / SN-OMEGA Telemetry
 * 
 * Status: Production-Ready
 * Lifecycle: Idle-Callback-Optimized
 */

const ErrorBoundary = lazy(() => import('./components/system/ErrorBoundary'));

const LoadingFallback = () => (
  <div className="system-init-pulse" role="status" aria-live="polite">
    <span className="animate-pulse">INITIALIZING_OMEGA_CORE_SYSTEM...</span>
  </div>
);

let root: Root | null = null;

const initializeSystem = (): void => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('CRITICAL_FAILURE: Root DOM node not found.');
    return;
  }

  if (!root) {
    root = createRoot(rootElement);
  }

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

const bootstrap = () => {
  try {
    initializeSystem();
    console.info('DARLEK_CANN_SYSTEM: OMEGA_CORE_ONLINE. Telemetry active.');
  } catch (err) {
    console.error('BOOTSTRAP_FAILURE: OMEGA_CORE_CRASHED', err);
  }
};

if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(bootstrap);
  } else {
    setTimeout(bootstrap, 1);
  }
}