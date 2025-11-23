import React, { Component, ReactNode, ErrorInfo } from 'react';
import { FiAlertCircle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Wrapper component to use navigate hook
const ErrorBoundaryButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/')}
      className="btn btn-outline flex items-center gap-2"
    >
      <FiHome size={18} />
      Go Home
    </button>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full">
            <div className="card bg-white shadow-lg">
              <div className="card-body text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <FiAlertCircle className="text-red-600" size={40} />
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Something went wrong
                  </h1>
                  <p className="text-gray-600 text-lg">
                    We encountered an unexpected error. Please try again.
                  </p>
                </div>

                {this.state.error && (
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm font-mono text-red-600 break-all">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 pt-4">
                  <button
                    onClick={this.handleReset}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <FiRefreshCw size={18} />
                    Try Again
                  </button>
                  <ErrorBoundaryButton />
                </div>

                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="text-left mt-6">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-900 text-green-400 text-xs overflow-auto rounded-lg">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
