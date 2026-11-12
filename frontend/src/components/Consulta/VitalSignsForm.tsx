import React, { useState, useEffect } from 'react';
import { consultaService, pacienteService } from '../../services/apiService';
import type { SignosVitales, Paciente, PacienteResponse } from '../../types/models';

interface VitalSignsFormProps {
  patientDni: string;
  onComplete: (idExamenClinico: number, idFichaClinica: number) => void;
  onBack?: () => void;
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

interface FormData {
  pa: string;
  pulso: number;
  tipoPulso: string;
  sao2: number | null;
  fr: number | null;
  peso: number;
  talla: number;
  temperatura: number | null;
}

const VitalSignsForm: React.FC<VitalSignsFormProps> = ({ 
  patientDni, 
  onComplete, 
  onBack 
}) => {
  const [formData, setFormData] = useState<FormData>({
    pa: '',
    pulso: 0,
    tipoPulso: '',
    sao2: null,
    fr: null,
    peso: 0,
    talla: 0,
    temperatura: null
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [patientInfo, setPatientInfo] = useState<Paciente | null>(null);
  const [idFichaClinica, setIdFichaClinica] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const obtenerInfoPaciente = async (): Promise<void> => {
      try {
        setError('');
        const response: PacienteResponse = await pacienteService.buscarPacientePorDNI(patientDni);
        
        let pacienteData: Paciente | undefined;
        
        if (Array.isArray(response.data)) {
          pacienteData = response.data[0];
        } else {
          pacienteData = response.data;
        }

        if (pacienteData && pacienteData.ID_FICHA_CLINICA) {
          setPatientInfo(pacienteData);
          setIdFichaClinica(pacienteData.ID_FICHA_CLINICA);
        } else {
          setError('No se pudo obtener la información de la ficha clínica del paciente');
        }
      } catch (error: unknown) {
        const apiError = error as ApiError;
        const errorMessage = apiError.response?.data?.error || apiError.message || 'Error al obtener datos del paciente';
        setError(errorMessage);
      }
    };

    if (patientDni) {
      obtenerInfoPaciente();
    }
  }, [patientDni]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!idFichaClinica) {
      setError('No se pudo obtener la información del paciente. Verifique que el paciente esté registrado en el sistema.');
      return;
    }

    if (!formData.pa.trim()) {
      setError('La presión arterial es requerida');
      return;
    }
    if (formData.pulso < 30 || formData.pulso > 200) {
      setError('El pulso debe estar entre 30-200 lpm');
      return;
    }
    if (formData.peso < 1 || formData.peso > 300) {
      setError('El peso debe estar entre 1-300 kg');
      return;
    }
    if (formData.talla < 0.5 || formData.talla > 2.5) {
      setError('La talla debe estar entre 0.5-2.5 m');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signosData: SignosVitales = {
        idFichaClinica: idFichaClinica,
        pa: formData.pa,
        pulso: formData.pulso,
        tipoPulso: formData.tipoPulso,
        sao2: formData.sao2 || undefined,
        fr: formData.fr || undefined,
        peso: formData.peso,
        talla: formData.talla,
        temperatura: formData.temperatura || undefined
      };

      const response = await consultaService.registrarSignosVitales(signosData);
      onComplete(response.idExamenClinico, idFichaClinica);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      let errorMessage = 'Error al registrar los signos vitales';
      
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    
    if (name === 'pulso' || name === 'peso' || name === 'talla' || name === 'sao2' || name === 'fr' || name === 'temperatura') {
      const numericValue = value === '' ? null : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calcularIMC = (): string => {
    if (formData.peso > 0 && formData.talla > 0) {
      const imc = formData.peso / (formData.talla * formData.talla);
      return imc.toFixed(1);
    }
    return '0.0';
  };

  const getClasificacionIMC = (imc: number): string => {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidad Grado I';
    if (imc < 40) return 'Obesidad Grado II';
    return 'Obesidad Grado III';
  };

  const imc = parseFloat(calcularIMC());

  return (
    <div className="vital-signs-form">
      <div className="form-header">
        <h3 className="form-title">Registro de Signos Vitales</h3>
        <p className="form-subtitle">
          Complete los signos vitales del paciente
        </p>
      </div>

      {/* Información del Paciente */}
      <div className="patient-info-card">
        <div className="patient-info-header">
          <h4>Paciente</h4>
        </div>
        <div className="patient-info-content">
          <div className="info-grid">
            <div className="info-item">
              <strong>Nombre:</strong> {patientInfo?.NOMBRE_APELLIDO || 'Cargando...'}
            </div>
            <div className="info-item">
              <strong>DNI:</strong> {patientDni}
            </div>
            <div className="info-item">
              <strong>Ficha Clínica:</strong> {idFichaClinica || 'No disponible'}
            </div>
            {patientInfo?.EDAD && (
              <div className="info-item">
                <strong>Edad:</strong> {patientInfo.EDAD} años
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

      {!idFichaClinica && !error && (
        <div className="alert alert-info">
          <div className="loading-spinner"></div>
          Cargando información del paciente...
        </div>
      )}

      <form onSubmit={handleSubmit} className="vitals-form">
        <div className="form-grid form-grid-3">
          <div className="form-group">
            <label className="form-label required">Presión Arterial (mm Hg)</label>
            <input
              type="text"
              name="pa"
              value={formData.pa}
              onChange={handleChange}
              required
              disabled={!idFichaClinica || loading}
              className="form-input"
              placeholder="Ej: 120/80"
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Pulso (lpm)</label>
            <input
              type="number"
              name="pulso"
              value={formData.pulso || ''}
              onChange={handleChange}
              required
              min="30"
              max="200"
              disabled={!idFichaClinica || loading}
              className="form-input"
              placeholder="60-100"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Pulso</label>
            <select
              name="tipoPulso"
              value={formData.tipoPulso}
              onChange={handleChange}
              disabled={!idFichaClinica || loading}
              className="form-select"
            >
              <option value="">Seleccionar...</option>
              <option value="REGULAR">Regular</option>
              <option value="IRREGULAR">Irregular</option>
              <option value="RITMICO">Rítmico</option>
              <option value="ARRITMICO">Arritmico</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Saturación O2 (SaO2) %</label>
            <input
              type="number"
              name="sao2"
              value={formData.sao2 || ''}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              disabled={!idFichaClinica || loading}
              className="form-input"
              placeholder="95-100%"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Frecuencia Respiratoria (RPM)</label>
            <input
              type="number"
              name="fr"
              value={formData.fr || ''}
              onChange={handleChange}
              min="0"
              disabled={!idFichaClinica || loading}
              className="form-input"
              placeholder="12-20 rpm"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Temperatura (°C)</label>
            <input
              type="number"
              name="temperatura"
              value={formData.temperatura || ''}
              onChange={handleChange}
              step="0.1"
              min="35"
              max="42"
              disabled={!idFichaClinica || loading}
              className="form-input"
              placeholder="36.5-37.5"
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Peso (kg)</label>
            <input
              type="number"
              name="peso"
              value={formData.peso || ''}
              onChange={handleChange}
              required
              step="0.1"
              min="1"
              max="300"
              disabled={!idFichaClinica || loading}
              className="form-input"
              placeholder="Ej: 70.5"
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Talla (m)</label>
            <input
              type="number"
              name="talla"
              value={formData.talla || ''}
              onChange={handleChange}
              required
              step="0.01"
              min="0.5"
              max="2.5"
              disabled={!idFichaClinica || loading}
              className="form-input"
              placeholder="Ej: 1.75"
            />
          </div>

          <div className="form-group">
            <label className="form-label">IMC Calculado</label>
            <div className="imc-display">
              <div className="imc-value">{calcularIMC()}</div>
              {imc > 0 && (
                <div className={`imc-clasification ${
                  imc < 18.5 ? 'underweight' :
                  imc < 25 ? 'normal' :
                  imc < 30 ? 'overweight' : 'obese'
                }`}>
                  {getClasificacionIMC(imc)}
                </div>
              )}
            </div>
          </div>
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
            disabled={loading || !idFichaClinica}
            className="btn btn-primary"
          >
            {loading ? 'Registrando' : 'Registrar Signos Vitales'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VitalSignsForm;