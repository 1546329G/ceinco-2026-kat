import React, { useState, useEffect, useCallback } from 'react';
import { consultaService } from '../../services/apiService';
import type { ExamenAuxiliarData } from '../../types/models';

interface ExamenesAuxiliaresPanelProps {
  consultationId: number;
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
  tipoExamen: string;
  descripcion: string;
  resultados: string;
  archivo: File | null;
}

const ExamenesAuxiliaresPanel: React.FC<ExamenesAuxiliaresPanelProps> = ({ consultationId }) => {
  const [examenes, setExamenes] = useState<ExamenAuxiliarData[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    tipoExamen: '',
    descripcion: '',
    resultados: '',
    archivo: null
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Usar useCallback para memoizar la función
  const cargarExamenes = useCallback(async (): Promise<void> => {
    try {
      const response = await consultaService.obtenerExamenesAuxiliaresPorConsulta(consultationId);
      setExamenes(response.data);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error('Error cargando exámenes auxiliares:', apiError);
      setError('Error al cargar los exámenes auxiliares existentes');
    }
  }, [consultationId]); 

  useEffect(() => {
    cargarExamenes();
  }, [cargarExamenes]); 

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!formData.tipoExamen.trim() || !formData.descripcion.trim()) {
      setError('Tipo de examen y descripción son requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('idConsulta', consultationId.toString());
      formDataToSend.append('tipo_examen', formData.tipoExamen);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('resultados', formData.resultados);
      
      if (formData.archivo) {
        formDataToSend.append('archivo', formData.archivo);
      }

      await consultaService.subirExamenAuxiliar(formDataToSend);
      
      setShowForm(false);
      setFormData({
        tipoExamen: '',
        descripcion: '',
        resultados: '',
        archivo: null
      });
      await cargarExamenes();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || apiError.message || 'Error al registrar examen');
    } finally {
      setLoading(false);
    }
  };

  const descargarArchivo = async (url: string): Promise<void> => {
    try {
      const archivo = await consultaService.descargarAdjunto(url);
      const objectUrl = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = objectUrl;
      enlace.download = decodeURIComponent(url.split('/').pop() ?? 'adjunto');
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setError('No se pudo descargar el archivo adjunto');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, archivo: file }));
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="examenes-auxiliares-panel">
      <div className="card-header">
        <h3 className="card-title">Exámenes Auxiliares</h3>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          disabled={loading}
        >
          + Nuevo Examen
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="examen-form-section">
          <h4 className="section-title">Registrar Nuevo Examen Auxiliar</h4>
          <form onSubmit={handleSubmit} className="examen-form">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label required">Tipo de Examen</label>
                <select
                  value={formData.tipoExamen}
                  onChange={(e) => handleInputChange('tipoExamen', e.target.value)}
                  className="form-select"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="LABORATORIO">Laboratorio</option>
                  <option value="IMAGENES">Imágenes</option>
                  <option value="ELECTROCARDIOGRAMA">Electrocardiograma</option>
                  <option value="ECOcardiograma">Ecocardiograma</option>
                  <option value="MAPA">Mapa</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Archivo Adjunto</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="form-input"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={loading}
                />
                <small className="form-help">
                  Formatos permitidos: PDF, JPG, PNG, DOC (Max: 10MB)
                </small>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Descripción</label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                className="form-input"
                placeholder="Descripción detallada del examen..."
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Resultados</label>
              <textarea
                value={formData.resultados}
                onChange={(e) => handleInputChange('resultados', e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder="Resultados del examen, hallazgos, interpretación..."
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
                {loading ? 'Registrando...' : 'Registrar Examen'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="examenes-list">
        {examenes.length > 0 ? (
          <div className="examenes-grid">
            {examenes.map((examen) => (
              <div key={examen.ID_EXAMENESAUX} className="examen-card">
                <div className="examen-header">
                  <div className="examen-info">
                    <h4 className="examen-tipo">{examen.TIPO_EXAMEN}</h4>
                    <div className="examen-meta">
                      <span className="examen-fecha">
                        {new Date(examen.FECHA_REGISTRO).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="examen-content">
                  <div className="examen-descripcion">
                    <strong>Descripción:</strong> {examen.DESCRIPCION}
                  </div>
                  
                  {examen.RESULTADOS && (
                    <div className="examen-resultados">
                      <strong>Resultados:</strong> {examen.RESULTADOS}
                    </div>
                  )}

                  {examen.URL_ARCHIVO && (
                    <div className="examen-archivo">
                      <strong>Archivo:</strong>{' '}
                      <button type="button" className="archivo-link"
                        onClick={() => examen.URL_ARCHIVO && descargarArchivo(examen.URL_ARCHIVO)}>
                        Descargar archivo adjunto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay exámenes auxiliares registrados</p>
            <p className="empty-state-subtitle">
              Use el botón "Nuevo Examen" para registrar estudios complementarios
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamenesAuxiliaresPanel;