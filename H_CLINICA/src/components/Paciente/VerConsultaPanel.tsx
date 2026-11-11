import React, { useState, useEffect, useCallback } from 'react';
import { consultaService, diagnosticoService, examenFisicoService } from '../../services/apiService';
import type { 
  ConsultaCompletaData, 
  DiagnosticosConsultaResponse, 
  ExamenFisicoResponse,
  DiagnosticoConsulta 
} from '../../types/models';
import '../../styles/consulta.css';

interface VerConsultaPanelProps {
  consultaId: number;
  onClose: () => void;
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

interface EditData {
  relato: string;
  planDeTrabajo: string;
}

const VerConsultaPanel: React.FC<VerConsultaPanelProps> = ({ consultaId, onClose }) => {
  const [consulta, setConsulta] = useState<ConsultaCompletaData | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticosConsultaResponse | null>(null);
  const [examenFisico, setExamenFisico] = useState<ExamenFisicoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editData, setEditData] = useState<EditData>({ relato: '', planDeTrabajo: '' });
  const [saving, setSaving] = useState<boolean>(false);

  const cargarConsultaCompleta = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      
      const [consultaResponse, diagnosticosResponse] = await Promise.all([
        consultaService.obtenerConsultaCompleta(consultaId),
        diagnosticoService.obtenerDiagnosticosConsulta(consultaId)
      ]);

