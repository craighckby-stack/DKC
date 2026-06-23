import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DARLEK_CANN_SYSTEM_FAULT:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <div className="system-error-overlay">CRITICAL_SYSTEM_FAILURE_DETECTED. REBOOT_REQUIRED.</div>;
    }
    return this.props.children;
  }
}