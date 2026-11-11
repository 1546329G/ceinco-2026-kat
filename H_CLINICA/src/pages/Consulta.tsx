import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  antecedentesService, 
  pacienteService, 
  consultaService,
  diagnosticoService,
  examenFisicoService
} from "../services/apiService";
import type {
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
import AntecedentesForm from "../components/Consulta/AntecedentesForm";
import ConsultationForm from "../components/Consulta/ConsultaForm";
import DiagnosticosPanel from "../components/Consulta/DiagnosticosPanel";
import ExamenFisicoPanel from "../components/Consulta/ExamenFisicoPanel";
import ExamenesAuxiliaresPanel from "../components/Consulta/ExamenesAuxiliaresPanel";
import Alert from "../components/ui/Alert";
import '../styles/paciente.css';

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
  const { user, cargo, isAuthenticated } = useAuth();
  const userCargo: CargoUsuario = user?.cargo || cargo || "asistente";

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
      if ((userCargo === 'doctor' || userCargo === 'administrador') && state.fichaClinicaId && !state.vitalSignsId) {
        try {
          const response = await consultaService.verificarSignosVitalesHoy(state.fichaClinicaId);
          if (response.tieneSignosVitalesHoy && response.idExamenClinico) {
            setState(prev => ({
              ...prev,
              vitalSignsId: response.idExamenClinico,
              activeTab: prev.isFirstConsultation && !prev.hasAntecedentes ? 'antecedentes' : 'consulta'
            }));
            mostrarAlert("success", "Signos vitales encontrados - Puede continuar con la consulta");
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
    setState(prev => ({
      ...prev,
      consultationId: idConsulta,
      isFirstConsultation: false,
      activeTab: 'diagnosticos'
    }));
    mostrarAlert("success", "Consulta médica registrada correctamente");
  };

  const handleNewConsultation = (): void => {
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

  const setActiveTab = (tab: ConsultaState['activeTab']): void => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const isDoctor = userCargo === "doctor" || userCargo === "administrador";
  const isAsistente = userCargo === "asistente" || userCargo === "administrador";

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
            {state.activeTab === 'signos-vitales' && (
              <div className="tab-panel">
                <VitalSignsForm
                  patientDni={state.selectedPatient}
                  onComplete={handleVitalSignsComplete}
                />
              </div>
            )}

            {state.activeTab === 'antecedentes' && isDoctor && (
              <div className="tab-panel">
                <AntecedentesForm
                  patientDni={state.selectedPatient}
                  onComplete={handleAntecedentesComplete}
                  onCancel={() => setActiveTab('signos-vitales')}
                />
              </div>
            )}

            {state.activeTab === 'consulta' && isDoctor && (
              <div className="tab-panel">
                <ConsultationForm
                  patientDni={state.selectedPatient}
                  idFichaClinica={state.fichaClinicaId}
                  onComplete={handleConsultationComplete}
                  onBack={() => setActiveTab(state.isFirstConsultation ? 'antecedentes' : 'signos-vitales')}
                />
              </div>
            )}

            {state.activeTab === 'diagnosticos' && isDoctor && state.consultationId && (
              <div className="tab-panel">
                <DiagnosticosPanel
                  consultationId={state.consultationId}
                  diagnosticosData={state.diagnosticosData}
                  onUpdate={() => state.consultationId && cargarDatosConsulta(state.consultationId)}
                />
              </div>
            )}

            {state.activeTab === 'examen-fisico' && isDoctor && state.consultationId && (
              <div className="tab-panel">
                <ExamenFisicoPanel
                  consultationId={state.consultationId}
                  examenFisicoData={state.examenFisicoData}
                  onUpdate={() => state.consultationId && cargarDatosConsulta(state.consultationId)}
                />
              </div>
            )}


            {state.activeTab === 'examenes-auxiliares' && isDoctor && state.consultationId && (
              <div className="tab-panel">
                <ExamenesAuxiliaresPanel
                  consultationId={state.consultationId}
                />
              </div>
            )}
          </div>

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
        </div>
      )}
    </div>
  );
};

export default Consulta;