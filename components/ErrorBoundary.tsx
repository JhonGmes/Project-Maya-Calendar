import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-custom-cream text-custom-soil p-6 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Ops, algo deu errado.</h1>
          <p className="mb-6 opacity-75">Ocorreu um erro inesperado na aplicação.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-custom-soil text-white rounded-full hover:bg-custom-caramel transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}