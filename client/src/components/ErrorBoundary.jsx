import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-tan flex items-center justify-center p-6">
          <div className="bg-white border-[3px] border-ink p-8 shadow-[8px_8px_0_0_#2d2d2d] max-w-md w-full blob-1">
            <h1 className="text-3xl font-heading text-red mb-4 uppercase">Whoops!</h1>
            <p className="font-mono text-ink/80 mb-6">Something unexpectedly cracked. Don't worry, the dev team has been notified.</p>
            <div className="bg-gray-100 p-4 border-2 border-ink text-xs font-mono text-ink/60 overflow-x-auto mb-6">
              {this.state.error && this.state.error.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full font-heading uppercase tracking-wider py-3 border-[3px] border-ink bg-yellow hover:bg-orange transition-colors shadow-[4px_4px_0_0_#2d2d2d]"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
