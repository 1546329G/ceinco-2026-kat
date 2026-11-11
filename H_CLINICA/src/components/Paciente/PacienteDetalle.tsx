import React, { useState, useEffect, useCallback } from 'react';
import { pacienteService, consultaService, historiaClinicaService } from '../../services/apiService';
import type { Paciente, Consulta, CreatePacienteData } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import PacienteForm from './PacienteForm';
import '../../styles/paciente.css'

interface PacienteDetailProps {
  paciente: Paciente;
  onBack: () => void;
}

interface ConsultaCompleta extends Consulta {
  ANTECEDENTES_FAMILIARES?: string;
  ANTECEDENTES_PERSONALES?: string;
  ANTECEDENTES_ALERGICOS?: string;
  MEDICACION_ACTUAL?: string;
  EXAMEN_FISICO?: string;
  SAO2?: number;
  FR?: number;
  TEMPERATURA?: number;
  EXAMEN_DETALLE?: Array<{ nombre: string; valor: string }>;
  MOTIVO_CONSULTA?: string;
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
  const { cargo } = useAuth();
  const puedeVerAntecedentes = cargo === 'administrador' || cargo === 'doctor';
  const [antecedentes, setAntecedentes] = useState<Array<{ nombre: string; valor: string }> | null>(null);
  const [errorAntecedentes, setErrorAntecedentes] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [detalle, setDetalle] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<ConsultaCompleta[] | null>(null);
  const [consultasError, setConsultasError] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'info' | 'consultas' | 'antecedentes'>('info');
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

  useEffect(() => {
    if (activeTab !== 'antecedentes' || !puedeVerAntecedentes) return;
    let vigente = true;
    setAntecedentes(null);
    setErrorAntecedentes(false);
    historiaClinicaService.obtenerAntecedentes(paciente.DNI)
      .then(campos => { if (vigente) setAntecedentes(campos); })
      .catch(() => { if (vigente) setErrorAntecedentes(true); });
    return () => { vigente = false; };
  }, [activeTab, paciente.DNI, puedeVerAntecedentes]);

  const descargarPDF = async (soloAntecedentes: boolean) => {
    setDescargando(true);
    try {
      const archivo = await historiaClinicaService.generarHistoriaClinicaPDF(paciente.DNI, soloAntecedentes);
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `${soloAntecedentes ? 'antecedentes' : 'historia'}-${paciente.DNI}.pdf`;
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      mostrarAlert('error', 'No se pudo descargar el PDF');
    } finally {
      setDescargando(false);
    }
  };

  useEffect(() => {
    loadDetalleCompleto();
  }, [loadDetalleCompleto]);

  useEffect(() => {
    let vigente = true;
    setConsultas(null);
    setConsultasError(false);
    consultaService.obtenerConsultasPorPaciente(paciente.DNI)
      .then(response => { if (vigente) setConsultas(response.consultas); })
      .catch(() => { if (vigente) setConsultasError(true); });
    return () => { vigente = false; };
  }, [paciente.DNI]);

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

