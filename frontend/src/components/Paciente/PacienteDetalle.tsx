import React, { useState, useEffect, useCallback } from 'react';
import { pacienteService, consultaService } from '../../services/apiService';
import type { Paciente, Consulta, CreatePacienteData } from '../../types/models';
import PacienteForm from './PacienteForm';
import ConsultaModal from './ConsultaModal';
import { useModoAdmin } from '../../context/ModoAdminContext';
import { edad, formatoFecha, formatoFechaLarga } from '../../utils/fechas';

interface PacienteDetailProps {
  paciente: Paciente;
  onBack: () => void;
}

interface ConsultaCompleta extends Consulta {
  EXAMEN_FISICO_SIMPLIFICADO?: string;
  TIPO_CONSULTA?: string;
}

interface ApiError {
  response?: {
    status: number;
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

const PacienteDetalle: React.FC<PacienteDetailProps> = ({ paciente, onBack }) => {
  const { ocultarEdicion } = useModoAdmin();
  const [detalle, setDetalle] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<ConsultaCompleta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [consultasLoading, setConsultasLoading] = useState<boolean>(true);
  const [consultasCargadas, setConsultasCargadas] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'info' | 'consultas'>('info');
  const [consultaAbierta, setConsultaAbierta] = useState<number | null>(null);
  const cerrarConsulta = useCallback(() => setConsultaAbierta(null), []);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string; visible: boolean }>({
    type: 'success',
    message: '',
    visible: false
  });

  const mostrarAlert = useCallback((type: 'success' | 'error', message: string): void => {
    setAlert({ type, message, visible: true });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, visible: false }));
    }, 5000);
  }, []);

  const loadDetalleCompleto = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await pacienteService.obtenerDetalleCompletoPaciente(paciente.DNI);
      setDetalle(response.patient);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error loading patient details:', apiError);
      mostrarAlert('error', 'Error al cargar los detalles del paciente');
    } finally {
      setLoading(false);
    }
  }, [paciente.DNI, mostrarAlert]);

  const loadConsultas = useCallback(async (): Promise<void> => {
    try {
      setConsultasLoading(true);
      const response = await consultaService.obtenerConsultasPorPaciente(paciente.DNI);
      setConsultas(response.consultas || []);
      setConsultasCargadas(true);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error loading consultations:', apiError);
      setConsultas([]);
    } finally {
      setConsultasLoading(false);
    }
  }, [paciente.DNI]);

  useEffect(() => {
    loadDetalleCompleto();
  }, [loadDetalleCompleto]);

  useEffect(() => {
    loadConsultas();
  }, [loadConsultas]);

  const handleSaveEdit = async (data: CreatePacienteData): Promise<void> => {
    try {
      setSaving(true);
      await pacienteService.actualizarPaciente(paciente.DNI, data);
      setEditMode(false);
      await loadDetalleCompleto(); 
      mostrarAlert('success', 'Paciente actualizado exitosamente');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating patient:', apiError);
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Error al actualizar el paciente';
      mostrarAlert('error', errorMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (): void => {
    setEditMode(false);
  };

  const getFormData = (): CreatePacienteData => {
    const pacienteData = detalle || paciente;
    return {
      dni: pacienteData.DNI,
      nombreApellido: pacienteData.NOMBRE_APELLIDO,
      fechaNacimiento: pacienteData.FECHA_NACIMIENTO?.slice(0, 10) || '',
      edad: pacienteData.EDAD,
      sexo: pacienteData.SEXO || '',
      estadoCivil: pacienteData.ESTADO_CIVIL || '',
      ocupacion: pacienteData.OCUPACION || '',
      domicilio: pacienteData.DOMICILIO || '',
      telefono: pacienteData.TELEFONO || '',
      email: pacienteData.EMAIL || '',
      responsable: pacienteData.RESPONSABLE || '',
      institucion: pacienteData.INSTITUCION || '',
      raza: pacienteData.RAZA || '',
      nacimiento: pacienteData.NACIMIENTO || '',
      procedencia: pacienteData.PROCEDENCIA || ''
    };
  };

  if (loading) {
    return (
      <div className="paciente-detail">
        <div className="p-6">
          <div className="skeleton-pulse">
            <div className="skeleton-header w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-row"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pacienteData = detalle || paciente;
  const anios = edad(pacienteData.FECHA_NACIMIENTO);
  const sexo = pacienteData.SEXO === 'M' ? 'Masculino' : pacienteData.SEXO === 'F' ? 'Femenino' : 'Sexo no registrado';
  const dato = (valor?: string | null) => valor || '—';
  const campos: Array<[string, string]> = [
    ['Fecha de nacimiento', pacienteData.FECHA_NACIMIENTO ? formatoFecha(pacienteData.FECHA_NACIMIENTO) : '—'],
    ['Estado civil', dato(pacienteData.ESTADO_CIVIL)],
    ['Ocupación', dato(pacienteData.OCUPACION)],
    ['Raza / etnia', dato(pacienteData.RAZA)],
    ['Teléfono', dato(pacienteData.TELEFONO)],
    ['Correo', dato(pacienteData.EMAIL)],
    ['Domicilio', dato(pacienteData.DOMICILIO)],
    ['Lugar de nacimiento', dato(pacienteData.NACIMIENTO)],
    ['Procedencia', dato(pacienteData.PROCEDENCIA)],
    ['Responsable', dato(pacienteData.RESPONSABLE)],
    ['Institución', dato(pacienteData.INSTITUCION)],
    ['Fecha de registro', pacienteData.FECHA ? formatoFecha(pacienteData.FECHA) : '—']
  ];

  return (
    <div className="paciente-detail">
      {consultaAbierta && <ConsultaModal idConsulta={consultaAbierta} onClose={cerrarConsulta} />}
      {alert.visible && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`} role="status">
          <p className="alert-message">{alert.message}</p>
        </div>
      )}

      <section className="card detail-header">
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Volver</button>
        <span className="patient-avatar patient-avatar-lg" aria-hidden="true">
          {pacienteData.NOMBRE_APELLIDO.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
        </span>
        <div className="detail-patient-info">
          <h2 className="detail-name">{pacienteData.NOMBRE_APELLIDO}</h2>
          <p className="detail-meta">
            <span>DNI <strong className="mono">{pacienteData.DNI}</strong></span>
            <span>{sexo}</span>
            {anios !== null && <span>{anios} años</span>}
          </p>
        </div>
        {!editMode && !ocultarEdicion && (
          <button onClick={() => setEditMode(true)} className="btn btn-primary" disabled={saving}>
            Editar paciente
          </button>
        )}
      </section>

      {editMode ? (
        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Editar paciente</h3>
          </div>
          <PacienteForm initialData={getFormData()} onSubmit={handleSaveEdit} onCancel={handleCancelEdit} isEditing={true} />
        </section>
      ) : (
        <section className="card card-flush">
          <nav className="tab-nav" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'info'}
              onClick={() => setActiveTab('info')}
              className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            >
              Información personal
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'consultas'}
              onClick={() => setActiveTab('consultas')}
              className={`tab-button ${activeTab === 'consultas' ? 'active' : ''}`}
            >
              Historial de consultas{consultasCargadas && ` (${consultas.length})`}
            </button>
          </nav>

          <div className="tab-content">
            {activeTab === 'info' && (
              <dl className="data-grid">
                {campos.map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="data-item">
                    <dt>{etiqueta}</dt>
                    <dd>{valor}</dd>
                  </div>
                ))}
              </dl>
            )}

            {activeTab === 'consultas' && (
              consultasLoading ? (
                <div className="skeleton-pulse">
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton-row" />)}
                </div>
              ) : consultas.length > 0 ? (
                <ol className="timeline">
                  {consultas.map((consulta) => {
                    const doctor = [consulta.DOCTOR_NOMBRE, consulta.DOCTOR_APELLIDO].filter(Boolean).join(' ');
                    return (
                      <li key={consulta.ID_CONSULTA} className="timeline-item">
                        <div className="timeline-head">
                          <time className="timeline-date">{formatoFechaLarga(consulta.FECHA)}</time>
                          {consulta.TIPO_CONSULTA && (
                            <span className={`badge ${consulta.TIPO_CONSULTA === 'Control' ? 'badge-neutral' : 'badge-primary'}`}>
                              {consulta.TIPO_CONSULTA}
                            </span>
                          )}
                          {doctor && <span className="timeline-doctor">Dr(a). {doctor}</span>}
                          <button
                            type="button"
                            onClick={() => setConsultaAbierta(consulta.ID_CONSULTA)}
                            className="btn btn-outline btn-sm timeline-ver"
                            title="Ver toda la consulta registrada ese día"
                          >
                            Ver consulta completa
                          </button>
                        </div>
                        <div className="timeline-body">
                          {consulta.RELATO && (
                            <div>
                              <h4 className="timeline-label">Relato</h4>
                              <p>{consulta.RELATO}</p>
                            </div>
                          )}
                          {consulta.PLAN_DE_TRABAJO && (
                            <div>
                              <h4 className="timeline-label">Plan de trabajo</h4>
                              <p>{consulta.PLAN_DE_TRABAJO}</p>
                            </div>
                          )}
                          {consulta.EXAMEN_FISICO_SIMPLIFICADO && (
                            <div>
                              <h4 className="timeline-label">Examen físico</h4>
                              <p>{consulta.EXAMEN_FISICO_SIMPLIFICADO}</p>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="empty-state">No hay consultas registradas para este paciente.</p>
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default PacienteDetalle;