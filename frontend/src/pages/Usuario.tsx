import React, { useState, useEffect } from 'react';
import { userService } from '../services/apiService';
import type { User, CargoUsuario} from '../types/models';
import { useAuth } from '../context/AuthContext';
import { useModoAdmin } from '../context/ModoAdminContext';
import UsuarioAccionModal, { type AccionUsuario } from '../components/Usuario/UsuarioAccionModal';

interface RegisterUserForm {
  dni: string;
  email: string;
  nombre: string;
  apellido: string;
  cargo: CargoUsuario;
  contrasena: string;
  confirmarContrasena: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Usuario: React.FC = () => {
  const { user: usuarioActual } = useAuth();
  const { ocultarEdicion } = useModoAdmin();
  const [accionActiva, setAccionActiva] = useState<{ accion: AccionUsuario; usuario: User } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const [toggleLoading, setToggleLoading] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showRegisterForm, setShowRegisterForm] = useState<boolean>(false);
  const [editingEmailDni, setEditingEmailDni] = useState<string>('');
  const [emailDraft, setEmailDraft] = useState<string>('');
  const [emailSaving, setEmailSaving] = useState<boolean>(false);

  const [registerForm, setRegisterForm] = useState<RegisterUserForm>({
    dni: '',
    email: '',
    nombre: '',
    apellido: '',
    cargo: 'asistente',
    contrasena: '',
    confirmarContrasena: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (): Promise<void> => {
    try {
      setError('');
      const response = await userService.getAllUsers();
      setUsers(response.data || []);
    } catch (err: unknown) {
      console.error('Error cargando usuarios:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cargar los usuarios');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setRegisterLoading(true);
    setError('');
    setSuccess('');

    if (registerForm.dni.length !== 8) {
      setError('El DNI debe tener 8 dígitos');
      setRegisterLoading(false);
      return;
    }

    if (!EMAIL_REGEX.test(registerForm.email.trim())) {
      setError('Ingrese un correo electrónico válido');
      setRegisterLoading(false);
      return;
    }

    if (registerForm.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setRegisterLoading(false);
      return;
    }

    if (registerForm.contrasena !== registerForm.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      setRegisterLoading(false);
      return;
    }

    try {
      const userData = {
        dni: registerForm.dni,
        email: registerForm.email.trim().toLowerCase(),
        nombre: registerForm.nombre || undefined,
        apellido: registerForm.apellido || undefined,
        cargo: registerForm.cargo,
        contrasena: registerForm.contrasena
      };

      const result = await userService.register(userData);
      
      if (result.registered) {
        setSuccess('Usuario registrado exitosamente');
        setRegisterForm({
          dni: '',
          email: '',
          nombre: '',
          apellido: '',
          cargo: 'asistente',
          contrasena: '',
          confirmarContrasena: ''
        });
        setShowRegisterForm(false);
        await loadUsers();
      } else {
        setError(result.message || 'Error al registrar el usuario');
      }
    } catch (err: unknown) {
      console.error('Error registrando usuario:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al registrar el usuario');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const startEditEmail = (user: User): void => {
    setEditingEmailDni(user.dni);
    setEmailDraft(user.email || '');
    setError('');
    setSuccess('');
  };

  const cancelEditEmail = (): void => {
    setEditingEmailDni('');
    setEmailDraft('');
  };

  const saveEmail = async (user: User): Promise<void> => {
    const email = emailDraft.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setError('Ingrese un correo electrónico válido');
      return;
    }
    setEmailSaving(true);
    setError('');
    setSuccess('');
    try {
      await userService.actualizarEmailUsuario(user.dni, email);
      setUsers(prev => prev.map(u => (u.dni === user.dni ? { ...u, email } : u)));
      setSuccess(`Correo de ${user.nombre || user.dni} actualizado. Debe iniciar sesión con ${email}`);
      cancelEditEmail();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || 'No se pudo actualizar el correo');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleToggleStatus = async (user: User): Promise<void> => {
    setToggleLoading(user.dni);
    setError('');
    setSuccess('');

    try {
      const toggleData = {
        dniToToggle: user.dni,
        status: user.estado === 1 ? 0 : 1
      };

      const result = await userService.toggleUserStatus(toggleData);
      
      if (result.toggled) {
        setSuccess(`Usuario ${user.estado === 1 ? 'deshabilitado' : 'habilitado'} exitosamente`);
        await loadUsers();
      } else {
        setError(result.message || 'Error al cambiar el estado del usuario');
      }
    } catch (err: unknown) {
      console.error('Error cambiando estado:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cambiar el estado del usuario');
      }
    } finally {
      setToggleLoading('');
    }
  };

  const resetRegisterForm = (): void => {
    setRegisterForm({
      dni: '',
      email: '',
      nombre: '',
      apellido: '',
      cargo: 'asistente',
      contrasena: '',
      confirmarContrasena: ''
    });
    setError('');
    setSuccess('');
    setShowRegisterForm(false);
  };

  const getCargoDisplay = (cargo: CargoUsuario): string => {
    const cargos: Record<CargoUsuario, string> = {
      administrador: 'Administrador',
      doctor: 'Doctor',
      asistente: 'Asistente'
    };
    return cargos[cargo];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="usuarios-container">
      <div className="card">
        <div className="usuarios-header">
          <div>
            <h1 className="usuarios-title">Gestión de Usuarios</h1>
            <p className="usuarios-subtitle">Administra los usuarios del sistema</p>
          </div>
          {!ocultarEdicion && (
            <button
              onClick={() => setShowRegisterForm(true)}
              className="btn btn-primary"
            >
              Registrar Usuario
            </button>
          )}
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

      {showRegisterForm && !ocultarEdicion && (
        <div className="register-form-container">
          <h2 className="register-form-title">Registrar Nuevo Usuario</h2>
          
          <form onSubmit={handleRegister} className="register-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="dni" className="form-label">
                  DNI *
                </label>
                <input
                  id="dni"
                  name="dni"
                  type="text"
                  value={registerForm.dni}
                  onChange={handleRegisterChange}
                  required
                  className="form-input"
                  placeholder="Ingrese DNI (8 dígitos)"
                  maxLength={8}
                  pattern="[0-9]{8}"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Correo electrónico *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required
                  className="form-input"
                  placeholder="nombre@correo.com"
                  autoComplete="off"
                  maxLength={254}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cargo" className="form-label">
                  Cargo *
                </label>
                <select
                  id="cargo"
                  name="cargo"
                  value={registerForm.cargo}
                  onChange={handleRegisterChange}
                  required
                  className="form-input"
                >
                  <option value="asistente">Asistente</option>
                  <option value="doctor">Doctor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="nombre" className="form-label">
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={registerForm.nombre}
                  onChange={handleRegisterChange}
                  className="form-input"
                  placeholder="Ingrese nombre"
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellido" className="form-label">
                  Apellido
                </label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  value={registerForm.apellido}
                  onChange={handleRegisterChange}
                  className="form-input"
                  placeholder="Ingrese apellido"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contrasena" className="form-label">
                  Contraseña *
                </label>
                <input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  value={registerForm.contrasena}
                  onChange={handleRegisterChange}
                  required
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmarContrasena" className="form-label">
                  Confirmar Contraseña *
                </label>
                <input
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  type="password"
                  value={registerForm.confirmarContrasena}
                  onChange={handleRegisterChange}
                  required
                  className="form-input"
                  placeholder="Repita la contraseña"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={registerLoading}
                className="btn btn-primary btn-flex"
              >
                {registerLoading ? 'Registrando...' : 'Registrar Usuario'}
              </button>
              <button
                type="button"
                onClick={resetRegisterForm}
                disabled={registerLoading}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">
            Usuarios del Sistema <span className="table-count">({users.length})</span>
          </h2>
        </div>
        
        {users.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Correo (inicio de sesión)</th>
                  <th>Nombre Completo</th>
                  <th>Cargo</th>
                  <th>Estado</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.dni}>
                    <td className="user-dni">{user.dni}</td>
                    <td>
                      {editingEmailDni === user.dni ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="email"
                            value={emailDraft}
                            onChange={(e) => setEmailDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEmail(user);
                              if (e.key === 'Escape') cancelEditEmail();
                            }}
                            className="form-input"
                            style={{ minWidth: 200, padding: '0.35rem 0.6rem' }}
                            placeholder="nombre@correo.com"
                            aria-label={`Correo de ${user.nombre || user.dni}`}
                            autoFocus
                            disabled={emailSaving}
                          />
                          <button type="button" className="btn btn-sm btn-success" onClick={() => saveEmail(user)} disabled={emailSaving}>
                            {emailSaving ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button type="button" className="btn btn-sm" onClick={cancelEditEmail} disabled={emailSaving}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {user.email ? (
                            <span>{user.email}</span>
                          ) : (
                            <span className="badge badge-inactivo">Sin correo</span>
                          )}
                          {!ocultarEdicion && (
                            <button type="button" className="btn btn-sm" onClick={() => startEditEmail(user)}>
                              {user.email ? 'Cambiar' : 'Asignar'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {user.nombre || user.apellido ? (
                        `${user.nombre || ''} ${user.apellido || ''}`.trim()
                      ) : (
                        <span className="text-muted">No especificado</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-cargo badge-${user.cargo}`}>
                        {getCargoDisplay(user.cargo)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        user.estado === 1 ? 'badge-activo' : 'badge-inactivo'
                      }`}>
                        {user.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(user.fecha_creacion).toLocaleDateString('es-ES')}
                    </td>
                    <td>
                      {ocultarEdicion ? <span className="text-muted">Solo lectura</span> : (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => { setError(''); setSuccess(''); setAccionActiva({ accion: 'editar', usuario: user }); }}
                      >
                        Editar
                      </button>
                      {user.dni !== usuarioActual?.dni && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => { setError(''); setSuccess(''); setAccionActiva({ accion: 'contrasena', usuario: user }); }}
                        >
                          Contraseña
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={toggleLoading === user.dni}
                        className={`btn btn-sm ${
                          user.estado === 1 ? 'btn-warning' : 'btn-success'
                        }`}
                      >
                        {toggleLoading === user.dni ? (
                          'Procesando...'
                        ) : user.estado === 1 ? (
                          'Deshabilitar'
                        ) : (
                          'Habilitar'
                        )}
                      </button>
                      {user.dni !== usuarioActual?.dni && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger-soft"
                          onClick={() => { setError(''); setSuccess(''); setAccionActiva({ accion: 'eliminar', usuario: user }); }}
                        >
                          Eliminar
                        </button>
                      )}
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <span>👥</span>
            </div>
            <h3 className="empty-state-title">No hay usuarios</h3>
            <p className="empty-state-description">
              No se encontraron usuarios en el sistema
            </p>
            <button
              onClick={() => setShowRegisterForm(true)}
              className="btn btn-primary"
            >
              Registrar Primer Usuario
            </button>
          </div>
        )}
      </div>

      {accionActiva && !ocultarEdicion && (
        <UsuarioAccionModal
          accion={accionActiva.accion}
          usuario={accionActiva.usuario}
          esUsuarioActual={accionActiva.usuario.dni === usuarioActual?.dni}
          onClose={() => setAccionActiva(null)}
          onDone={async (mensaje) => {
            setAccionActiva(null);
            setSuccess(mensaje);
            await loadUsers();
          }}
        />
      )}
    </div>
  );
};

export default Usuario;