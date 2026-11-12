import React from 'react';
import type { Doctor } from '../../types/models';

export interface FiltrosCitas {
  texto: string;
  doctor: string;
  estado: string;
  desde: string;
  hasta: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const FILTROS_VACIOS: FiltrosCitas = { texto: '', doctor: '', estado: '', desde: '', hasta: '' };

interface CitaFiltrosProps {
  filtros: FiltrosCitas;
  onChange: (filtros: FiltrosCitas) => void;
  doctores: Doctor[];
  total: number;
  encontrados: number;
}

const CitaFiltros: React.FC<CitaFiltrosProps> = ({ filtros, onChange, doctores, total, encontrados }) => {
  const cambiar = (campo: keyof FiltrosCitas) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...filtros, [campo]: e.target.value });
  const activos = Object.values(filtros).some(Boolean);

  return (
    <section className="card filtros-bar citas-filtros" aria-label="Buscar citas">
      <div className="filtro filtro-texto">
        <label className="form-label" htmlFor="filtro-texto">Buscar</label>
        <input
          id="filtro-texto"
          type="search"
          className="form-input"
          placeholder="Paciente, DNI o servicio…"
          value={filtros.texto}
          onChange={cambiar('texto')}
        />
      </div>
      <div className="filtro">
        <label className="form-label" htmlFor="filtro-doctor">Doctor</label>
        <select id="filtro-doctor" className="form-select" value={filtros.doctor} onChange={cambiar('doctor')}>
          <option value="">Todos</option>
          {doctores.map(d => (
            <option key={d.ID_USUARIO} value={String(d.ID_USUARIO)}>{d.NOMBRE_COMPLETO || `${d.NOMBRE} ${d.APELLIDO}`}</option>
          ))}
        </select>
      </div>
      <div className="filtro">
        <label className="form-label" htmlFor="filtro-estado">Estado</label>
        <select id="filtro-estado" className="form-select" value={filtros.estado} onChange={cambiar('estado')}>
          <option value="">Todos</option>
          <option value="PROGRAMADA">Programadas</option>
          <option value="ATENDIDA">Atendidas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
      </div>
      <div className="filtro filtro-fecha">
        <label className="form-label" htmlFor="filtro-desde">Desde</label>
        <input id="filtro-desde" type="date" className="form-input" value={filtros.desde} max={filtros.hasta || undefined} onChange={cambiar('desde')} />
      </div>
      <div className="filtro filtro-fecha">
        <label className="form-label" htmlFor="filtro-hasta">Hasta</label>
        <input id="filtro-hasta" type="date" className="form-input" value={filtros.hasta} min={filtros.desde || undefined} onChange={cambiar('hasta')} />
      </div>
      <div className="filtro filtro-acciones">
        <span className="filtros-resultado" aria-live="polite">
          {activos ? `${encontrados} de ${total}` : `${total} en total`}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(FILTROS_VACIOS)} disabled={!activos}>
          Limpiar
        </button>
      </div>
    </section>
  );
};

export default CitaFiltros;
