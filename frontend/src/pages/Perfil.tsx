import React, { useState, useEffect } from 'react';
import { userService } from '../services/apiService';
import type { User , ChangePassword } from '../types/models';

const Perfil: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  
  const [passwordForm, setPasswordForm] = useState<ChangePassword>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (): Promise<void> => {
    try {
      setError('');
      setLoading(true);
      const userData = await userService.getProfile();
      setUser(userData);
    } catch (err: unknown) {
      console.error('Error cargando perfil:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cargar el perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setChangingPassword(true);
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      setChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      setChangingPassword(false);
      return;
    }

    try {
      const changePasswordData: { currentPassword: string; newPassword: string } = {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    };

      const result = await userService.changePassword(changePasswordData);
      
      if (result.changed) {
        setSuccess('Contraseña cambiada exitosamente');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowChangePassword(false);
      } else {
        setError(result.message || 'Error al cambiar la contraseña');
      }
    } catch (err: unknown) {
      console.error('Error cambiando contraseña:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cambiar la contraseña');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const resetForm = (): void => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
    setShowChangePassword(false);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-text">Cargando perfil</div>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="card">
        <div className="perfil-header">
          <h1 className="perfil-title">Perfil de Usuario</h1>
          <p className="perfil-subtitle">Gestiona tu información personal y seguridad</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-header">
            <h3 className="alert-title">Error</h3>
          </div>
          <p className="alert-message">{error}</p>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <div className="alert-header">
            <h3 className="alert-title">Éxito</h3>
          </div>
          <p className="alert-message">{success}</p>
        </div>
      )}

      <div className="perfil-grid">
        <div className="profile-card">
          <h2 className="profile-card-title">Información Personal</h2>
          {user ? (
            <div className="user-info">
              <div className="user-avatar">
                <div className="avatar-circle">
                  <span className="avatar-icon">👤</span>
                </div>
                <div className="user-details">
                  <h3 className="user-name">
                    {user.nombre && user.apellido 
                      ? `${user.nombre} ${user.apellido}`
                      : 'Usuario del Sistema'
                    }
                  </h3>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">DNI</label>
                  <p className="info-value">{user.dni}</p>
                </div>
                <div className="info-item">
                  <label className="info-label">Correo electrónico</label>
                  <p className="info-value">{user.email || 'Sin correo asignado'}</p>
                </div>

                <div className="info-item">
                  <label className="info-label">Cargo</label>
                  <span className="info-badge badge-primary">
                    {user.cargo}
                  </span>
                </div>

                <div className="info-item">
                  <label className="info-label">Estado</label>
                  <span className={`info-badge ${
                    user.estado === 1 ? 'badge-activo' : 'badge-inactivo'
                  }`}>
                    {user.estado === 1 ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {user.fecha_creacion && (
                  <div className="info-item">
                    <label className="info-label">Fecha de Registro</label>
                    <p className="info-value">
                      {new Date(user.fecha_creacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="profile-error">
              <p>No se pudo cargar la información del perfil</p>
              <button
                onClick={loadProfile}
                className="btn btn-primary mt-4"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
        <div className="profile-card">
          <div className="security-section">
            <div className="security-header">
              <h2 className="security-title">Seguridad</h2>
            </div>

            {showChangePassword ? (
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                  <label htmlFor="currentPassword" className="form-label">
                    Contraseña Actual
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="form-input"
                    placeholder="Ingrese su contraseña actual"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    Nueva Contraseña
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="form-input"
                    placeholder="Repita la nueva contraseña"
                  />
                </div>

                <div className="password-actions">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="btn btn-primary btn-flex-1"
                  >
                    {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={changingPassword}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="security-empty">
                <div className="security-icon">
                  <span>🔒</span>
                </div>
                <h3 className="security-empty-title">Seguridad de la cuenta</h3>
                <p className="security-empty-description">
                  Mantén tu cuenta segura cambiando regularmente tu contraseña
                </p>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="btn btn-primary"
                >
                  Cambiar Contraseña
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;