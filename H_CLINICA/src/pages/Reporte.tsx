import React, { useState } from 'react';
import DiagnosticReport from '../components/Reporte/ReporteDiagnostico';
import ReportFilters from '../components/Reporte/ReporteFiltros';
import { reporteService } from '../services/apiService';
import type { ReporteDiagnosticoResponse, ReporteDiagnosticoParams } from '../types/models';
import '../styles/reporte.css'
interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
    status?: number;
    statusText?: string;
  };
  message: string;
}

const isAxiosError = (error: unknown): error is AxiosError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AxiosError).message === 'string'
  );
};

const Reporte: React.FC = () => {
  const [reportData, setReportData] = useState<ReporteDiagnosticoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleGenerateReport = async (
    fechaInicio: string, 
    fechaFin: string, 
    codigoCIE: string
  ): Promise<void> => {
    setLoading(true);
    setError('');
    setReportData(null);
    
    try {
      const params: ReporteDiagnosticoParams = {
        fechaInicio,
        fechaFin,
        codigoCIE
      };

      console.log('Enviando parámetros:', params);

      const response = await reporteService.generarReporteDiagnostico(params);
      setReportData(response);
    } catch (err: unknown) {
      console.error('Error generating report:', err);
      
      let errorMessage = 'Error al generar el reporte. Por favor, intente nuevamente.';
      
      if (isAxiosError(err)) {
        errorMessage = err.response?.data?.error || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearReport = (): void => {
    setReportData(null);
    setError('');
  };

  return (
    <div className="reporte-container">
      <div className="reporte-header">
        <h1 className="reporte-title">Reportes</h1>
        <p className="reporte-subtitle">Sistema de reportes diagnósticos y análisis estadísticos</p>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      <div className="reporte-grid">
        <div className="filters-panel">
          <div className="filters-header">
            <h2>Filtros del Reporte</h2>
            {reportData && (
              <button
                onClick={clearReport}
                className="clear-button"
                title="Limpiar reporte"
              >
                Limpiar
              </button>
            )}
          </div>
          
          <ReportFilters 
            onGenerateReport={handleGenerateReport}
            loading={loading}
          />
        </div>

        <div className="results-panel">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Generando reporte</p>
              <p className="loading-subtext">Esto puede tomar unos segundos</p>
            </div>
          ) : reportData ? (
            <DiagnosticReport data={reportData} />
          ) : (
            <div className="empty-report">
              <div className="empty-icon">📈</div>
              <h3>No hay reporte generado</h3>
              <p>Utilice los filtros para generar un reporte estadístico.</p>
              <div className="empty-instructions">
                <p>Seleccione un rango de fechas y un diagnóstico CIE-10</p>
                <p>para visualizar las estadísticas correspondientes.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reporte;