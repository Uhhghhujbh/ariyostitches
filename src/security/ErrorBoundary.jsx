import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error });
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleReload = () => window.location.reload();
    handleGoHome = () => { window.location.href = '/'; };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-onyx-950 flex items-center justify-center px-6">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 mx-auto mb-8 border-2 border-red-500/50 rounded-full flex items-center justify-center">
                            <span className="text-4xl">⚠</span>
                        </div>
                        <h1 className="font-display text-3xl text-white mb-4">Something Went Wrong</h1>
                        <p className="text-gray-400 mb-8">We apologize for the inconvenience. An unexpected error occurred.</p>
                        {import.meta.env.DEV && this.state.error && (
                            <div className="text-left bg-red-900/20 border border-red-500/30 rounded p-4 mb-8 overflow-auto max-h-48">
                                <p className="text-red-400 text-sm font-mono">{this.state.error.toString()}</p>
                            </div>
                        )}
                        <div className="flex gap-4 justify-center">
                            <button onClick={this.handleReload} className="btn-elegant">Reload Page</button>
                            <button onClick={this.handleGoHome} className="btn-filled">Go Home</button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
