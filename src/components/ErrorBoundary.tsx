import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6 text-sm">
              We encountered an unexpected error. Our team has been notified.
            </p>
            
            {this.state.error && (
                <div className="mb-6 p-3 bg-red-50 rounded text-left overflow-auto max-h-32">
                    <p className="text-xs font-mono text-red-800 break-all">{this.state.error.message}</p>
                </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Reload Application
            </button>
            <div className="mt-4">
               <a href="/" className="text-sm text-gray-500 hover:text-gray-900 underline">Return to Home</a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}