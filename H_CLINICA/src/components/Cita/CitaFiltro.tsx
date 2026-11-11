import React from 'react';
import '../../styles/cita.css';

interface CitaFiltrosProps {
  filtroEstado: string;
  onFiltroEstadoChange: (estado: string) => void;
  onCargarCitasHoy: () => void;
  onCargarTodasCitas: () => void;
  loading: boolean;
}

const CitaFiltros: React.FC<CitaFiltrosProps> = ({
  filtroEstado,
  onFiltroEstadoChange,
  onCargarCitasHoy,
  onCargarTodasCitas,
  loading
}) => {
  return (
    <div className="citas-filtros">
      <div className="filtros-content">
        <div className="filtros-row">
          <div className="filtros-buttons">
            <button
              onClick={onCargarCitasHoy}
              disabled={loading}
              className="filtro-btn"
            >
              {loading ? 'Cargando...' : 'Citas de Hoy'}
            </button>
            <button
              onClick={onCargarTodasCitas}
              disabled={loading}
              className="filtro-btn"
            >
              {loading ? 'Cargando...' : 'Todas las Citas'}
            </button>
          </div>
          
          <div className="filtros-select">
            <label className="filtros-label">Filtrar por estado:</label>
            <select
              value={filtroEstado}
              onChange={(e) => onFiltroEstadoChange(e.target.value)}
              className="filtros-dropdown"
              disabled={loading}
            >
              <option value="">Todos los estados</option>
              <option value="PROGRAMADA">Programadas</option>
              <option value="ATENDIDA">Atendidas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitaFiltros;