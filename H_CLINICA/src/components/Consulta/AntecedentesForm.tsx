import React, { useState } from 'react';
import { antecedentesService } from '../../services/apiService';
import type { AntecedentesData } from '../../types/models';
import '../../styles/consulta.css';

interface AntecedentesFormProps {
  patientDni: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface ApiError {
  response?: {
    status: number;
    data?: {
      error?: string;
      message?: string;
      details?: string;
    };
  };
  message?: string;
}

const AntecedentesForm: React.FC<AntecedentesFormProps> = ({
  patientDni,
  onComplete,
  onCancel
}) => {
  const [formData, setFormData] = useState<AntecedentesData>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const antecedentesData: AntecedentesData = {
        enfermedadActual: formData.enfermedadActual,
        sintomas: formData.sintomas,
        factoresRiesgo: formData.factoresRiesgo,
        cardiovascular: formData.cardiovascular,
        patologicos: formData.patologicos
      };

      await antecedentesService.crearAntecedentesCompletos(patientDni, antecedentesData);
      onComplete();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      let errorMessage = 'Error al registrar los antecedentes médicos';
      
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError.response?.data?.details) {
        errorMessage = `${apiError.response.data.error || 'Error'} - ${apiError.response.data.details}`;
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (section: keyof AntecedentesData, field: string, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleBooleanChange = (section: keyof AntecedentesData, field: string, value: boolean): void => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="antecedentes-form">
      <div className="form-header">
        <h3 className="form-title">Antecedentes Médicos</h3>
        <p className="form-subtitle">
          Complete los antecedentes médicos del paciente (Primera Consulta)
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="antecedentes-container">
        <div className="form-content-full">
          <form onSubmit={handleSubmit}>
            {/* Enfermedad Actual */}
            <div className="form-section">
              <h4 className="section-title">Enfermedad Actual</h4>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Tiempo de Enfermedad</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: 3 días, 2 semanas..."
                    onChange={(e) => handleTextChange('enfermedadActual', 'tiempoEnfermedad', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Inicio</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cómo comenzó..."
                    onChange={(e) => handleTextChange('enfermedadActual', 'inicio', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Curso</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Evolución..."
                    onChange={(e) => handleTextChange('enfermedadActual', 'curso', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Relato</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describa los síntomas y evolución..."
                  onChange={(e) => handleTextChange('enfermedadActual', 'relato', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Síntomas */}
            <div className="form-section">
              <h4 className="section-title">Síntomas</h4>
              <div className="form-grid form-grid-3">
                {[
                  { id: 'angina', label: 'Angina' },
                  { id: 'disnea', label: 'Disnea' },
                  { id: 'palpitaciones', label: 'Palpitaciones' },
                  { id: 'sincope', label: 'Síncope' },
                  { id: 'cianosis', label: 'Cianosis' },
                  { id: 'edemas', label: 'Edemas' },
                  { id: 'ortopnea', label: 'Ortopnea' },
                  { id: 'fiebre', label: 'Fiebre' },
                  { id: 'claudicacionIntermitente', label: 'Claudicación Intermitente' }
                ].map(sintoma => (
                  <div key={sintoma.id} className="checkbox-group">
                    <input
                      type="checkbox"
                      id={sintoma.id}
                      onChange={(e) => handleBooleanChange('sintomas', sintoma.id, e.target.checked)}
                      disabled={loading}
                      className="checkbox-input"
                    />
                    <label htmlFor={sintoma.id} className="checkbox-label">
                      {sintoma.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Otros Síntomas</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Describa otros síntomas no listados..."
                  onChange={(e) => handleTextChange('sintomas', 'otros', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Factores de Riesgo */}
            <div className="form-section">
              <h4 className="section-title">Factores de Riesgo</h4>
              <div className="form-grid form-grid-3">
                {[
                  { id: 'tabaquismo', label: 'Tabaquismo' },
                  { id: 'hipertension', label: 'Hipertensión' },
                  { id: 'diabetes', label: 'Diabetes' },
                  { id: 'dislipidemia', label: 'Dislipidemia' },
                  { id: 'edadFactor', label: 'Edad (Factor)' },
                  { id: 'obesidad', label: 'Obesidad' },
                  { id: 'historiaFamiliar', label: 'Historia Familiar' },
                  { id: 'sedentarismo', label: 'Sedentarismo' },
                  { id: 'estres', label: 'Estrés' },
                  { id: 'dietaAterogenica', label: 'Dieta Aterogénica' },
                  { id: 'hiperurisemia', label: 'Hiperurisemia' },
                  { id: 'personalidadTipoA', label: 'Personalidad Tipo A' }
                ].map(factor => (
                  <div key={factor.id} className="checkbox-group">
                    <input
                      type="checkbox"
                      id={factor.id}
                      onChange={(e) => handleBooleanChange('factoresRiesgo', factor.id, e.target.checked)}
                      disabled={loading}
                      className="checkbox-input"
                    />
                    <label htmlFor={factor.id} className="checkbox-label">
                      {factor.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Cantidad de Tabaco</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: 10 cigarrillos/día"
                    onChange={(e) => handleTextChange('factoresRiesgo', 'cantidadTabaco', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tiempo de Tabaco</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: 5 años"
                    onChange={(e) => handleTextChange('factoresRiesgo', 'tiempoTabaco', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Cardiovascular */}
            <div className="form-section">
              <h4 className="section-title">Cardiovascular</h4>
              <div className="form-grid form-grid-2">
                {[
                  { id: 'infartoMiocardio', label: 'Infarto de Miocardio' },
                  { id: 'valvulopatia', label: 'Valvulopatía' },
                  { id: 'cardiopatiaCongenita', label: 'Cardiopatía Congénita' },
                  { id: 'fiebreReumaticaSecuelas', label: 'Fiebre Reumática Secuelas' },
                  { id: 'arritmias', label: 'Arritmias' },
                  { id: 'enfermedadArterialPeriferica', label: 'Enfermedad Arterial Periférica' }
                ].map(antecedente => (
                  <div key={antecedente.id} className="checkbox-group">
                    <input
                      type="checkbox"
                      id={antecedente.id}
                      onChange={(e) => handleBooleanChange('cardiovascular', antecedente.id, e.target.checked)}
                      disabled={loading}
                      className="checkbox-input"
                    />
                    <label htmlFor={antecedente.id} className="checkbox-label">
                      {antecedente.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Última Hospitalización</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Fecha y motivo"
                    onChange={(e) => handleTextChange('cardiovascular', 'ultimaHospitalizacion', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">DX Hospitalización</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Diagnóstico"
                    onChange={(e) => handleTextChange('cardiovascular', 'dxHospitalizacion', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Intervención Quirúrgica/PCI</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Fecha"
                    onChange={(e) => handleTextChange('cardiovascular', 'intervencionQxPciFecha', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cateterismo Fecha</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Fecha"
                    onChange={(e) => handleTextChange('cardiovascular', 'cateterismoFecha', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Medicación Habitual</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Medicamentos que toma regularmente"
                  onChange={(e) => handleTextChange('cardiovascular', 'medicacionHabitual', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Patológicos */}
            <div className="form-section">
              <h4 className="section-title">Patológicos</h4>
              <div className="form-grid form-grid-2">
                {[
                  { id: 'respiratorio', label: 'Respiratorio', placeholder: 'Asma, EPOC, etc.' },
                  { id: 'gastrointestinal', label: 'Gastrointestinal', placeholder: 'Gastritis, úlcera, etc.' },
                  { id: 'genitourinario', label: 'Genitourinario', placeholder: 'Enfermedades renales, etc.' },
                  { id: 'neurologico', label: 'Neurológico', placeholder: 'Enfermedades neurológicas' },
                  { id: 'locomotor', label: 'Locomotor', placeholder: 'Enfermedades óseas, articulares' },
                  { id: 'hematologico', label: 'Hematológico', placeholder: 'Anemias, trastornos de coagulación' },
                  { id: 'alergias', label: 'Alergias', placeholder: 'Medicamentos, alimentos, etc.' },
                  { id: 'cirugiasPrevias', label: 'Cirugías Previas', placeholder: 'Cirugías anteriores' }
                ].map(campo => (
                  <div key={campo.id} className="form-group">
                    <label className="form-label">{campo.label}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={campo.placeholder}
                      onChange={(e) => handleTextChange('patologicos', campo.id, e.target.value)}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Antecedentes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AntecedentesForm;