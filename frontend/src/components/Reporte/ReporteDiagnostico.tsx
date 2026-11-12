import React from 'react';
import type { ReporteDiagnosticoResponse } from '../../types/models';

interface DiagnosticReportProps {
  data: ReporteDiagnosticoResponse;
}

const DiagnosticReport: React.FC<DiagnosticReportProps> = ({ data }) => {
  const { parametros, resultados, detallePacientes } = data;

  const formatPorcentaje = (porcentaje: string | number): string => {
    if (typeof porcentaje === 'number') {
      return `${porcentaje.toFixed(2)}%`;
    }
    return porcentaje;
  };

  const calcularPorcentaje = (cantidad: number): number => {
    return resultados.pacientesConDiagnostico > 0 
      ? (cantidad / resultados.pacientesConDiagnostico) * 100 
      : 0;
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <h2>Reporte de Diagnóstico</h2>
        <p className="report-subtitle">
          CIE-10: {parametros.diagnostico} - {parametros.descripcion}
        </p>
        <p className="report-period">
          Período: {parametros.rangoFechas} ({parametros.periodoDias} días)
        </p>
      </div>

      <div className="report-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{resultados.totalConsultasAtendidas}</div>
            <div className="stat-label">Total Consultas</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{resultados.pacientesConDiagnostico}</div>
            <div className="stat-label">Con Diagnóstico</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{formatPorcentaje(resultados.porcentaje)}</div>
            <div className="stat-label">Prevalencia</div>
          </div>
        </div>

        <div className="distribution-section">
          <h3>Distribución por Sexo</h3>
          <div className="distribution-grid">
            {resultados.estadisticasSexo.map((stat, index) => {
              const porcentaje = calcularPorcentaje(stat.cantidad);
              const label = stat.SEXO === 'M' ? 'Masculino' : 
                           stat.SEXO === 'F' ? 'Femenino' : stat.SEXO;
              
              return (
                <div key={index} className="distribution-card">
                  <div className="distribution-header">
                    <span className="distribution-label">{label}</span>
                    <span className="distribution-count">{stat.cantidad}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${porcentaje}%`
                      }}
                    ></div>
                  </div>
                  <div className="distribution-percentage">
                    {porcentaje.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="patients-section">
          <div className="patients-header">
            <h3>Pacientes Diagnosticados ({detallePacientes.total})</h3>
            {detallePacientes.lista.length > 0 && (
              <span className="patients-count">
                Mostrando {detallePacientes.lista.length} de {detallePacientes.total}
              </span>
            )}
          </div>
          
          {detallePacientes.lista.length > 0 ? (
            <div className="table-container">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>DNI</th>
                    <th>Paciente</th>
                    <th>Edad</th>
                    <th>Sexo</th>
                    <th>Fecha Consulta</th>
                    <th>Médico</th>
                  </tr>
                </thead>
                <tbody>
                  {detallePacientes.lista.map((paciente, index) => (
                    <tr key={index}>
                      <td className="patient-dni">{paciente.DNI}</td>
                      <td className="patient-name">{paciente.NOMBRE_APELLIDO}</td>
                      <td className="patient-age">{paciente.EDAD} años</td>
                      <td className="patient-gender">
                        {paciente.SEXO === 'M' ? 'Masculino' : paciente.SEXO === 'F' ? 'Femenino' : paciente.SEXO}
                      </td>
                      <td className="patient-date">
                        {new Date(paciente.FECHA).toLocaleDateString('es-ES')}
                      </td>
                      <td className="patient-doctor">
                        Dr. {paciente.DOCTOR_NOMBRE} {paciente.DOCTOR_APELLIDO}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No hay pacientes registrados</h3>
              <p>No se encontraron pacientes con el diagnóstico seleccionado en el período especificado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticReport;