import React from 'react';
import type { Cita } from '../../types/models';
import '../../styles/cita.css';

interface CitaListaProps {
  citas: Cita[];
  canManage: boolean;
  canAttend: boolean;
  filtroEstado: string;
  onCambiarEstado: (idCita: number, nuevoEstado: string) => void;
  onEditarCita: (cita: Cita) => void;
  onEliminarCita: (idCita: number) => void;
}

const CitaLista: React.FC<CitaListaProps> = ({
  citas,
  canManage,
  canAttend,
  filtroEstado,
  onCambiarEstado,
  onEditarCita,
  onEliminarCita,
}) => {
  const getEstadoDisplay = (estado: string | null): string => {
    if (!estado) return 'Desconocido';
    
    const estados: Record<string, string> = {
      'PROGRAMADA': 'Programada',
      'ATENDIDA': 'Atendida',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
  };

  const getColorEstado = (estado: string | null): string => {
    if (!estado) return 'estado-desconocido';
    
    const colores: Record<string, string> = {
      'PROGRAMADA': 'estado-programada',
      'ATENDIDA': 'estado-atendida',
      'CANCELADA': 'estado-cancelada'
    };
    return colores[estado] || 'estado-desconocido';
  };

  const getTipoFecha = (fecha: string): 'PASADA' | 'HOY' | 'FUTURA' => {
    const hoy = new Date().toDateString();
    const citaDate = new Date(`${fecha}T00:00:00`).toDateString();
    
    if (citaDate < hoy) return 'PASADA';
    if (citaDate === hoy) return 'HOY';
    return 'FUTURA';
  };

  const getNombrePaciente = (cita: Cita): string => {
    if (cita.NOMBRE_APELLIDO) return cita.NOMBRE_APELLIDO;
    if (cita.PACIENTE_NOMBRE) return cita.PACIENTE_NOMBRE;
    return 'N/A';
  };

  const getDniPaciente = (cita: Cita): string => {
    if (cita.DNI) return cita.DNI;
    if (cita.DNI_PACIENTE) return cita.DNI_PACIENTE;
    return 'N/A';
  };

  const formatHora = (hora: string): string => {
    return hora.split(':').slice(0, 2).join(':');
  };

  if (citas.length === 0) {
    return (
      <div className="citas-empty">
        <div className="empty-state">
          <h3 className="empty-title">No hay citas</h3>
          <p className="empty-description">
            {filtroEstado 
              ? `No se encontraron citas con estado "${getEstadoDisplay(filtroEstado)}"`
              : 'No se encontraron citas programadas'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="citas-lista">
      <div className="lista-header">
        <h2 className="lista-title">
          Citas {filtroEstado ? `(${getEstadoDisplay(filtroEstado)})` : ''} 
          <span className="lista-count">{citas.length}</span>
        </h2>
      </div>
      
      <div className="table-container">
        <table className="citas-table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>DNI</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Servicio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita) => {
              const tipoFecha = getTipoFecha(cita.FECHA);
              const esPasada = tipoFecha === 'PASADA';
              const nombrePaciente = getNombrePaciente(cita);
              const dniPaciente = getDniPaciente(cita);
              const estado = cita.ESTADO || 'DESCONOCIDO';
              
              return (
                <tr key={cita.ID_CITAS} className={esPasada ? 'cita-pasada' : ''}>
                  <td>
                    <div className="paciente-info">
                      <div className="paciente-nombre">{nombrePaciente}</div>
                      {tipoFecha === 'HOY' && (
                        <span className="badge-hoy">Hoy</span>
                      )}
                    </div>
                  </td>
                  <td className="dni-cell">
                    {dniPaciente}
                  </td>
                  <td>
                    {new Date(`${cita.FECHA}T00:00:00`).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="hora-cell">
                    {formatHora(cita.HORA)}
                  </td>
                  <td className="servicio-cell">
                    {cita.SERVICIO || 'CONSULTA GENERAL'}
                  </td>
                  <td>
                    <span className={`badge ${getColorEstado(estado)}`}>
                      {getEstadoDisplay(estado)}
                    </span>
                  </td>
                  <td>
                    <div className="acciones">
                      {estado === 'PROGRAMADA' && (
                        <>
                          {canAttend && <button
                            onClick={() => onCambiarEstado(cita.ID_CITAS, 'ATENDIDA')}
                            className="btn btn-success btn-sm"
                            title="Marcar como atendida"
                          >
                            Atender
                          </button>}
                          {canManage && <>
                          <button
                            onClick={() => onEditarCita(cita)}
                            className="btn btn-secondary btn-sm"
                            title="Editar cita"
                          >
                            Editar
                          </button>
                          
                          <button
                            onClick={() => onCambiarEstado(cita.ID_CITAS, 'CANCELADA')}
                            className="btn btn-danger btn-sm"
                            title="Cancelar cita"
                          >
                            Cancelar
                          </button>
                          </>}
                        </>
                      )}
                      
                      {estado === 'ATENDIDA' && (
                        <div className="atendida-actions">
                          <span className="estado-completado">Completada</span>
                        </div>
                      )}
                      
                      {estado === 'CANCELADA' && canManage && (
                        <button
                          onClick={() => onEliminarCita(cita.ID_CITAS)}
                          className="btn btn-danger btn-sm"
                          title="Eliminar cita cancelada"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CitaLista;