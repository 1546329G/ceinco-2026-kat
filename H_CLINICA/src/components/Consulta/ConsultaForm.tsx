import React, { useState, useEffect } from 'react';
import { consultaService, pacienteService, antecedentesService } from '../../services/apiService';
import type { 
  Paciente, 
  PrimeraConsultaResponse,
} from '../../types/models';
import '../../styles/consulta.css';

interface ConsultationFormProps {
  patientDni: string;
  idFichaClinica: number | null;
  onComplete: (idConsulta: number) => void;
  onBack?: () => void;
}

interface ApiError {
  response?: {
    status: number;
    data?: {
      error?: string;
      message?: string;
      details?: unknown;
    };
  };
  message?: string;
}

interface FormData {
  diagnosticosSecundarios: string[];
  idExamenClinico: number;
  relato: string;
  planDeTrabajo: string;
  examenFisico: {
    neurologico: string;
    extremidades: string;
    cabezaCuello: string;
    estadoGeneral: string;
    habitus: string;
    hidratacion: string;
    conciencia: string;
    orientacion: string;
    cabeza: string;
    ojos: string;
    oidos: string;
    nariz: string;
    boca: string;
    cuello: string;
    torax: string;
    abdomen: string;
    ritmoCardiaco: string;
    ruidosCardiacos: string;
    soplos: string;
    frotes: string;
    pulsosPerifericos: string;
    formaAbdomen: string;
    peristalsis: string;
    visceromegalias: string;
    dolorPalpacion: string;
    signosIrritacion: string;
    extremidadesSuperiores: string;
    extremidadesInferiores: string;
    edema: string;
    pulsosExtremidades: string;
    temperaturaPiel: string;
    motilidad: string;
    sensibilidad: string;
    reflejos: string;
    fuerzaMuscular: string;
    coordinacion: string;
    observaciones: string;
  };
  examenFisicoSimplificado: string;
}

interface ApiPacienteResponse {
  message: string;
  data: Paciente | Paciente[];
}

