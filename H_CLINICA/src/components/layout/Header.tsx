import React from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/main.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const [logoutError, setLogoutError] = React.useState('');
  const [closing, setClosing] = React.useState(false);
  const handleLogout = async (): Promise<void> => {
    setClosing(true);
    setLogoutError('');
    try {
      await logout();
    } catch {
      setLogoutError('No se pudo cerrar la sesión. Intente nuevamente.');
    } finally {
      setClosing(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <img 
            src="/logo.png" 
            alt="Logo CEINCO" 
            className="header-logo" 
          />
          <h1 className="header-title">CEINCO</h1>
          <span className="header-user">
            {user?.nombre} {user?.apellido} - {user?.cargo}
          </span>
        </div>
        <div className="header-right">
          <button
            onClick={handleLogout}
            disabled={closing}
            className="logout-button"
          >
            {closing ? 'Cerrando sesión' : 'Cerrar Sesión'}
          </button>
          {logoutError && <span role="alert">{logoutError}</span>}
        </div>
      </div>
    </header>
  );
};

export default Header;