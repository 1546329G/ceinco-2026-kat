import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModoAdmin } from '../../context/ModoAdminContext';
import type { CargoUsuario } from '../../types/models';

interface MenuItem {
  path: string;
  label: string;
  roles: CargoUsuario[];
  icon: string;
}

const TODOS: CargoUsuario[] = ['administrador', 'doctor', 'asistente'];

// Trazos de iconos (24x24, estilo línea)
const menuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Inicio', roles: TODOS, icon: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
  { path: '/pacientes', label: 'Pacientes', roles: TODOS, icon: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M22 19v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { path: '/citas', label: 'Citas', roles: TODOS, icon: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2' },
  { path: '/consulta', label: 'Consultas', roles: TODOS, icon: 'M9 3h6v4H9zM6 5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1M12 11v6M9 14h6' },
  { path: '/reporte', label: 'Reportes', roles: ['doctor', 'administrador'], icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { path: '/usuario', label: 'Usuarios', roles: ['administrador'], icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1' },
  { path: '/perfil', label: 'Perfil', roles: TODOS, icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' }
];

const nombreCargo: Record<CargoUsuario, string> = {
  administrador: 'Administrador',
  doctor: 'Doctor(a)',
  asistente: 'Asistente'
};

const Sidebar: React.FC = () => {
  const { cargo: cargoReal, user, logout } = useAuth();
  const { cargoVista: cargo } = useModoAdmin();
  const [cerrando, setCerrando] = React.useState(false);
  const [error, setError] = React.useState('');

  const cerrarSesion = async (): Promise<void> => {
    setCerrando(true);
    setError('');
    try {
      await logout();
    } catch {
      setError('No se pudo cerrar la sesión.');
    } finally {
      setCerrando(false);
    }
  };

  const nombre = [user?.nombre, user?.apellido].filter(Boolean).join(' ');
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="" className="sidebar-logo" />
        <span className="sidebar-brand-name">CEINCO</span>
      </div>

      <nav className="sidebar-nav" aria-label="Menú principal">
        {menuItems.filter(item => cargo && item.roles.includes(cargo)).map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <span className="sidebar-avatar" aria-hidden="true">{iniciales || '·'}</span>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{nombre || 'Usuario'}</span>
          <span className="sidebar-user-role">{cargoReal ? nombreCargo[cargoReal] : ''}{cargo && cargo !== cargoReal ? ` · viendo como ${nombreCargo[cargo]}` : ''}</span>
        </div>
        <button onClick={cerrarSesion} disabled={cerrando} className="sidebar-logout" title="Cerrar sesión" aria-label="Cerrar sesión">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
        {error && <span role="alert" className="sidebar-error">{error}</span>}
      </div>
    </aside>
  );
};

export default Sidebar;
