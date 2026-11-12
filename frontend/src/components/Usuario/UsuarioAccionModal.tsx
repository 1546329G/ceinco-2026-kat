import React, { useState } from 'react';
import { userService } from '../../services/apiService';
import type { CargoUsuario, User } from '../../types/models';

export type AccionUsuario = 'editar' | 'contrasena' | 'eliminar';

interface Props {
  accion: AccionUsuario;
  usuario: User;
  esUsuarioActual: boolean;
  onClose: () => void;
  onDone: (mensaje: string) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const titulos: Record<AccionUsuario, string> = {
  editar: 'Editar usuario',
  contrasena: 'Cambiar contraseña',
  eliminar: 'Eliminar usuario'
};

const mensajeError = (err: unknown, porDefecto: string): string =>
  (err as { response?: { data?: { error?: string } } }).response?.data?.error || porDefecto;

const UsuarioAccionModal: React.FC<Props> = ({ accion, usuario, esUsuarioActual, onClose, onDone }) => {
  const [form, setForm] = useState({
    nombre: usuario.nombre || '',
    apellido: usuario.apellido || '',
    cargo: usuario.cargo,
    email: usuario.email || ''
  });
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.dni;

  const enviar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    if (accion === 'editar') {
      if (form.nombre.trim().length < 2 || form.apellido.trim().length < 2) {
        setError('Nombre y apellido deben tener al menos 2 caracteres');
        return;
      }
      if (!EMAIL_REGEX.test(form.email.trim())) {
        setError('Ingrese un correo electrónico válido');
        return;
      }
    }
    if (accion === 'contrasena') {
      if (contrasena.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (contrasena !== confirmar) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    setGuardando(true);
    try {
      if (accion === 'editar') {
        await userService.actualizarUsuario(usuario.dni, {
          nombre: form.nombre.trim(), apellido: form.apellido.trim(),
          cargo: form.cargo, email: form.email.trim().toLowerCase()
        });
        onDone(`Usuario ${nombreCompleto} actualizado`);
      } else if (accion === 'contrasena') {
        await userService.restablecerContrasena(usuario.dni, contrasena);
        onDone(`Contraseña de ${nombreCompleto} actualizada. Su sesión activa se cerró.`);
      } else {
        await userService.eliminarUsuario(usuario.dni);
        onDone(`Usuario ${nombreCompleto} eliminado`);
      }
    } catch (err) {
      setError(mensajeError(err, 'No se pudo completar la acción'));
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="usuario-modal-titulo"
      onKeyDown={(e) => { if (e.key === 'Escape' && !guardando) onClose(); }}>
      <div className="cita-modal" style={{ width: 'min(520px, 100%)' }}>
        <div className="modal-header">
          <h2 id="usuario-modal-titulo" className="modal-title">{titulos[accion]}</h2>
          <button type="button" className="btn btn-sm" onClick={onClose} disabled={guardando} aria-label="Cerrar">✕</button>
        </div>
        <form onSubmit={enviar} className="modal-body">
          <p className="text-muted">{nombreCompleto} · DNI {usuario.dni}</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}

          {accion === 'editar' && (
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="edit-nombre" className="form-label">Nombre *</label>
                <input id="edit-nombre" className="form-input" value={form.nombre} autoFocus required
                  onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} disabled={guardando} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-apellido" className="form-label">Apellido *</label>
                <input id="edit-apellido" className="form-input" value={form.apellido} required
                  onChange={(e) => setForm(f => ({ ...f, apellido: e.target.value }))} disabled={guardando} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-email" className="form-label">Correo (inicio de sesión) *</label>
                <input id="edit-email" type="email" className="form-input" value={form.email} required maxLength={254}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} disabled={guardando} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-cargo" className="form-label">Cargo *</label>
                <select id="edit-cargo" className="form-input" value={form.cargo}
                  onChange={(e) => setForm(f => ({ ...f, cargo: e.target.value as CargoUsuario }))}
                  disabled={guardando || esUsuarioActual}>
                  <option value="asistente">Asistente</option>
                  <option value="doctor">Doctor</option>
                  <option value="administrador">Administrador</option>
                </select>
                {esUsuarioActual && <small className="text-muted">No puedes cambiar tu propio cargo</small>}
              </div>
            </div>
          )}

          {accion === 'contrasena' && (
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nueva-contrasena" className="form-label">Nueva contraseña *</label>
                <input id="nueva-contrasena" type="password" className="form-input" value={contrasena} autoFocus required
                  minLength={6} placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                  onChange={(e) => setContrasena(e.target.value)} disabled={guardando} />
              </div>
              <div className="form-group">
                <label htmlFor="confirmar-contrasena" className="form-label">Confirmar contraseña *</label>
                <input id="confirmar-contrasena" type="password" className="form-input" value={confirmar} required
                  autoComplete="new-password" onChange={(e) => setConfirmar(e.target.value)} disabled={guardando} />
              </div>
            </div>
          )}

          {accion === 'eliminar' && (
            <div className="alert alert-warning" role="status">
              Esta acción no se puede deshacer. Si el usuario ya registró citas, consultas o signos vitales no se podrá
              eliminar; en ese caso deshabilítelo.
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={guardando}
              className={`btn ${accion === 'eliminar' ? 'btn-danger' : 'btn-primary'} btn-flex`}>
              {guardando ? 'Procesando...' : accion === 'editar' ? 'Guardar cambios'
                : accion === 'contrasena' ? 'Cambiar contraseña' : 'Eliminar usuario'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioAccionModal;
