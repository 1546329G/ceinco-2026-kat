import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/main.css';

interface MenuItem {
  path: string;
  label: string;
  roles: string[];
}

const Sidebar: React.FC = () => {
  const { cargo } = useAuth();
  const location = useLocation();

  const isActive = (path: string): boolean => location.pathname === path;

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: 'Inicio', roles: ['administrador', 'doctor', 'asistente'] },
    { path: '/pacientes', label: 'Pacientes', roles: ['administrador', 'doctor', 'asistente'] },
    { path: '/citas', label: 'Citas', roles: ['administrador', 'doctor', 'asistente'] },
    { path: '/consulta', label: 'Consultas', roles: ['administrador', 'doctor', 'asistente'] },
    { path: '/reporte', label: 'Reportes', roles: ['doctor','administrador'] },
    { path: '/usuario', label: 'Usuarios', roles: ['administrador'] },
    { path: '/perfil', label: 'Perfil', roles: ['administrador', 'doctor', 'asistente'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(cargo as string)
  );

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {filteredMenuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;