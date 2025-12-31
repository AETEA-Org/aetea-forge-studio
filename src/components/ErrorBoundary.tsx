import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ ErrorBoundary caught error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
    this.setState({
      errorInfo: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
          <div className="text-center max-w-2xl">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <div className="text-left bg-muted p-4 rounded-lg mb-4">
              <p className="font-mono text-sm text-destructive mb-2">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    View stack trace
                  </summary>
                  <pre className="text-xs mt-2 overflow-auto max-h-48 text-muted-foreground">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    View component stack
                  </summary>
                  <pre className="text-xs mt-2 overflow-auto max-h-48 text-muted-foreground">
                    {this.state.errorInfo}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/app'}
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
