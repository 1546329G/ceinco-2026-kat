import React, { useState, useEffect, useCallback } from 'react';
import { examenFisicoService } from '../../services/apiService';
import type { ExamenFisicoResponse, ExamenFisicoData, FormData , ApiError } from '../../types/models';
import '../../styles/consulta.css';

interface ExamenFisicoPanelProps {
  consultationId: number;
  examenFisicoData: ExamenFisicoResponse | null;
  onUpdate: () => void;
}

const ExamenFisicoPanel: React.FC<ExamenFisicoPanelProps> = ({
  consultationId,
  examenFisicoData,
  onUpdate
}) => {
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(!examenFisicoData);
  const [isFirstConsultation, setIsFirstConsultation] = useState<boolean>(false);

  const loadExistingData = useCallback((): void => {
    if (examenFisicoData?.data) {
      const data = examenFisicoData.data;
      
      const newFormData: FormData = {};
      
      if (data.examenDetallado) {
        const detallado = data.examenDetallado;
        
        if (detallado.examenGeneral) {
          newFormData.estadoGeneral = detallado.examenGeneral.estadoGeneral;
          newFormData.habitus = detallado.examenGeneral.habitus;
          newFormData.hidratacion = detallado.examenGeneral.hidratacion;
          newFormData.conciencia = detallado.examenGeneral.conciencia;
          newFormData.orientacion = detallado.examenGeneral.orientacion;
        }
        
        if (detallado.examenRegional) {
          newFormData.cabeza = detallado.examenRegional.cabeza;
          newFormData.ojos = detallado.examenRegional.ojos;
          newFormData.oidos = detallado.examenRegional.oidos;
          newFormData.nariz = detallado.examenRegional.nariz;
          newFormData.boca = detallado.examenRegional.boca;
          newFormData.cuello = detallado.examenRegional.cuello;
          newFormData.torax = detallado.examenRegional.torax;
          newFormData.abdomen = detallado.examenRegional.abdomen;
        }
        
        if (detallado.examenCardiovascular) {
          newFormData.ritmoCardiaco = detallado.examenCardiovascular.ritmoCardiaco;
          newFormData.ruidosCardiacos = detallado.examenCardiovascular.ruidosCardiacos;
          newFormData.soplos = detallado.examenCardiovascular.soplos;
          newFormData.frotes = detallado.examenCardiovascular.frotes;
          newFormData.pulsosPerifericos = detallado.examenCardiovascular.pulsosPerifericos;
        }
        
        if (detallado.examenAbdominal) {
          newFormData.formaAbdomen = detallado.examenAbdominal.formaAbdomen;
          newFormData.peristalsis = detallado.examenAbdominal.peristalsis;
          newFormData.visceromegalias = detallado.examenAbdominal.visceromegalias;
          newFormData.dolorPalpacion = detallado.examenAbdominal.dolorPalpacion;
          newFormData.signosIrritacion = detallado.examenAbdominal.signosIrritacion;
        }
        
        if (detallado.examenExtremidades) {
          newFormData.extremidadesSuperiores = detallado.examenExtremidades.extremidadesSuperiores;
          newFormData.extremidadesInferiores = detallado.examenExtremidades.extremidadesInferiores;
          newFormData.edema = detallado.examenExtremidades.edema;
          newFormData.pulsosExtremidades = detallado.examenExtremidades.pulsosExtremidades;
          newFormData.temperaturaPiel = detallado.examenExtremidades.temperaturaPiel;
        }
        
        if (detallado.examenNeurologico) {
          newFormData.motilidad = detallado.examenNeurologico.motilidad;
          newFormData.sensibilidad = detallado.examenNeurologico.sensibilidad;
          newFormData.reflejos = detallado.examenNeurologico.reflejos;
          newFormData.fuerzaMuscular = detallado.examenNeurologico.fuerzaMuscular;
          newFormData.coordinacion = detallado.examenNeurologico.coordinacion;
        }
      }
      
      if (data.observaciones) {
        newFormData.observaciones = data.observaciones;
      }
      
      setIsFirstConsultation(data.tipoConsulta === 'primera');
      
      setFormData(newFormData);
    }
  }, [examenFisicoData]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const examenData: ExamenFisicoData = {
        idConsulta: consultationId,
        ...(formData.estadoGeneral && { estadoGeneral: formData.estadoGeneral }),
        ...(formData.habitus && { habitus: formData.habitus }),
        ...(formData.hidratacion && { hidratacion: formData.hidratacion }),
        ...(formData.conciencia && { conciencia: formData.conciencia }),
        ...(formData.orientacion && { orientacion: formData.orientacion }),
        ...(formData.cabeza && { cabeza: formData.cabeza }),
        ...(formData.ojos && { ojos: formData.ojos }),
        ...(formData.oidos && { oidos: formData.oidos }),
        ...(formData.nariz && { nariz: formData.nariz }),
        ...(formData.boca && { boca: formData.boca }),
        ...(formData.cuello && { cuello: formData.cuello }),
        ...(formData.torax && { torax: formData.torax }),
        ...(formData.abdomen && { abdomen: formData.abdomen }),
        ...(formData.ritmoCardiaco && { ritmoCardiaco: formData.ritmoCardiaco }),
        ...(formData.ruidosCardiacos && { ruidosCardiacos: formData.ruidosCardiacos }),
        ...(formData.soplos && { soplos: formData.soplos }),
        ...(formData.frotes && { frotes: formData.frotes }),
        ...(formData.pulsosPerifericos && { pulsosPerifericos: formData.pulsosPerifericos }),
        ...(formData.formaAbdomen && { formaAbdomen: formData.formaAbdomen }),
        ...(formData.peristalsis && { peristalsis: formData.peristalsis }),
        ...(formData.visceromegalias && { visceromegalias: formData.visceromegalias }),
        ...(formData.dolorPalpacion && { dolorPalpacion: formData.dolorPalpacion }),
        ...(formData.signosIrritacion && { signosIrritacion: formData.signosIrritacion }),
        ...(formData.extremidadesSuperiores && { extremidadesSuperiores: formData.extremidadesSuperiores }),
        ...(formData.extremidadesInferiores && { extremidadesInferiores: formData.extremidadesInferiores }),
        ...(formData.edema && { edema: formData.edema }),
        ...(formData.pulsosExtremidades && { pulsosExtremidades: formData.pulsosExtremidades }),
        ...(formData.temperaturaPiel && { temperaturaPiel: formData.temperaturaPiel }),
        ...(formData.motilidad && { motilidad: formData.motilidad }),
        ...(formData.sensibilidad && { sensibilidad: formData.sensibilidad }),
        ...(formData.reflejos && { reflejos: formData.reflejos }),
        ...(formData.fuerzaMuscular && { fuerzaMuscular: formData.fuerzaMuscular }),
        ...(formData.coordinacion && { coordinacion: formData.coordinacion }),
        ...(formData.observaciones && { observaciones: formData.observaciones })
      };

      console.log('Enviando examen físico:', examenData);

      const response = await examenFisicoService.registrarExamenFisico(examenData);
      console.log('Examen físico registrado:', response);
      
      setEditMode(false);
      onUpdate();
      
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.error || 
                         apiError.response?.data?.message || 
                         apiError.message || 
                         'Error al guardar examen físico';
      setError(errorMessage);
      console.error('Error al registrar examen físico:', apiError);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    if (examenFisicoData && !editMode) {
      loadExistingData();
    }
  }, [examenFisicoData, editMode, loadExistingData]);

  if (!editMode && examenFisicoData) {
    return (
      <div className="examen-fisico-panel">
        <div className="card-header">
          <h3 className="card-title">
            {isFirstConsultation ? 'Examen Físico Detallado' : 'Examen Físico'}
          </h3>
          <button
            onClick={() => setEditMode(true)}
            className="btn btn-primary"
          >
            Editar Examen
          </button>
        </div>

        <div className="examen-fisico-view">
          {examenFisicoData.data.examenDetallado?.examenGeneral && (
            <div className="examen-section">
              <h4 className="section-title">Examen Físico General</h4>
              <div className="examen-grid">
                {examenFisicoData.data.examenDetallado.examenGeneral.estadoGeneral && (
                  <div className="examen-item">
                    <strong>Estado General:</strong> {examenFisicoData.data.examenDetallado.examenGeneral.estadoGeneral}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenGeneral.habitus && (
                  <div className="examen-item">
                    <strong>Habitus:</strong> {examenFisicoData.data.examenDetallado.examenGeneral.habitus}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenGeneral.hidratacion && (
                  <div className="examen-item">
                    <strong>Hidratación:</strong> {examenFisicoData.data.examenDetallado.examenGeneral.hidratacion}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenGeneral.conciencia && (
                  <div className="examen-item">
                    <strong>Conciencia:</strong> {examenFisicoData.data.examenDetallado.examenGeneral.conciencia}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenGeneral.orientacion && (
                  <div className="examen-item">
                    <strong>Orientación:</strong> {examenFisicoData.data.examenDetallado.examenGeneral.orientacion}
                  </div>
                )}
              </div>
            </div>
          )}

          {examenFisicoData.data.examenDetallado?.examenRegional && (
            <div className="examen-section">
              <h4 className="section-title">Examen Regional</h4>
              <div className="examen-grid">
                {examenFisicoData.data.examenDetallado.examenRegional.cabeza && (
                  <div className="examen-item">
                    <strong>Cabeza:</strong> {examenFisicoData.data.examenDetallado.examenRegional.cabeza}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenRegional.ojos && (
                  <div className="examen-item">
                    <strong>Ojos:</strong> {examenFisicoData.data.examenDetallado.examenRegional.ojos}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenRegional.oidos && (
                  <div className="examen-item">
                    <strong>Oídos:</strong> {examenFisicoData.data.examenDetallado.examenRegional.oidos}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenRegional.nariz && (
                  <div className="examen-item">
                    <strong>Nariz:</strong> {examenFisicoData.data.examenDetallado.examenRegional.nariz}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenRegional.boca && (
                  <div className="examen-item">
                    <strong>Boca:</strong> {examenFisicoData.data.examenDetallado.examenRegional.boca}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenRegional.cuello && (
                  <div className="examen-item">
                    <strong>Cuello:</strong> {examenFisicoData.data.examenDetallado.examenRegional.cuello}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenRegional.torax && (
                  <div className="examen-item">
                    <strong>Tórax:</strong> {examenFisicoData.data.examenDetallado.examenRegional.torax}
                  </div>
                )}
                {examenFisicoData.data.examenDetallado.examenRegional.abdomen && (
                  <div className="examen-item">
                    <strong>Abdomen:</strong> {examenFisicoData.data.examenDetallado.examenRegional.abdomen}
                  </div>
                )}
              </div>
            </div>
          )}

          {examenFisicoData.data.observaciones && (
            <div className="examen-section">
              <h4 className="section-title">Observaciones</h4>
              <div className="examen-observaciones">
                {examenFisicoData.data.observaciones}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="examen-fisico-panel">
      <div className="card-header">
        <h3 className="card-title">
          {isFirstConsultation ? 'Examen Físico Detallado' : 'Examen Físico'}
        </h3>
        {examenFisicoData && (
          <button
            onClick={() => setEditMode(false)}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="examen-fisico-form">
        <div className="examen-section">
          <h4 className="section-title">Examen Físico General</h4>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Estado General</label>
              <input
                type="text"
                value={formData.estadoGeneral || ''}
                onChange={(e) => handleChange('estadoGeneral', e.target.value)}
                className="form-input"
                placeholder="Estado general del paciente"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Habitus</label>
              <input
                type="text"
                value={formData.habitus || ''}
                onChange={(e) => handleChange('habitus', e.target.value)}
                className="form-input"
                placeholder="Constitución corporal"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hidratación</label>
              <input
                type="text"
                value={formData.hidratacion || ''}
                onChange={(e) => handleChange('hidratacion', e.target.value)}
                className="form-input"
                placeholder="Estado de hidratación"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Conciencia</label>
              <input
                type="text"
                value={formData.conciencia || ''}
                onChange={(e) => handleChange('conciencia', e.target.value)}
                className="form-input"
                placeholder="Nivel de conciencia"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Orientación</label>
              <input
                type="text"
                value={formData.orientacion || ''}
                onChange={(e) => handleChange('orientacion', e.target.value)}
                className="form-input"
                placeholder="Orientación temporo-espacial"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="examen-section">
          <h4 className="section-title">Examen Regional</h4>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Cabeza</label>
              <input
                type="text"
                value={formData.cabeza || ''}
                onChange={(e) => handleChange('cabeza', e.target.value)}
                className="form-input"
                placeholder="Examen de cabeza"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ojos</label>
              <input
                type="text"
                value={formData.ojos || ''}
                onChange={(e) => handleChange('ojos', e.target.value)}
                className="form-input"
                placeholder="Examen ocular"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Oídos</label>
              <input
                type="text"
                value={formData.oidos || ''}
                onChange={(e) => handleChange('oidos', e.target.value)}
                className="form-input"
                placeholder="Examen auditivo"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nariz</label>
              <input
                type="text"
                value={formData.nariz || ''}
                onChange={(e) => handleChange('nariz', e.target.value)}
                className="form-input"
                placeholder="Examen nasal"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Boca</label>
              <input
                type="text"
                value={formData.boca || ''}
                onChange={(e) => handleChange('boca', e.target.value)}
                className="form-input"
                placeholder="Examen bucal"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cuello</label>
              <input
                type="text"
                value={formData.cuello || ''}
                onChange={(e) => handleChange('cuello', e.target.value)}
                className="form-input"
                placeholder="Examen cervical"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tórax</label>
              <input
                type="text"
                value={formData.torax || ''}
                onChange={(e) => handleChange('torax', e.target.value)}
                className="form-input"
                placeholder="Examen torácico"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Abdomen</label>
              <input
                type="text"
                value={formData.abdomen || ''}
                onChange={(e) => handleChange('abdomen', e.target.value)}
                className="form-input"
                placeholder="Examen abdominal"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="examen-section">
          <h4 className="section-title">Examen Cardiovascular</h4>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Ritmo Cardíaco</label>
              <input
                type="text"
                value={formData.ritmoCardiaco || ''}
                onChange={(e) => handleChange('ritmoCardiaco', e.target.value)}
                className="form-input"
                placeholder="Regular/irregular"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ruidos Cardíacos</label>
              <input
                type="text"
                value={formData.ruidosCardiacos || ''}
                onChange={(e) => handleChange('ruidosCardiacos', e.target.value)}
                className="form-input"
                placeholder="Normofonéticos/etc"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Soplos</label>
              <input
                type="text"
                value={formData.soplos || ''}
                onChange={(e) => handleChange('soplos', e.target.value)}
                className="form-input"
                placeholder="Presencia de soplos"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Frotes</label>
              <input
                type="text"
                value={formData.frotes || ''}
                onChange={(e) => handleChange('frotes', e.target.value)}
                className="form-input"
                placeholder="Presencia de frotes"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pulsos Periféricos</label>
              <input
                type="text"
                value={formData.pulsosPerifericos || ''}
                onChange={(e) => handleChange('pulsosPerifericos', e.target.value)}
                className="form-input"
                placeholder="Presentes/disminuidos"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="examen-section">
          <h4 className="section-title">Observaciones</h4>
          <div className="form-group">
            <textarea
              value={formData.observaciones || ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              className="form-textarea"
              rows={4}
              placeholder="Observaciones adicionales del examen físico"
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando' : 'Guardar Examen Físico'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamenFisicoPanel;