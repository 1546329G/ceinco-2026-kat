import React from 'react';
import type { Paciente } from '../../types/models';
import Paginacion, { usePaginacion } from '../ui/Paginacion';

interface PacienteTable{
  pacientes: Paciente[];
  loading: boolean;
  onSelectPaciente: (paciente: Paciente) => void;
}

const PacienteTable: React.FC<PacienteTable> = ({
  pacientes,
  loading,
  onSelectPaciente
}) => {
  const paginacion = usePaginacion(pacientes, 15);

  if (loading) {
    return (
      <div className="paciente-table">
        <div className="table-loading">
          <div className="skeleton-pulse">
            <div className="skeleton-header"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-row"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pacientes.length === 0) {
    return (
      <div className="table-empty">
        <div className="empty-icon">👥</div>
        <h3 className="empty-title">No hay pacientes</h3>
        <p className="empty-description">No se encontraron pacientes registrados</p>
      </div>
    );
  }

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const iniciales = (nombre: string): string =>
    nombre.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return (
    <div className="paciente-table">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>DNI</th>
              <th>Edad</th>
              <th>Sexo</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {paginacion.visibles.map((paciente) => (
              <tr key={paciente.ID_FICHA_CLINICA} className="table-row" onClick={() => onSelectPaciente(paciente)}>
                <td>
                  <div className="patient-info">
                    <span className="patient-avatar" aria-hidden="true">{iniciales(paciente.NOMBRE_APELLIDO)}</span>
                    <span className="patient-name">{paciente.NOMBRE_APELLIDO}</span>
                  </div>
                </td>
                <td className="mono">{paciente.DNI}</td>
                <td>
                  {paciente.FECHA_NACIMIENTO
                    ? `${calcularEdad(paciente.FECHA_NACIMIENTO)} años`
                    : paciente.EDAD ? `${paciente.EDAD} años` : '—'}
                </td>
                <td>{paciente.SEXO === 'F' ? 'Femenino' : paciente.SEXO === 'M' ? 'Masculino' : '—'}</td>
                <td className="mono">{paciente.TELEFONO || '—'}</td>
                <td className="text-muted truncate">{paciente.EMAIL || '—'}</td>
                <td className="cell-actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectPaciente(paciente); }}
                    className="btn btn-secondary btn-sm"
                  >
                    Ver ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacion {...paginacion} onCambiar={paginacion.setPagina} />
    </div>
  );
};

export default PacienteTable;