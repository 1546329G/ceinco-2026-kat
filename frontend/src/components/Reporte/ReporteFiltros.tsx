import React, { useState, useEffect } from 'react';
import { consultaService } from '../../services/apiService';
import type { CIE10 } from '../../types/models';

interface ReportFiltersProps {
  onGenerateReport: (fechaInicio: string, fechaFin: string, codigoCIE: string) => void;
  loading: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ onGenerateReport, loading }) => {
  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
    codigoCIE: ''
  });
  const [cieOptions, setCieOptions] = useState<CIE10[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const searchCIE10 = async () => {
      if (searchQuery.length < 2) {
        setCieOptions([]);
        return;
      }

      setSearching(true);
      try {
        const response = await consultaService.buscarCIE10(searchQuery);
        setCieOptions(response.data || []);
      } catch (error) {
        console.error('Error searching CIE-10:', error);
        setCieOptions([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchCIE10, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    if (!filters.fechaInicio || !filters.fechaFin || !filters.codigoCIE) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (new Date(filters.fechaInicio) > new Date(filters.fechaFin)) {
      alert('La fecha de inicio no puede ser mayor a la fecha de fin');
      return;
    }

    onGenerateReport(filters.fechaInicio, filters.fechaFin, filters.codigoCIE);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCIEChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFilters(prev => ({ ...prev, codigoCIE: '' }));
    setSearchQuery(e.target.value);
  };

  const selectCIEOption = (cie: CIE10): void => {
    setFilters(prev => ({
      ...prev,
      codigoCIE: cie.CODIGO
    }));
    setSearchQuery(`${cie.CODIGO} - ${cie.DESCRIPCION}`);
    setCieOptions([]);
  };

  const setDefaultDates = (): void => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setFilters(prev => ({
      ...prev,
      fechaInicio: startDate.toISOString().split('T')[0],
      fechaFin: endDate.toISOString().split('T')[0]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="filters-form">
      <div className="form-group">
        <label className="form-label">
          Fecha Inicio *
        </label>
        <input
          type="date"
          name="fechaInicio"
          value={filters.fechaInicio}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Fecha Fin *
        </label>
        <input
          type="date"
          name="fechaFin"
          value={filters.fechaFin}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <button
          type="button"
          onClick={setDefaultDates}
          className="secondary-button"
        >
          Últimos 30 días
        </button>
      </div>

      <div className="form-group relative">
        <label className="form-label">
          Diagnóstico CIE-10 *
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={handleCIEChange}
          placeholder="Buscar código o descripción CIE-10..."
          required
          className="form-input"
        />
        
        {cieOptions.length > 0 && (
          <div className="dropdown-menu">
            {cieOptions.map((cie) => (
              <div
                key={cie.CODIGO}
                className="dropdown-item"
                onClick={() => selectCIEOption(cie)}
              >
                <div className="dropdown-code">{cie.CODIGO}</div>
                <div className="dropdown-description">{cie.DESCRIPCION}</div>
              </div>
            ))}
          </div>
        )}
        
        {searching && (
          <div className="search-indicator">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      <input type="hidden" name="codigoCIE" value={filters.codigoCIE} />

      <button
        type="submit"
        disabled={loading || !filters.codigoCIE}
        className="primary-button"
      >
        {loading ? 'Generando Reporte...' : 'Generar Reporte'}
      </button>

      <div className="instructions">
        <h4>Instrucciones</h4>
        <ul>
          <li>Seleccione el rango de fechas del reporte</li>
          <li>Busque y seleccione el diagnóstico CIE-10</li>
          <li>El reporte mostrará estadísticas y lista de pacientes</li>
          <li>Los datos incluyen prevalencia y distribución por sexo</li>
        </ul>
      </div>
    </form>
  );
};

export default ReportFilters;