import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/main.css';

import type { CargoUsuario } from '../../types/models';

const ProtectedRoute: React.FC<{ roles?: CargoUsuario[] }> = ({ roles }) => {
  const { isAuthenticated, loading, cargo } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Verificando autenticación</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && (!cargo || !roles.includes(cargo))) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export default ProtectedRoute;