  const formatearTexto = (texto: string | undefined): string => {
    if (!texto) return 'No especificado';
    return texto.length > 100 ? `${texto.substring(0, 100)}...` : texto;
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

  return (
    <div className="paciente-detail">
      {/* Alert */}
      {alert.visible && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <div className="alert-content">
            <p className="alert-message">{alert.message}</p>
          </div>
        </div>
      )}

      <div className="detail-header">
        <div className="detail-header-content">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="detail-back">
              ← Volver
            </button>
            <div className="detail-patient-info">
              <h2 className="detail-name">{pacienteData.NOMBRE_APELLIDO}</h2>
              <p className="detail-dni">DNI: {pacienteData.DNI}</p>
            </div>
          </div>
          <div className="detail-header-actions">
            {!editMode && (puedeVerAntecedentes || cargo === 'asistente') && (
              <button type="button" className="btn btn-secondary" disabled={descargando}
                onClick={() => descargarPDF(false)}>Descargar historia clínica</button>
            )}
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="btn btn-primary"
                disabled={saving}
              >
                Editar Paciente
              </button>
            )}
            <span className={`badge ${
              pacienteData.SEXO === 'M' 
                ? 'badge-male'
                : pacienteData.SEXO === 'F'
                ? 'badge-female'
                : 'badge-unknown'
            }`}>
              {pacienteData.SEXO === 'M' ? 'Masculino' : pacienteData.SEXO === 'F' ? 'Femenino' : 'No especificado'}
            </span>
          </div>
        </div>
      </div>

      {editMode ? (
        <div className="edit-form-container">
          <div className="edit-form-header">
            <h3 className="edit-form-title">Editar Paciente</h3>
            <p className="edit-form-subtitle">Modifique la información del paciente</p>
          </div>
          <PacienteForm
            initialData={getFormData()}
            onSubmit={handleSaveEdit}
            onCancel={handleCancelEdit}
            isEditing={true}
          />
        </div>
      ) : (
        <>
          <div className="detail-tabs">
            <nav className="tab-nav">
              <button
                onClick={() => setActiveTab('info')}
                className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
              >
                Información Personal
              </button>
              <button
                onClick={() => setActiveTab('consultas')}
                className={`tab-button ${activeTab === 'consultas' ? 'active' : ''}`}
              >
                Historial de Consultas{consultas && ` (${consultas.length})`}
              </button>
              {puedeVerAntecedentes && (
                <button type="button" onClick={() => setActiveTab('antecedentes')}
                  className={`tab-button ${activeTab === 'antecedentes' ? 'active' : ''}`}>
                  Antecedentes
                </button>
              )}
            </nav>
          </div>

          <div className="tab-content">
            {activeTab === 'info' && (
              <div className="info-grid">
                <div className="info-section">
                  <h3 className="section-header">Información Básica</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Fecha de Nacimiento:</span>
                      <span className="info-value">
                        {pacienteData.FECHA_NACIMIENTO 
                          ? `${new Date(pacienteData.FECHA_NACIMIENTO).toLocaleDateString('es-ES')} (${calcularEdad(pacienteData.FECHA_NACIMIENTO)} años)`
                          : pacienteData.EDAD ? `${pacienteData.EDAD} años` : 'No especificado'
                        }
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estado Civil:</span>
                      <span className="info-value">{pacienteData.ESTADO_CIVIL || 'No especificado'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Ocupación:</span>
                      <span className="info-value">{pacienteData.OCUPACION || 'No especificado'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Raza/Etnia:</span>
                      <span className="info-value">{pacienteData.RAZA || 'No especificado'}</span>
                    </div>
                  </div>
                </div>
                <div className="info-section">
                  <h3 className="section-header">Información de Contacto</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Teléfono:</span>
                      <span className="info-value">{pacienteData.TELEFONO || 'No especificado'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{pacienteData.EMAIL || 'No especificado'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Domicilio:</span>
                      <span className="info-value">{pacienteData.DOMICILIO || 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-section info-full">
                  <h3 className="section-header">Información Adicional</h3>
                  <div className="info-grid-inner">
                    <div className="info-item">
                      <span className="info-label">Lugar de Nacimiento:</span>
                      <span className="info-value">{pacienteData.NACIMIENTO || 'No especificado'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Procedencia:</span>
                      <span className="info-value">{pacienteData.PROCEDENCIA || 'No especificado'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Responsable:</span>
                      <span className="info-value">{pacienteData.RESPONSABLE || 'No especificado'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Institución:</span>
                      <span className="info-value">{pacienteData.INSTITUCION || 'No especificado'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'antecedentes' && puedeVerAntecedentes && (
              <section className="info-section">
                <h3 className="section-header">Antecedentes clínicos</h3>
                {errorAntecedentes && <p role="alert">No se pudieron cargar los antecedentes.</p>}
                {!errorAntecedentes && antecedentes === null && <p>Cargando antecedentes…</p>}
                {antecedentes?.length === 0 && <p>Sin antecedentes registrados.</p>}
                {antecedentes && antecedentes.length > 0 && (
                  <>
                    <dl className="info-list">
                      {antecedentes.map(({ nombre, valor }, index) => (
                        <div className="info-item" key={`${nombre}-${index}`}>
                          <dt className="info-label">{nombre}</dt><dd className="info-value">{valor}</dd>
                        </div>
                      ))}
                    </dl>
                    <button type="button" className="btn btn-primary" disabled={descargando}
                      onClick={() => descargarPDF(true)}>Descargar antecedentes en PDF</button>
                  </>
                )}
              </section>
            )}

            {activeTab === 'consultas' && (
              <div className="consultas-section">
                {consultasError ? (
                  <p role="alert">No se pudo cargar el historial de consultas.</p>
                ) : consultas === null ? (
                  <div className="skeleton-pulse">
                    <div className="skeleton-header w-1/3 mb-4"></div>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="skeleton-row mb-3" style={{height: '150px'}}></div>
                    ))}
                  </div>
                ) : consultas.length > 0 ? (
                  <div className="consultas-list">
                    {consultas.map((consulta) => (
                      <div key={consulta.ID_CONSULTA} className="consulta-item">
                        <div className="consulta-header">
                          <div className="consulta-fecha">
                            {new Date(consulta.FECHA).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {consulta.DOCTOR && (
                            <div className="consulta-doctor">
                              Dr. {consulta.DOCTOR}
                            </div>
                          )}
                        </div>
                        <div className="consulta-content">
                          {consulta.MOTIVO_CONSULTA && (
                            <div className="consulta-field">
                              <span className="consulta-label">Motivo de Consulta:</span>
                              <span className="consulta-value">{consulta.MOTIVO_CONSULTA}</span>
                            </div>
                          )}

                          {(consulta.ANTECEDENTES_FAMILIARES || consulta.ANTECEDENTES_PERSONALES || consulta.ANTECEDENTES_ALERGICOS) && (
                            <div className="consulta-field-group">
                              <span className="consulta-label">Antecedentes:</span>
                              <div className="consulta-group-content">
                                {consulta.ANTECEDENTES_FAMILIARES && (
                                  <div className="consulta-subfield">
                                    <span className="consulta-sublabel">Familiares:</span>
                                    <span className="consulta-value">{formatearTexto(consulta.ANTECEDENTES_FAMILIARES)}</span>
                                  </div>
                                )}
                                {consulta.ANTECEDENTES_PERSONALES && (
                                  <div className="consulta-subfield">
                                    <span className="consulta-sublabel">Personales:</span>
                                    <span className="consulta-value">{formatearTexto(consulta.ANTECEDENTES_PERSONALES)}</span>
                                  </div>
                                )}
                                {consulta.ANTECEDENTES_ALERGICOS && (
                                  <div className="consulta-subfield">
                                    <span className="consulta-sublabel">Alérgicos:</span>
                                    <span className="consulta-value">{formatearTexto(consulta.ANTECEDENTES_ALERGICOS)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {consulta.MEDICACION_ACTUAL && (
                            <div className="consulta-field">
                              <span className="consulta-label">Medicación Actual:</span>
                              <span className="consulta-value">{formatearTexto(consulta.MEDICACION_ACTUAL)}</span>
                            </div>
                          )}

                          {consulta.EXAMEN_FISICO && (
                            <div className="consulta-field">
                              <span className="consulta-label">Examen Físico:</span>
                              <span className="consulta-value">{formatearTexto(consulta.EXAMEN_FISICO)}</span>
                            </div>
                          )}

                          {consulta.EXAMEN_DETALLE?.map(({ nombre, valor }) => (
                            <div className="consulta-field" key={nombre}>
                              <span className="consulta-label">{nombre}:</span>
                              <span className="consulta-value">{valor}</span>
                            </div>
                          ))}

                          {consulta.RELATO && (
                            <div className="consulta-field">
                              <span className="consulta-label">Relato:</span>
                              <span className="consulta-value">
                                {consulta.RELATO}
                              </span>
                            </div>
                          )}

                          {consulta.DIAGNOSTICO && (
                            <div className="consulta-field">
                              <span className="consulta-label">Diagnóstico:</span>
                              <span className="consulta-value">{consulta.DIAGNOSTICO}</span>
                            </div>
                          )}

                          {consulta.PLAN_DE_TRABAJO && (
                            <div className="consulta-field">
                              <span className="consulta-label">Plan de Trabajo:</span>
                              <span className="consulta-value">
                                {consulta.PLAN_DE_TRABAJO}
                              </span>
                            </div>
                          )}

                          {(consulta.PA || consulta.PULSO || consulta.PESO || consulta.TALLA || consulta.SAO2 || consulta.FR || consulta.TEMPERATURA) && (
                            <div className="consulta-field">
                              <span className="consulta-label">Signos Vitales:</span>
                              <span className="consulta-value">
                                {[
                                  consulta.PA && `PA: ${consulta.PA}`,
                                  consulta.PULSO && `Pulso: ${consulta.PULSO}`,
                                  consulta.PESO && `Peso: ${consulta.PESO}kg`,
                                  consulta.TALLA && `Talla: ${consulta.TALLA} m`,
                                  consulta.SAO2 && `Saturación: ${consulta.SAO2}%`,
                                  consulta.FR && `Frecuencia respiratoria: ${consulta.FR}`,
                                  consulta.TEMPERATURA && `Temperatura: ${consulta.TEMPERATURA} °C`,
                                  consulta.IMC && `IMC: ${consulta.IMC}`
                                ].filter(Boolean).join(' | ')}
                              </span>
                            </div>
                          )}
                        </div>
                      
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="consultas-placeholder">
                    <p className="placeholder-subtext">
                      No se encontraron consultas registradas para este paciente
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PacienteDetalle;