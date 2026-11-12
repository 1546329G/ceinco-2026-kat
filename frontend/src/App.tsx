import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ModoAdminProvider } from './context/ModoAdminContext';
import AppRouter from './components/router/AppRouter';
import ErrorBoundary from './components/ui/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ModoAdminProvider>
          <AppRouter />
        </ModoAdminProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;