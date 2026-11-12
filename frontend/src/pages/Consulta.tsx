import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  antecedentesService, 
  pacienteService, 
  consultaService,
  diagnosticoService,
  examenFisicoService,
  citaService
} from "../services/apiService";
import type {
  Cita,
  Paciente,
  PrimeraConsultaResponse,
  PacienteResponse,
  CargoUsuario,
  ConsultaCompletaData,
  DiagnosticosConsultaResponse,
  ExamenFisicoResponse
} from "../types/models";
import PatientSelector from "../components/Consulta/PacienteSelector";
import VitalSignsForm from "../components/Consulta/VitalSignsForm";
import SignosVitalesVista from "../components/Consulta/SignosVitalesVista";
import AntecedentesForm from "../components/Consulta/AntecedentesForm";
import ConsultationForm from "../components/Consulta/ConsultaForm";
import DiagnosticosPanel from "../components/Consulta/DiagnosticosPanel";
import ExamenFisicoPanel from "../components/Consulta/ExamenFisicoPanel";
import ExamenesAuxiliaresPanel from "../components/Consulta/ExamenesAuxiliaresPanel";
import RecetaPanel from "../components/Consulta/RecetaPanel";
import RegistrosPacientePanel from "../components/Consulta/RegistrosPacientePanel";
import Alert from "../components/ui/Alert";
import { useModoAdmin } from "../context/ModoAdminContext";
import { formatoFechaLarga } from "../utils/fechas";

interface AlertState {
  type: "success" | "error" | "info" | "warning";
  message: string;
  visible: boolean;
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

interface ConsultaState {
  selectedPatient: string;
  patientInfo: Paciente | null;
  vitalSignsId: number | null;
  fichaClinicaId: number | null;
  consultationId: number | null;
  isFirstConsultation: boolean;
  showAntecedentes: boolean;
  hasAntecedentes: boolean;
  loading: boolean;
  activeTab: 'signos-vitales' | 'antecedentes' | 'consulta' | 'diagnosticos' | 'examen-fisico' | 'recetas' | 'examenes-auxiliares';
  consultaData: ConsultaCompletaData | null;
  diagnosticosData: DiagnosticosConsultaResponse | null;
  examenFisicoData: ExamenFisicoResponse | null;
}

const Consulta: React.FC = () => {
  const { isAuthenticated } = useAuth();
  // cargoVista: rol real o, si el admin observa como doctor/asistente, ese rol.
  const { ocultarEdicion, cargoVista } = useModoAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const idCitaUrl = Number(searchParams.get('cita')) || null;
  // Cita desde la que se inició la consulta (botón "Atender" en Citas)
  const [citaActiva, setCitaActiva] = useState<Cita | null>(null);
  const [citaError, setCitaError] = useState('');
  const userCargo: CargoUsuario = cargoVista || "asistente";

  const [state, setState] = useState<ConsultaState>({
    selectedPatient: "",
    patientInfo: null,
    vitalSignsId: null,
    fichaClinicaId: null,
    consultationId: null,
    isFirstConsultation: false,
    showAntecedentes: false,
    hasAntecedentes: false,
    loading: false,
    activeTab: 'signos-vitales',
    consultaData: null,
    diagnosticosData: null,
    examenFisicoData: null
  });

  const [alert, setAlert] = useState<AlertState>({
    type: "info",
    message: "",
    visible: false,
  });

  const mostrarAlert = (type: AlertState["type"], message: string): void => {
    setAlert({ type, message, visible: true });
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  useEffect(() => {
    if (state.consultationId) {
      cargarDatosConsulta(state.consultationId);
    }
  }, [state.consultationId]);

  useEffect(() => {
    const verificarSignosVitalesExistentes = async (): Promise<void> => {
      if (state.fichaClinicaId && !state.vitalSignsId) {
        const esDoctor = userCargo === 'doctor' || userCargo === 'administrador';
        try {
          const response = await consultaService.verificarSignosVitalesHoy(state.fichaClinicaId);
          if (response.tieneSignosVitalesHoy && response.idExamenClinico) {
            setState(prev => ({
              ...prev,
              vitalSignsId: response.idExamenClinico,
              activeTab: esDoctor
                ? (prev.isFirstConsultation && !prev.hasAntecedentes ? 'antecedentes' : 'consulta')
                : prev.activeTab
            }));
            if (esDoctor) mostrarAlert("success", "Signos vitales encontrados - Puede continuar con la consulta");
          }
        } catch (error) {
          console.log('Error al verificar signos vitales:', error);
        }
      }
    };

    verificarSignosVitalesExistentes();
  }, [state.fichaClinicaId, userCargo, state.isFirstConsultation, state.hasAntecedentes, state.vitalSignsId]);

  const cargarDatosConsulta = async (idConsulta: number): Promise<void> => {
    try {
      const [consultaResponse, diagnosticosResponse] = await Promise.all([
        consultaService.obtenerConsultaCompleta(idConsulta),
        diagnosticoService.obtenerDiagnosticosConsulta(idConsulta)
      ]);

      setState(prev => ({
        ...prev,
        consultaData: consultaResponse.data,
        diagnosticosData: diagnosticosResponse
      }));
      try {
        const examenFisicoResponse = await examenFisicoService.obtenerExamenFisico(idConsulta);
        setState(prev => ({
          ...prev,
          examenFisicoData: examenFisicoResponse
        }));
      } catch {
        // Examen físico no existe, es normal
      }
    } catch (error) {
      console.error('Error cargando datos de consulta:', error);
    }
  };

  const handlePatientSelect = async (dni: string): Promise<void> => {
    if (!dni) {
      mostrarAlert("error", "Error: DNI no válido");
      return;
    }

    setState(prev => ({
      ...prev,
      selectedPatient: dni,
      vitalSignsId: null,
      fichaClinicaId: null,
      consultationId: null,
      patientInfo: null,
      isFirstConsultation: false,
      showAntecedentes: false,
      hasAntecedentes: false,
      loading: true,
      activeTab: 'signos-vitales',
      consultaData: null,
      diagnosticosData: null,
      examenFisicoData: null
    }));

    try {
      const pacienteResponse: PacienteResponse = await pacienteService.buscarPacientePorDNI(dni);
      let pacienteData: Paciente | undefined;

      if (Array.isArray(pacienteResponse.data)) {
        pacienteData = pacienteResponse.data[0];
      } else {
        pacienteData = pacienteResponse.data;
      }

      if (pacienteData && pacienteData.ID_FICHA_CLINICA) {
        setState(prev => ({
          ...prev,
          patientInfo: pacienteData,
          fichaClinicaId: pacienteData.ID_FICHA_CLINICA
        }));

        try {
          const primeraConsultaResponse: PrimeraConsultaResponse = 
            await antecedentesService.verificarPrimeraConsulta(dni);
          
          setState(prev => ({
            ...prev,
            isFirstConsultation: primeraConsultaResponse.esPrimeraConsulta,
            showAntecedentes: primeraConsultaResponse.mostrarAntecedentes,
            hasAntecedentes: primeraConsultaResponse.tieneAntecedentes
          }));
          if ((userCargo === 'doctor' || userCargo === 'administrador')) {
            try {
              const signosResponse = await consultaService.verificarSignosVitalesHoy(pacienteData.ID_FICHA_CLINICA);
              if (signosResponse.tieneSignosVitalesHoy && signosResponse.idExamenClinico) {
                setState(prev => ({
                  ...prev,
                  vitalSignsId: signosResponse.idExamenClinico,
                  activeTab: primeraConsultaResponse.esPrimeraConsulta && 
                            primeraConsultaResponse.mostrarAntecedentes ? 'antecedentes' : 'consulta'
                }));
                mostrarAlert("success", "Paciente encontrado - Signos vitales registrados - Puede continuar con la consulta");
                return;
              }
            } catch (error) {
              console.log('Error al verificar signos vitales:', error);
            }
          }

          if (primeraConsultaResponse.esPrimeraConsulta && primeraConsultaResponse.mostrarAntecedentes) {
            if ((userCargo === 'doctor' || userCargo === 'administrador')) {
              setState(prev => ({ ...prev, activeTab: 'antecedentes' }));
            }
            mostrarAlert("info", "Primera consulta - Complete los antecedentes médicos");
          } else {
            mostrarAlert("success", "Paciente encontrado - Puede continuar con la consulta");
          }
        } catch {
          setState(prev => ({
            ...prev,
            isFirstConsultation: true,
            showAntecedentes: true,
            activeTab: (userCargo === 'doctor' || userCargo === 'administrador') ? 'antecedentes' : 'signos-vitales'
          }));
          mostrarAlert("info", "Primera consulta - Complete los antecedentes médicos");
        }
      } else {
        mostrarAlert("error", "No se pudo obtener la información del paciente");
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      if (apiError.response?.status === 404) {
        mostrarAlert("error", "Paciente no encontrado en el sistema");
      } else {
        mostrarAlert("error", apiError.response?.data?.error || apiError.message || "Error al cargar información");
      }
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleVitalSignsComplete = (idExamenClinico: number, idFichaClinica: number): void => {
    setState(prev => ({
      ...prev,
      vitalSignsId: idExamenClinico,
      fichaClinicaId: idFichaClinica,
      activeTab: (userCargo === 'doctor' || userCargo === 'administrador') ? 
        (prev.isFirstConsultation && !prev.hasAntecedentes ? 'antecedentes' : 'consulta') : 
        'signos-vitales'
    }));
    mostrarAlert("success", "Signos vitales registrados correctamente");
  };

  const handleAntecedentesComplete = (): void => {
    setState(prev => ({
      ...prev,
      showAntecedentes: false,
      hasAntecedentes: true,
      activeTab: 'consulta'
    }));
    mostrarAlert("success", "Antecedentes médicos registrados correctamente");
  };

  const handleConsultationComplete = (idConsulta: number): void => {
    setCitaActiva(prev => (prev ? { ...prev, ESTADO: 'ATENDIDA' } : prev));
    setState(prev => ({
      ...prev,
      consultationId: idConsulta,
      isFirstConsultation: false,
      activeTab: 'diagnosticos'
    }));
    mostrarAlert("success", "Consulta médica registrada correctamente");
  };

  const handleNewConsultation = (): void => {
    setCitaActiva(null);
    setCitaError('');
    if (idCitaUrl) setSearchParams({}, { replace: true });
    setState({
      selectedPatient: "",
      patientInfo: null,
      vitalSignsId: null,
      fichaClinicaId: null,
      consultationId: null,
      isFirstConsultation: false,
      showAntecedentes: false,
      hasAntecedentes: false,
      loading: false,
      activeTab: 'signos-vitales',
      consultaData: null,
      diagnosticosData: null,
      examenFisicoData: null
    });
  };

  // Al llegar desde "Atender": cargar la cita y seleccionar a su paciente
  useEffect(() => {
    if (!idCitaUrl) return;
    let vigente = true;
    setCitaError('');
    citaService.obtenerCita(idCitaUrl)
      .then(cita => {
        if (!vigente) return;
        setCitaActiva(cita);
        if (cita.ESTADO !== 'PROGRAMADA') {
          setCitaError(`Esta cita ya está ${cita.ESTADO?.toLowerCase() ?? 'cerrada'}. Puede revisar al paciente, pero la consulta no quedará vinculada a la cita.`);
        }
        if (cita.DNI) handlePatientSelect(cita.DNI);
      })
      .catch(() => { if (vigente) setCitaError('No se encontró la cita indicada.'); });
    return () => { vigente = false; };
    // handlePatientSelect se recrea en cada render; solo debe ejecutarse al cambiar la cita
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCitaUrl]);

  const setActiveTab = (tab: ConsultaState['activeTab']): void => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  // En modo lectura el administrador solo ve los datos: sin formularios de consulta.
  const isDoctor = !ocultarEdicion && (userCargo === "doctor" || userCargo === "administrador");
  const tabVisible = ocultarEdicion ? 'signos-vitales' : state.activeTab;
  // Solo el asistente registra signos vitales; doctor y administrador los ven en modo lectura.
  const isAsistente = userCargo === "asistente";

  const canAccessConsulta = isDoctor && state.vitalSignsId && (!state.isFirstConsultation || state.hasAntecedentes);
  const canAccessAntecedentes = isDoctor && state.isFirstConsultation && !state.hasAntecedentes;

  if (!isAuthenticated) {
    return (
      <div className="consulta-container">
        <div className="auth-error">
          <h2>Acceso No Autorizado</h2>
          <p>Debe iniciar sesión para acceder a esta funcionalidad.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="consulta-container">
      <div className="consulta-header">
        <h1 className="consulta-title">
          {isDoctor ? "Consulta Médica" : "Registro de Paciente"}
        </h1>
        <p className="consulta-subtitle">
          Sistema de historial clínico - Gestión completa de atención médica
        </p>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
      />

      {!state.selectedPatient ? (
        <div className="patient-selection-section">
          <div className="selection-card">
            <PatientSelector onPatientSelect={handlePatientSelect} />
          </div>
        </div>
      ) : (
        <div className="consulta-workflow">
          {citaActiva && (
            <section className="cita-activa" aria-label="Cita programada">
              <div className="cita-activa-titulo">
                <span className="cita-activa-icono" aria-hidden="true">📅</span>
                <div>
                  <strong>Cita programada</strong>
                  <span className="text-muted">Atendiendo la cita N.º {citaActiva.ID_CITAS}</span>
                </div>
                <span className={`badge ${citaActiva.ESTADO === 'ATENDIDA' ? 'badge-success' : citaActiva.ESTADO === 'CANCELADA' ? 'badge-danger' : 'badge-primary'}`}>
                  {citaActiva.ESTADO === 'ATENDIDA' ? 'Atendida' : citaActiva.ESTADO === 'CANCELADA' ? 'Cancelada' : 'Programada'}
                </span>
              </div>
              <dl className="cita-activa-datos">
                <div><dt>Fecha</dt><dd>{formatoFechaLarga(citaActiva.FECHA)}</dd></div>
                <div><dt>Hora</dt><dd className="mono">{citaActiva.HORA?.slice(0, 5)}</dd></div>
                <div><dt>Doctor</dt><dd>{citaActiva.DOCTOR || '—'}</dd></div>
                <div><dt>Servicio</dt><dd>{citaActiva.SERVICIO || 'Consulta general'}</dd></div>
              </dl>
              {citaActiva.ESTADO === 'ATENDIDA' && state.consultationId && (
                <p className="cita-activa-nota">La consulta quedó registrada y la cita se marcó como atendida.</p>
              )}
            </section>
          )}
          {citaError && <div className="alert alert-warning cita-activa-alerta" role="status">{citaError}</div>}
          <div className="patient-header-card">
            <div className="patient-info">
              <div className="patient-main-info">
                <h2 className="patient-name">
                  {state.patientInfo?.NOMBRE_APELLIDO || `Paciente DNI: ${state.selectedPatient}`}
                </h2>
                <div className="patient-details">
                  <span className="detail-item">
                    <strong>DNI:</strong> {state.selectedPatient}
                  </span>
                  {state.patientInfo?.EDAD && (
                    <span className="detail-item">
                      <strong>Edad:</strong> {state.patientInfo.EDAD} años
                    </span>
                  )}
                  {state.patientInfo?.SEXO && (
                    <span className="detail-item">
                      <strong>Sexo:</strong> {state.patientInfo.SEXO}
                    </span>
                  )}
                  <span className="detail-item">
                    <strong>Ficha:</strong> {state.fichaClinicaId || 'N/A'}
                  </span>
                  <span className="detail-item">
                    <strong>Signos Vitales:</strong> 
                    {state.vitalSignsId ? ' Registrado' : 'Pendientes'}
                  </span>
                </div>
              </div>
              <div className="patient-status">
                {state.isFirstConsultation && (
                  <span className="status-badge primary">Primera Consulta</span>
                )}
                {state.hasAntecedentes && (
                  <span className="status-badge success">Antecedentes OK</span>
                )}
                {state.vitalSignsId && (
                  <span className="status-badge success">Signos Vitales OK</span>
                )}
                {state.consultationId && (
                  <span className="status-badge success">Consulta Registrada</span>
                )}
              </div>
            </div>
            <button
              onClick={handleNewConsultation}
              className="btn btn-outline"
              type="button"
            >
              Nuevo Paciente
            </button>
          </div>
          <div className="consulta-main">
          <div className="consulta-tabs">
            {(isAsistente || isDoctor) && (
              <button
                className={`tab-button ${state.activeTab === 'signos-vitales' ? 'active' : ''}`}
                onClick={() => setActiveTab('signos-vitales')}
              >
                Signos Vitales
              </button>
            )}
            
            {canAccessAntecedentes && (
              <button
                className={`tab-button ${state.activeTab === 'antecedentes' ? 'active' : ''}`}
                onClick={() => setActiveTab('antecedentes')}
              >
                Antecedentes
              </button>
            )}
            
            {isDoctor && (
              <button
                className={`tab-button ${state.activeTab === 'consulta' ? 'active' : ''}`}
                onClick={() => setActiveTab('consulta')}
                disabled={!canAccessConsulta}
              >
                Consulta Médica
                {!canAccessConsulta && " (Requiere signos vitales)"}
              </button>
            )}
            
            {isDoctor && state.consultationId && (
              <>
                <button
                  className={`tab-button ${state.activeTab === 'diagnosticos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('diagnosticos')}
                >
                Diagnósticos
                </button>

                <button
                  className={`tab-button ${state.activeTab === 'recetas' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recetas')}
                >
                Receta
                </button>
                
                <button
                  className={`tab-button ${state.activeTab === 'examen-fisico' ? 'active' : ''}`}
                  onClick={() => setActiveTab('examen-fisico')}
                >
                Examen Físico
                </button>
                
                <button
                  className={`tab-button ${state.activeTab === 'examenes-auxiliares' ? 'active' : ''}`}
                  onClick={() => setActiveTab('examenes-auxiliares')}
                >
                Exámenes Aux.
                </button>
              </>
            )}
          </div>

          <div className="tab-content">
            {tabVisible === 'signos-vitales' && (
              <div className="tab-panel">
                {isAsistente ? (
                  <VitalSignsForm
                    patientDni={state.selectedPatient}
                    onComplete={handleVitalSignsComplete}
                  />
                ) : (
                  <SignosVitalesVista
                    idFichaClinica={state.fichaClinicaId}
                    refreshKey={state.vitalSignsId ?? ''}
                    onEncontrados={(idExamenClinico) => {
                      if (state.vitalSignsId) return;
                      setState(prev => ({ ...prev, vitalSignsId: idExamenClinico }));
                      mostrarAlert("success", "Signos vitales registrados por el asistente - Puede continuar con la consulta");
                    }}
                  />
                )}
              </div>
            )}

            {tabVisible === 'antecedentes' && isDoctor && (
              <div className="tab-panel">
                <AntecedentesForm
                  patientDni={state.selectedPatient}
                  onComplete={handleAntecedentesComplete}
                  onCancel={() => setActiveTab('signos-vitales')}
                />
              </div>
            )}

            {tabVisible === 'consulta' && isDoctor && (
              <div className="tab-panel">
                <ConsultationForm
                  patientDni={state.selectedPatient}
                  idFichaClinica={state.fichaClinicaId}
                  idCita={citaActiva?.ESTADO === 'PROGRAMADA' ? citaActiva.ID_CITAS : null}
                  onComplete={handleConsultationComplete}
                  onBack={() => setActiveTab(state.isFirstConsultation ? 'antecedentes' : 'signos-vitales')}
                />
              </div>
            )}

            {tabVisible === 'diagnosticos' && isDoctor && state.consultationId && (
              <div className="tab-panel">
                <DiagnosticosPanel
                  consultationId={state.consultationId}
                  diagnosticosData={state.diagnosticosData}
                  onUpdate={() => state.consultationId && cargarDatosConsulta(state.consultationId)}
                />
                <div className="form-actions">
                  <button type="button" className="btn btn-primary" onClick={() => setActiveTab('recetas')}>
                    Siguiente: Receta →
                  </button>
                </div>
              </div>
            )}

            {tabVisible === 'recetas' && isDoctor && state.consultationId && (
              <div className="tab-panel">
                <RecetaPanel consultationId={state.consultationId} />
              </div>
            )}

            {tabVisible === 'examen-fisico' && isDoctor && state.consultationId && (
              <div className="tab-panel">
                <ExamenFisicoPanel
                  consultationId={state.consultationId}
                  examenFisicoData={state.examenFisicoData}
                  onUpdate={() => state.consultationId && cargarDatosConsulta(state.consultationId)}
                />
              </div>
            )}


            {tabVisible === 'examenes-auxiliares' && isDoctor && state.consultationId && (
              <div className="tab-panel">
                <ExamenesAuxiliaresPanel
                  consultationId={state.consultationId}
                />
              </div>
            )}
          </div>

          </div>

          <aside className="consulta-side">
          <RegistrosPacientePanel
            patientDni={state.selectedPatient}
            idFichaClinica={state.fichaClinicaId}
            refreshKey={`${state.vitalSignsId ?? ''}-${state.hasAntecedentes}`}
          />

          <div className="status-panel">
            <h3 className="status-title">Progreso de la Consulta</h3>
            <div className="status-steps">
              <div className={`status-step ${state.vitalSignsId ? 'completed' : 'pending'}`}>
                <div className="step-info">
                  <span className="step-title">Signos Vitales</span>
                  <span className="step-status">
                    {state.vitalSignsId ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              </div>

              {isDoctor && (
                <div className={`status-step ${
                  state.hasAntecedentes ? 'completed' : 
                  state.isFirstConsultation ? 'required' : 'optional'
                }`}>
                  <div className="step-info">
                    <span className="step-title">Antecedentes</span>
                    <span className="step-status">
                      {state.hasAntecedentes ? 'Completado' : 
                       state.isFirstConsultation ? 'Requerido' : 'Opcional'}
                    </span>
                  </div>
                </div>
              )}

              {isDoctor && (
                <div className={`status-step ${state.consultationId ? 'completed' : 
                  (state.vitalSignsId && (!state.isFirstConsultation || state.hasAntecedentes) ? 'ready' : 'pending')}`}>
                  <div className="step-info">
                    <span className="step-title">Consulta Médica</span>
                    <span className="step-status">
                      {state.consultationId ? 'Completada' : 
                       (state.vitalSignsId && (!state.isFirstConsultation || state.hasAntecedentes) ? 'Lista' : 'Pendiente')}
                    </span>
                  </div>
                </div>
              )}

              {isDoctor && state.consultationId && (
                <>
                  <div className="status-step optional">
                    <div className="step-info">
                      <span className="step-title">Diagnósticos</span>
                      <span className="step-status">Opcional</span>
                    </div>
                  </div>

                  <div className="status-step optional">
                    <div className="step-info">
                      <span className="step-title">Examen Físico</span>
                      <span className="step-status">Opcional</span>
                    </div>
                  </div>

                  
                </>
              )}
            </div>
          </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Consulta;