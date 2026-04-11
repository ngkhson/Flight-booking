import { Component, type ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    message: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ErrorBoundary — Class component bắt runtime errors trong cây render.
 * Hiển thị UI fallback thay vì vỡ toàn bộ trang.
 * Usage: <ErrorBoundary><SomeComponent /></ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, message: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // TODO: Send to error-tracking service (Sentry, Datadog, etc.)
        console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, message: '' });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl">
                        ⚠️
                    </div>

                    {/* Message */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Đã xảy ra lỗi</h2>
                        <p className="mt-1 text-sm text-gray-500 max-w-sm">
                            Something went wrong while rendering this section.
                        </p>
                        {this.state.message && (
                            <p className="mt-2 text-xs font-mono text-red-400 bg-red-50 px-3 py-1.5 rounded-lg inline-block">
                                {this.state.message}
                            </p>
                        )}
                    </div>

                    {/* Try Again */}
                    <button
                        onClick={this.handleReset}
                        className="mt-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
