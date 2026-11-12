import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

// Evita la pantalla en blanco: si un componente falla al renderizar,
// muestra el error y permite recargar en lugar de desmontar toda la app.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Error de interfaz:', error, info.componentStack);
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div role="alert" style={{ padding: '2rem', fontFamily: 'inherit', color: '#1f2937' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Ocurrió un error al mostrar esta pantalla</h2>
        <p style={{ marginBottom: '1rem', color: '#b91c1c' }}>{error.message}</p>
        <button
          type="button"
          className="logout-button"
          onClick={() => window.location.reload()}
        >
          Recargar
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
