import React from 'react';
import type { Paciente } from '../../types/models';
import '../../styles/paciente.css'

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

  return (
    <div className="paciente-table">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>DNI</th>
              <th>Edad</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((paciente) => (
              <tr 
                key={paciente.ID_FICHA_CLINICA}
                className="table-row"
                onClick={() => onSelectPaciente(paciente)}
              >
                <td>
                  <div className="patient-info">
                    <div className="patient-avatar">
                      {paciente.NOMBRE_APELLIDO.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="patient-name">{paciente.NOMBRE_APELLIDO}</div>
                      <div className="patient-email">{paciente.EMAIL}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="patient-dni">
                    {paciente.DNI}
                  </div>
                </td>
                <td>
                  <div className="patient-age">
                    {paciente.FECHA_NACIMIENTO 
                      ? `${calcularEdad(paciente.FECHA_NACIMIENTO)} años`
                      : paciente.EDAD ? `${paciente.EDAD} años` : 'N/A'
                    }
                  </div>
                </td>
                <td className="patient-phone">
                  {paciente.TELEFONO || 'N/A'}
                </td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPaciente(paciente);
                    }}
                    className="details-button"
                  >
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PacienteTable;