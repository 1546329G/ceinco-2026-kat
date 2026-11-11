import React, { useState, useEffect } from 'react';
import { diagnosticoService } from '../../services/apiService';
import type { 
  DiagnosticosConsultaResponse, 
  DiagnosticoConsulta,
  CIE10Avanzado 
} from '../../types/models';
import '../../styles/consulta.css';

interface DiagnosticosPanelProps {
  consultationId: number;
  diagnosticosData: DiagnosticosConsultaResponse | null;
  onUpdate: () => void;
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

const DiagnosticosPanel: React.FC<DiagnosticosPanelProps> = ({
  consultationId,
  diagnosticosData,
  onUpdate
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CIE10Avanzado[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);

  const searchCIE10 = async (query: string): Promise<void> => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');
    try {
      const response = await diagnosticoService.buscarCIE10Avanzado(query, 10);
      setSearchResults(response.data);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || apiError.message || 'Error al buscar diagnósticos');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchCIE10(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const agregarDiagnosticoSecundario = async (codigoCIE: string): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await diagnosticoService.agregarDiagnosticoSecundario(consultationId, codigoCIE);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
      onUpdate();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || apiError.message || 'Error al agregar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const eliminarDiagnosticoSecundario = async (idDiagnosticoSecundario: number): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await diagnosticoService.eliminarDiagnosticoSecundario(consultationId, idDiagnosticoSecundario);
      onUpdate();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || apiError.message || 'Error al eliminar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const getDiagnosticoPrincipal = (): DiagnosticoConsulta | null => {
    return diagnosticosData?.diagnosticos.find(d => d.esPrincipal) || null;
  };

  const getDiagnosticosSecundarios = (): DiagnosticoConsulta[] => {
    return diagnosticosData?.diagnosticos.filter(d => !d.esPrincipal) || [];
  };

  return (
    <div className="diagnosticos-panel">
      <div className="card-header">
        <h3 className="card-title">Gestión de Diagnósticos</h3>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="btn btn-primary"
          disabled={loading}
        >
          {showSearch ? 'Cancelar' : '+ Agregar Diagnóstico'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      {showSearch && (
        <div className="search-section">
          <div className="form-group">
            <label className="form-label">Buscar Diagnóstico CIE-10</label>
            <div className="form-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código o descripción..."
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>

          {searching && (
            <div className="loading">
              <div className="loading-spinner"></div>
              Buscando diagnósticos...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((diagnostico) => (
                <div
                  key={diagnostico.CODIGO}
                  className="search-result-item"
                  onClick={() => agregarDiagnosticoSecundario(diagnostico.CODIGO)}
                >
                  <div className="diagnostico-codigo">{diagnostico.CODIGO}</div>
                  <div className="diagnostico-descripcion">{diagnostico.DESCRIPCION}</div>
                  <div className="diagnostico-categoria">{diagnostico.CATEGORIA}</div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <div className="no-results">
              No se encontraron diagnósticos con "{searchQuery}"
            </div>
          )}
        </div>
      )}

      <div className="diagnosticos-list">
        {getDiagnosticoPrincipal() && (
          <div className="diagnostico-section">
            <h4 className="section-title">Diagnóstico Principal</h4>
            <div className="diagnostico-item principal">
              <div className="diagnostico-content">
                <div className="diagnostico-header">
                  <span className="diagnostico-codigo">
                    {getDiagnosticoPrincipal()?.codigo}
                  </span>
                  <span className="badge badge-primary">Principal</span>
                </div>
                <div className="diagnostico-descripcion">
                  {getDiagnosticoPrincipal()?.descripcion}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="diagnostico-section">
          <div className="section-header">
            <h4 className="section-title">Diagnósticos Secundarios</h4>
            <span className="section-count">
              ({getDiagnosticosSecundarios().length})
            </span>
          </div>

          {getDiagnosticosSecundarios().length > 0 ? (
            <div className="diagnosticos-grid">
              {getDiagnosticosSecundarios().map((diagnostico) => (
                <div key={diagnostico.id} className="diagnostico-item secundario">
                  <div className="diagnostico-content">
                    <div className="diagnostico-header">
                      <span className="diagnostico-codigo">{diagnostico.codigo}</span>
                    </div>
                    <div className="diagnostico-descripcion">
                      {diagnostico.descripcion}
                    </div>
                    {diagnostico.fechaRegistro && (
                      <div className="diagnostico-fecha">
                        Registrado: {new Date(diagnostico.fechaRegistro).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="diagnostico-actions">
                    <button
                      onClick={() => eliminarDiagnosticoSecundario(Number(diagnostico.id))}
                      className="btn btn-danger btn-sm"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay diagnósticos secundarios registrados</p>
              <p className="empty-state-subtitle">
                Use el botón "Agregar Diagnóstico" para incluir diagnósticos adicionales
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticosPanel;