import React, { useEffect, useRef, useState } from 'react';
import { pacienteService } from '../../services/apiService';
import type { Paciente } from '../../types/models';

interface PacienteSearchProps {
  onClear: () => void;
  onSearchResults: (results: Paciente[]) => void;
}

// Búsqueda en vivo: filtra mientras se escribe (sin botón "Buscar").
const PacienteSearch: React.FC<PacienteSearchProps> = ({ onSearchResults, onClear }) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const ultimaBusqueda = useRef(0);
  // Las funciones del padre cambian en cada render; se guardan en refs para no relanzar la búsqueda.
  const callbacks = useRef({ onSearchResults, onClear });
  callbacks.current = { onSearchResults, onClear };

  useEffect(() => {
    const termino = query.trim();
    const id = ++ultimaBusqueda.current;
    if (termino.length < 2) {
      setLoading(false);
      if (!termino) callbacks.current.onClear();
      return;
    }
    setLoading(true);
    const temporizador = window.setTimeout(async () => {
      try {
        const response = await pacienteService.buscarPacientes(termino);
        if (id === ultimaBusqueda.current) callbacks.current.onSearchResults(response.data || []);
      } catch (error) {
        console.error('Error buscando pacientes:', error);
        if (id === ultimaBusqueda.current) callbacks.current.onSearchResults([]);
      } finally {
        if (id === ultimaBusqueda.current) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [query]);

  return (
    <div className="paciente-search">
      <div className="search-form" role="search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por DNI o nombre..."
          className="form-input"
          aria-label="Buscar paciente por DNI o nombre"
          aria-busy={loading}
        />
        <div className="search-actions">
          {loading && <span className="text-muted" aria-live="polite">Buscando…</span>}
          {query && (
            <button type="button" onClick={() => setQuery('')} className="btn btn-secondary">
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PacienteSearch;
