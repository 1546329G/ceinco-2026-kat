import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../layout/Layout';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import Pacientes from '../../pages/Pacientes';
import Citas from '../../pages/Citas'; 
import Consulta from '../../pages/Consulta';
import Reporte from '../../pages/Reporte';
import Usuario from '../../pages/Usuario';
import Perfil from '../../pages/Perfil';

const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/citas" element={<Citas />} />
            <Route path="/consulta" element={<Consulta />} />
            <Route element={<ProtectedRoute roles={['administrador', 'doctor']} />}>
              <Route path="/reporte" element={<Reporte />} />
            </Route>
            <Route element={<ProtectedRoute roles={['administrador']} />}>
              <Route path="/usuario" element={<Usuario />} />
            </Route>
            <Route path="/perfil" element={<Perfil />} />
          </Route>
        </Route>
        
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;