interface VerificarSignosVitalesResponse {
  tieneSignosVitalesHoy: boolean;
  idExamenClinico: number | null;
}
interface ExamenFisicoDetalladoForm {
  examenGeneral?: {
    estadoGeneral?: string;
    habitus?: string;
    hidratacion?: string;
    conciencia?: string;
    orientacion?: string;
  };
  examenRegional?: {
    cabeza?: string;
    ojos?: string;
    oidos?: string;
    nariz?: string;
    boca?: string;
    cuello?: string;
    torax?: string;
    abdomen?: string;
  };
  examenCardiovascular?: {
    ritmoCardiaco?: string;
    ruidosCardiacos?: string;
    soplos?: string;
    frotes?: string;
    pulsosPerifericos?: string;
  };
  examenAbdominal?: {
    formaAbdomen?: string;
    peristalsis?: string;
    visceromegalias?: string;
    dolorPalpacion?: string;
    signosIrritacion?: string;
  };
  examenExtremidades?: {
    extremidadesSuperiores?: string;
    extremidadesInferiores?: string;
    edema?: string;
    pulsosExtremidades?: string;
    temperaturaPiel?: string;
  };
  examenNeurologico?: {
    motilidad?: string;
    sensibilidad?: string;
    reflejos?: string;
    fuerzaMuscular?: string;
    coordinacion?: string;
  };
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({
  patientDni,
  idFichaClinica,
  onComplete,
  onBack
}) => {
  const [formData, setFormData] = useState<FormData>({
    diagnosticosSecundarios: [],
    idExamenClinico: 0,
    relato: '',
    planDeTrabajo: '',
    examenFisicoSimplificado: '',
    examenFisico: {
      neurologico: '',
      extremidades: '',
      cabezaCuello: '',
      estadoGeneral: '',
      habitus: '',
      hidratacion: '',
      conciencia: '',
      orientacion: '',
      cabeza: '',
      ojos: '',
      oidos: '',
      nariz: '',
      boca: '',
      cuello: '',
      torax: '',
      abdomen: '',
      ritmoCardiaco: '',
      ruidosCardiacos: '',
      soplos: '',
      frotes: '',
      pulsosPerifericos: '',
      formaAbdomen: '',
      peristalsis: '',
      visceromegalias: '',
      dolorPalpacion: '',
      signosIrritacion: '',
      extremidadesSuperiores: '',
      extremidadesInferiores: '',
      edema: '',
      pulsosExtremidades: '',
      temperaturaPiel: '',
      motilidad: '',
      sensibilidad: '',
      reflejos: '',
      fuerzaMuscular: '',
      coordinacion: '',
      observaciones: ''
    }
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [patientInfo, setPatientInfo] = useState<Paciente | null>(null);
  const [error, setError] = useState<string>('');
  const [hasVitalSignsToday, setHasVitalSignsToday] = useState<boolean>(false);
  const [checkingVitalSigns, setCheckingVitalSigns] = useState<boolean>(false);
  const [isFirstConsultation, setIsFirstConsultation] = useState<boolean>(false);
  const [hasAntecedentes, setHasAntecedentes] = useState<boolean>(false);
  const [checkingAntecedentes, setCheckingAntecedentes] = useState<boolean>(false);

  useEffect(() => {
    const obtenerDatosPaciente = async (): Promise<void> => {
      try {
        const pacienteResponse: ApiPacienteResponse = await pacienteService.buscarPacientePorDNI(patientDni);
        
        let pacienteData: Paciente | null = null;
        
        if (Array.isArray(pacienteResponse.data)) {
          pacienteData = pacienteResponse.data[0] || null;
        } else {
          pacienteData = pacienteResponse.data || null;
        }

        if (pacienteData) {
          setPatientInfo(pacienteData);
          
          setCheckingAntecedentes(true);
          try {
            const primeraConsultaResponse: PrimeraConsultaResponse = 
              await antecedentesService.verificarPrimeraConsulta(patientDni);
            
            setIsFirstConsultation(primeraConsultaResponse.esPrimeraConsulta);
            setHasAntecedentes(primeraConsultaResponse.tieneAntecedentes);
            
          } catch (err) {
            const apiError = err as ApiError;
            console.error('Error verificando antecedentes:', apiError);
            setIsFirstConsultation(true);
            setHasAntecedentes(false);
          } finally {
            setCheckingAntecedentes(false);
          }
        }
      } catch (err: unknown) {
        const apiError = err as ApiError;
        console.error('Error obteniendo datos del paciente:', apiError);
        setError('Error al cargar información del paciente');
      }
    };

    if (patientDni) {
      obtenerDatosPaciente();
    }
  }, [patientDni]);

  useEffect(() => {
  const verificarSignosVitales = async (): Promise<void> => {
    if (!idFichaClinica) return;
    
    setCheckingVitalSigns(true);
    try {
      const response: VerificarSignosVitalesResponse = await consultaService.verificarSignosVitalesHoy(idFichaClinica);
      setHasVitalSignsToday(response.tieneSignosVitalesHoy);
    
      if (response.tieneSignosVitalesHoy && response.idExamenClinico !== null && response.idExamenClinico !== undefined) {
        const examenClinicoId = Number(response.idExamenClinico);
        
        if (!isNaN(examenClinicoId) && examenClinicoId > 0) {
          setFormData(prev => ({
            ...prev,
            idExamenClinico: examenClinicoId 
          }));
        } else {
          console.warn('ID de examen clínico no válido:', response.idExamenClinico);
        }
      } else {
        setFormData(prev => ({
          ...prev,
          idExamenClinico: 0
        }));
      }

      if (!response.tieneSignosVitalesHoy) {
        setError('No se encontraron signos vitales registrados para hoy. Por favor, registre los signos vitales primero.');
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error('Error verificando signos vitales:', apiError);
      setHasVitalSignsToday(false);
      setFormData(prev => ({
        ...prev,
        idExamenClinico: 0
      }));
      setError('Error al verificar signos vitales. Por favor, intente nuevamente.');
    } finally {
      setCheckingVitalSigns(false);
    }
  };

  verificarSignosVitales();
}, [idFichaClinica]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    
    if (!hasVitalSignsToday) {
      setError('Primero deben registrarse los signos vitales para hoy');
      return;
    }

    if (!idFichaClinica) {
      setError('No se pudo obtener la información del paciente');
      return;
    }

    if (!formData.relato.trim()) {
      setError('Por favor complete el relato de la consulta');
      return;
    }

    if (!formData.planDeTrabajo.trim()) {
      setError('Por favor complete el plan de trabajo');
      return;
    }

    if (isFirstConsultation) {
      if (!tieneDatosExamenFisico) {
        setError('Para primera consulta, complete al menos un campo del examen físico detallado');
        return;
      }
    } else {
      if (!formData.examenFisicoSimplificado.trim()) {
        setError('Por favor complete el examen físico simplificado');
        return;
      }
    }

    setLoading(true);
    try {
      const examenFisicoDetallado: ExamenFisicoDetalladoForm = {
        examenGeneral: {
          estadoGeneral: formData.examenFisico.estadoGeneral || '',
          habitus: formData.examenFisico.habitus || '',
          hidratacion: formData.examenFisico.hidratacion || '',
          conciencia: formData.examenFisico.conciencia || '',
          orientacion: formData.examenFisico.orientacion || ''
        },
        examenRegional: {
          cabeza: formData.examenFisico.cabeza || '',
          ojos: formData.examenFisico.ojos || '',
          oidos: formData.examenFisico.oidos || '',
          nariz: formData.examenFisico.nariz || '',
          boca: formData.examenFisico.boca || '',
          cuello: formData.examenFisico.cuello || '',
          torax: formData.examenFisico.torax || '',
          abdomen: formData.examenFisico.abdomen || ''
        },
        examenCardiovascular: {
          ritmoCardiaco: formData.examenFisico.ritmoCardiaco || '',
          ruidosCardiacos: formData.examenFisico.ruidosCardiacos || '',
          soplos: formData.examenFisico.soplos || '',
          frotes: formData.examenFisico.frotes || '',
          pulsosPerifericos: formData.examenFisico.pulsosPerifericos || ''
        },
        examenAbdominal: {
          formaAbdomen: formData.examenFisico.formaAbdomen || '',
          peristalsis: formData.examenFisico.peristalsis || '',
          visceromegalias: formData.examenFisico.visceromegalias || '',
          dolorPalpacion: formData.examenFisico.dolorPalpacion || '',
          signosIrritacion: formData.examenFisico.signosIrritacion || ''
        },
        examenExtremidades: {
          extremidadesSuperiores: formData.examenFisico.extremidadesSuperiores || '',
          extremidadesInferiores: formData.examenFisico.extremidadesInferiores || '',
          edema: formData.examenFisico.edema || '',
          pulsosExtremidades: formData.examenFisico.pulsosExtremidades || '',
          temperaturaPiel: formData.examenFisico.temperaturaPiel || ''
        },
        examenNeurologico: {
          motilidad: formData.examenFisico.motilidad || '',
          sensibilidad: formData.examenFisico.sensibilidad || '',
          reflejos: formData.examenFisico.reflejos || '',
          fuerzaMuscular: formData.examenFisico.fuerzaMuscular || '',
          coordinacion: formData.examenFisico.coordinacion || ''
        }
      };

      const consultaData = {
        idFichaClinica: idFichaClinica,
        idExamenClinico: formData.idExamenClinico,
        esPrimeraConsulta: isFirstConsultation,
        relato: formData.relato,
        planDeTrabajo: formData.planDeTrabajo,
        examenFisicoDetallado: isFirstConsultation
          ? { ...examenFisicoDetallado, observaciones: formData.examenFisico.observaciones }
          : formData.examenFisico.observaciones.trim()
            ? { ...examenFisicoDetallado, observaciones: formData.examenFisico.observaciones }
            : undefined,
        examenFisicoSimplificado: !isFirstConsultation ? formData.examenFisicoSimplificado : undefined,
        diagnosticosSecundarios: formData.diagnosticosSecundarios
      };

      console.log('Enviando consulta completa:', {
        idFichaClinica: consultaData.idFichaClinica,
        idExamenClinico: consultaData.idExamenClinico,
        esPrimeraConsulta: consultaData.esPrimeraConsulta,
        tieneRelato: !!consultaData.relato,
        tienePlan: !!consultaData.planDeTrabajo,
        tieneExamenDetallado: !!consultaData.examenFisicoDetallado,
        tieneExamenSimplificado: !!consultaData.examenFisicoSimplificado,
        diagnosticosCount: consultaData.diagnosticosSecundarios.length,
        examenDetalladoKeys: consultaData.examenFisicoDetallado ? Object.keys(consultaData.examenFisicoDetallado) : []
      });

      const response = await consultaService.registrarConsultaCompleta(consultaData);
      onComplete(response.idConsulta);

    } catch (err: unknown) {
      const apiError = err as ApiError;
      let errorMessage = 'Error al registrar la consulta';
      
      console.error('Error completo en registro de consulta:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message
      });

      if (apiError.response?.data) {
        if (apiError.response.data.error) {
          errorMessage = apiError.response.data.error;
        } else if (apiError.response.data.message) {
          errorMessage = apiError.response.data.message;
        } else if (typeof apiError.response.data === 'string') {
          errorMessage = apiError.response.data;
        }
        
        if (apiError.response.data.details) {
          errorMessage += `: ${JSON.stringify(apiError.response.data.details)}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConsultaChange = (field: keyof Omit<FormData, 'idExamenClinico' | 'examenFisico'>, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExamenFisicoChange = (field: keyof FormData['examenFisico'], value: string): void => {
    setFormData(prev => ({
      ...prev,
      examenFisico: {
        ...prev.examenFisico,
        [field]: value
      }
    }));
  };

  const handleExamenFisicoSimplificadoChange = (value: string): void => {
    setFormData(prev => ({
      ...prev,
      examenFisicoSimplificado: value
    }));
  };

  const tieneDatosExamenFisico = Object.values(formData.examenFisico).some(valor => valor.trim());
  const canSubmit = !loading && !checkingAntecedentes && !checkingVitalSigns &&
    hasVitalSignsToday && idFichaClinica && formData.idExamenClinico > 0 &&
    formData.relato.trim() && formData.planDeTrabajo.trim() &&
    (isFirstConsultation ? hasAntecedentes && tieneDatosExamenFisico : formData.examenFisicoSimplificado.trim());

  const examenFisicoFields: Array<{
    field: keyof FormData['examenFisico'];
    label: string;
    placeholder: string;
  }> = [
    { field: 'estadoGeneral', label: 'Estado General', placeholder: 'Estado general del paciente' },
    { field: 'habitus', label: 'Habitus', placeholder: 'Constitución corporal' },
    { field: 'hidratacion', label: 'Hidratación', placeholder: 'Estado de hidratación' },
    { field: 'conciencia', label: 'Conciencia', placeholder: 'Nivel de conciencia' },
    { field: 'orientacion', label: 'Orientación', placeholder: 'Orientación temporo-espacial' },
    { field: 'cabeza', label: 'Cabeza', placeholder: 'Examen de cabeza' },
    { field: 'ojos', label: 'Ojos', placeholder: 'Examen ocular' },
    { field: 'oidos', label: 'Oídos', placeholder: 'Examen auditivo' },
    { field: 'nariz', label: 'Nariz', placeholder: 'Examen nasal' },
    { field: 'boca', label: 'Boca', placeholder: 'Examen bucal' },
    { field: 'cuello', label: 'Cuello', placeholder: 'Examen cervical' },
    { field: 'torax', label: 'Tórax', placeholder: 'Examen torácico' },
    { field: 'abdomen', label: 'Abdomen', placeholder: 'Examen abdominal' },
    { field: 'ritmoCardiaco', label: 'Ritmo Cardíaco', placeholder: 'Regular/irregular' },
    { field: 'ruidosCardiacos', label: 'Ruidos Cardíacos', placeholder: 'Normofonéticos/etc' },
    { field: 'soplos', label: 'Soplos', placeholder: 'Presencia de soplos' },
    { field: 'frotes', label: 'Frotes', placeholder: 'Presencia de frotes' },
    { field: 'pulsosPerifericos', label: 'Pulsos Periféricos', placeholder: 'Presentes/disminuidos' },
    { field: 'formaAbdomen', label: 'Forma Abdomen', placeholder: 'Plano, globuloso, etc' },
    { field: 'peristalsis', label: 'Peristalsis', placeholder: 'Presente/ausente' },
    { field: 'visceromegalias', label: 'Visceromegalias', placeholder: 'Presencia de órganos aumentados' },
    { field: 'dolorPalpacion', label: 'Dolor a la Palpación', placeholder: 'Localización, intensidad' },
    { field: 'signosIrritacion', label: 'Signos de Irritación', placeholder: 'Signos peritoneales' },
    { field: 'extremidadesSuperiores', label: 'Extremidades Superiores', placeholder: 'Examen de miembros superiores' },
    { field: 'extremidadesInferiores', label: 'Extremidades Infe riores', placeholder: 'Examen de miembros inferiores' },
    { field: 'edema', label: 'Edema', placeholder: 'Presencia de edema' },
    { field: 'pulsosExtremidades', label: 'Pulsos Extremidades', placeholder: 'Presentes/disminuidos' },
    { field: 'temperaturaPiel', label: 'Temperatura de la Piel', placeholder: 'Normal, fría, caliente' },
    { field: 'motilidad', label: 'Motilidad', placeholder: 'Movilidad activa/pasiva' },
    { field: 'sensibilidad', label: 'Sensibilidad', placeholder: 'Conservada/alterada' },
    { field: 'reflejos', label: 'Reflejos', placeholder: 'Presentes/ausentes' },
    { field: 'fuerzaMuscular', label: 'Fuerza Muscular', placeholder: 'Escala 0-5' },
    { field: 'coordinacion', label: 'Coordinación', placeholder: 'Normal/alterada' }
  ];

  return (
    <div className="consulta-form">
      <div className="form-header">
        <h3 className="form-title">Consulta Médica y Evaluación Física</h3>
        <p className="form-subtitle">
          {isFirstConsultation ? 'Primera Consulta - Examen Físico Detallado' : 'Consulta de Control - Examen Físico Simplificado'}
        </p>
      </div>

      <div className="patient-info-card">
        <div className="patient-info-header">
          <h4>Información del Paciente</h4>
        </div>
        <div className="patient-info-content">
          <div className="info-grid">
            <div className="info-item">
              <strong>Paciente:</strong> {patientInfo?.NOMBRE_APELLIDO || 'Cargando...'}
            </div>
            <div className="info-item">
              <strong>DNI:</strong> {patientDni}
            </div>
            <div className="info-item">
              <strong>Ficha Clínica:</strong> {idFichaClinica || 'No disponible'}
            </div>
            <div className="info-item">
              <strong>Examen Clínico ID:</strong> {formData.idExamenClinico || 'No asignado'}
            </div>
            <div className="info-item">
              <strong>Signos Vitales Hoy:</strong>
              {checkingVitalSigns ? ' Verificando...' : hasVitalSignsToday ? ' Registrados' : ' Pendientes'}
            </div>
            <div className="info-item">
              <strong>Tipo de Consulta:</strong>
              {checkingAntecedentes ? ' Verificando...' : isFirstConsultation ? ' Primera Consulta' : ' Consulta de Control'}
            </div>
            {isFirstConsultation && (
              <div className="info-item">
                <strong>Antecedentes:</strong>
                {hasAntecedentes ? ' Completados' : ' Pendientes'}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {!hasVitalSignsToday && !checkingVitalSigns && (
        <div className="alert alert-warning">
          Los signos vitales no han sido registrados para hoy. La consulta no podrá ser registrada hasta que se completen los signos vitales.
        </div>
      )}

      {isFirstConsultation && !hasAntecedentes && !checkingAntecedentes && (
        <div className="alert alert-warning">
          Esta es una primera consulta. Los antecedentes médicos deben ser completados antes de proceder.
        </div>
      )}

      <form onSubmit={handleSubmit} className="consultation-form">
        <div className="form-section">
          <label className="form-label required">Relato de la Consulta</label>
          <textarea
            value={formData.relato}
            onChange={(e) => handleConsultaChange('relato', e.target.value)}
            required
            rows={6}
            className="form-textarea"
            placeholder="Describa en detalle la consulta actual, síntesis de hallazgos, impresión diagnóstica, evolución..."
            disabled={loading || !hasVitalSignsToday || (isFirstConsultation && !hasAntecedentes)}
            maxLength={2000}
          />
        </div>
        
        <div className="form-section">
          <h4 className="section-title">
            {isFirstConsultation ? 'Evaluación del Examen Físico Detallado' : 'Examen Físico Simplificado'}
          </h4>
          
          {isFirstConsultation ? (
            <div className="examen-fisico-detallado">
              <div className="form-grid form-grid-2">
                {examenFisicoFields.map(({ field, label, placeholder }) => (
                  <div key={field} className="form-group">
                    <label className="form-label">{label}</label>
                    <input
                      type="text"
                      value={formData.examenFisico[field]}
                      onChange={(e) => handleExamenFisicoChange(field, e.target.value)}
                      className="form-input"
                      placeholder={placeholder}
                      disabled={loading || !hasAntecedentes}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="form-section">
              <label className="form-label required">Examen Físico</label>
              <textarea
                value={formData.examenFisicoSimplificado}
                onChange={(e) => handleExamenFisicoSimplificadoChange(e.target.value)}
                required
                rows={4}
                className="form-textarea"
                placeholder="Describa los hallazgos del examen físico actual..."
                disabled={loading}
                maxLength={1000}
              />
            </div>
          )}
          
          <div className="form-section">
            <label className="form-label">Observaciones del Examen Físico</label>
            <textarea
              value={formData.examenFisico.observaciones}
              onChange={(e) => handleExamenFisicoChange('observaciones', e.target.value)}
              rows={3}
              className="form-textarea"
              placeholder="Hallazgos relevantes, signos patológicos, conclusiones..."
              disabled={loading || (isFirstConsultation && !hasAntecedentes)}
              maxLength={500}
            />
            <small className="form-help">
              {isFirstConsultation 
                ? 'Para primera consulta, complete al menos un campo del examen físico detallado y las observaciones'
                : 'Para consulta de control, complete el campo de examen físico simplificado'}
            </small>
          </div>
        </div>

        <div className="form-section">
          <label className="form-label required">Plan de Trabajo</label>
          <textarea
            value={formData.planDeTrabajo}
            onChange={(e) => handleConsultaChange('planDeTrabajo', e.target.value)}
            required
            rows={5}
            className="form-textarea"
            placeholder="Indique el plan de tratamiento, medicación, estudios complementarios, controles, recomendaciones, seguimiento..."
            disabled={loading || !hasVitalSignsToday || (isFirstConsultation && !hasAntecedentes)}
            maxLength={2000}
          />
        </div>

        <div className="form-actions">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn btn-outline"
              disabled={loading}
            >
              Volver
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary"
          >
            {loading ? 'Registrando...' : 'Registrar Consulta Completa'}
          </button>
        </div>

        <div className="form-footer">
          <small className="form-help">
            <strong>Estado del formulario:</strong> 
            {!hasVitalSignsToday && ' Signos vitales pendientes'}
            {isFirstConsultation && !hasAntecedentes && ' Antecedentes pendientes'}
            {!formData.relato.trim() && ' Relato de consulta requerido'}
            {!formData.planDeTrabajo.trim() && ' Plan de trabajo requerido'}
            {isFirstConsultation && !tieneDatosExamenFisico && ' Examen físico requerido'}
            {!isFirstConsultation && 
              !formData.examenFisicoSimplificado.trim() && ' Examen físico simplificado requerido'}
            {canSubmit && ' Formulario completo y listo para enviar'}
          </small>
        </div>
      </form>
    </div>
  );
};

export default ConsultationForm;