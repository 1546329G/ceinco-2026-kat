import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './components/router/AppRouter';
import './styles/main.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;