      setConsulta(consultaResponse.data);
      setDiagnosticos(diagnosticosResponse);
      setEditData({
        relato: consultaResponse.data.RELATO || '',
        planDeTrabajo: consultaResponse.data.PLAN_DE_TRABAJO || ''
      });
      try {
        const examenResponse = await examenFisicoService.obtenerExamenFisico(consultaId);
        setExamenFisico(examenResponse);
      } catch (examenError: unknown) {
        const apiError = examenError as ApiError;
        if (apiError.response?.status !== 404) {
          console.warn('Error cargando examen físico:', apiError);
        }
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.error || apiError.message || 'Error al cargar la consulta';
      setError(errorMessage);
      console.error('Error cargando consulta:', apiError);
    } finally {
      setLoading(false);
    }
  }, [consultaId]); 

  useEffect(() => {
    cargarConsultaCompleta();
  }, [cargarConsultaCompleta]); 

  const handleSave = async (): Promise<void> => {
    if (!editData.relato.trim() || !editData.planDeTrabajo.trim()) {
      setError('El relato y plan de trabajo son requeridos');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await consultaService.editarConsulta(consultaId, editData);
      setEditMode(false);
      await cargarConsultaCompleta();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.error || apiError.message || 'Error al guardar los cambios';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (): void => {
    setEditMode(false);
    if (consulta) {
      setEditData({
        relato: consulta.RELATO || '',
        planDeTrabajo: consulta.PLAN_DE_TRABAJO || ''
      });
    }
    setError('');
  };

  const getDiagnosticoPrincipal = (): DiagnosticoConsulta | null => {
    return diagnosticos?.diagnosticos.find(d => d.esPrincipal) || null;
  };

  const getDiagnosticosSecundarios = (): DiagnosticoConsulta[] => {
    return diagnosticos?.diagnosticos.filter(d => !d.esPrincipal) || [];
  };

  if (loading) {
    return (
      <div className="consulta-detalle-panel">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="consulta-detalle-panel">
        <div className="error-state">
          <p>No se pudo cargar la consulta</p>
          {error && <p className="error-message">{error}</p>}
          <button className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="consulta-detalle-panel">
      <div className="panel-header">
        <h3>Consulta del {new Date(consulta.FECHA).toLocaleDateString()}</h3>
        <div className="header-actions">
          <button 
            className="btn btn-outline" 
            onClick={onClose}
            disabled={saving}
          >
            Cerrar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => editMode ? handleSave() : setEditMode(true)}
            disabled={saving}
          >
            {saving ? 'Guardando...' : editMode ? 'Guardar' : 'Editar'}
          </button>
          {editMode && (
            <button 
              className="btn btn-secondary" 
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="consulta-content">
        <div className="info-section">
          <h4 className="section-title">Información General</h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>Paciente:</strong> {consulta.NOMBRE_APELLIDO}
            </div>
            <div className="info-item">
              <strong>DNI:</strong> {consulta.DNI}
            </div>
            <div className="info-item">
              <strong>Fecha:</strong> {new Date(consulta.FECHA).toLocaleString()}
            </div>
            <div className="info-item">
              <strong>Doctor:</strong> {consulta.DOCTOR_NOMBRE} {consulta.DOCTOR_APELLIDO}
            </div>
          </div>
        </div>
        {(consulta.PA || consulta.PULSO || consulta.PESO || consulta.TALLA) && (
          <div className="info-section">
            <h4 className="section-title">Signos Vitales</h4>
            <div className="info-grid">
              {consulta.PA && (
                <div className="info-item">
                  <strong>PA:</strong> {consulta.PA}
                </div>
              )}
              {consulta.PULSO && (
                <div className="info-item">
                  <strong>Pulso:</strong> {consulta.PULSO} lpm
                </div>
              )}
              {consulta.PESO && (
                <div className="info-item">
                  <strong>Peso:</strong> {consulta.PESO} kg
                </div>
              )}
              {consulta.TALLA && (
                <div className="info-item">
                  <strong>Talla:</strong> {consulta.TALLA} m
                </div>
              )}
              {consulta.IMC && (
                <div className="info-item">
                  <strong>IMC:</strong> {consulta.IMC}
                </div>
              )}
              {consulta.TEMPERATURA && (
                <div className="info-item">
                  <strong>Temperatura:</strong> {consulta.TEMPERATURA}°C
                </div>
              )}
            </div>
          </div>
        )}
        <div className="info-section">
          <h4 className="section-title">Relato de la Consulta</h4>
          {editMode ? (
            <textarea
              value={editData.relato}
              onChange={(e) => setEditData(prev => ({ ...prev, relato: e.target.value }))}
              className="form-textarea"
              rows={6}
              placeholder="Describa el relato de la consulta..."
            />
          ) : (
            <div className="text-content">
              {consulta.RELATO || 'No hay relato registrado'}
            </div>
          )}
        </div>

        <div className="info-section">
          <h4 className="section-title">Plan de Trabajo</h4>
          {editMode ? (
            <textarea
              value={editData.planDeTrabajo}
              onChange={(e) => setEditData(prev => ({ ...prev, planDeTrabajo: e.target.value }))}
              className="form-textarea"
              rows={4}
              placeholder="Describa el plan de trabajo..."
            />
          ) : (
            <div className="text-content">
              {consulta.PLAN_DE_TRABAJO || 'No hay plan de trabajo registrado'}
            </div>
          )}
        </div>

        {diagnosticos && diagnosticos.diagnosticos.length > 0 && (
          <div className="info-section">
            <h4 className="section-title">Diagnósticos</h4>
            
            {getDiagnosticoPrincipal() && (
              <div className="diagnostico-section">
                <h5>Diagnóstico Principal</h5>
                <div className="diagnostico-item principal">
                  <span className="diagnostico-codigo">
                    {getDiagnosticoPrincipal()?.codigo}
                  </span>
                  <span className="diagnostico-descripcion">
                    {getDiagnosticoPrincipal()?.descripcion}
                  </span>
                  <span className="badge badge-primary">Principal</span>
                </div>
              </div>
            )}

            {getDiagnosticosSecundarios().length > 0 && (
              <div className="diagnostico-section">
                <h5>Diagnósticos Secundarios</h5>
                <div className="diagnosticos-list">
                  {getDiagnosticosSecundarios().map((diagnostico) => (
                    <div key={diagnostico.id} className="diagnostico-item secundario">
                      <span className="diagnostico-codigo">{diagnostico.codigo}</span>
                      <span className="diagnostico-descripcion">{diagnostico.descripcion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {examenFisico && examenFisico.data && (
          <div className="info-section">
            <h4 className="section-title">Examen Físico</h4>
            <div className="text-content">
              {examenFisico.data.observaciones || 'No hay observaciones registradas en el examen físico'}
            </div>
          </div>
        )}

        <div className="info-section">
          <h4 className="section-title">Estado</h4>
          <div className="info-item">
            <strong>Estado:</strong> 
            <span className={`estado-badge ${consulta.ESTADO?.toLowerCase() || 'completada'}`}>
              {consulta.ESTADO || 'Completada'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerConsultaPanel;