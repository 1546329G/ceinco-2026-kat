import React, { useState } from 'react';
import { pacienteService } from '../../services/apiService';
import type { Paciente } from '../../types/models';
import '../../styles/paciente.css'
interface PacienteSearch {
  onClear: () => void;
  onSearchResults: (results: Paciente[]) => void;
}

const PacienteSearch: React.FC<PacienteSearch> = ({ onSearchResults, onClear }) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!query.trim()) {
      onSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await pacienteService.buscarPacientes(query);
      onSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      onSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = (): void => {
    setQuery('');
    onClear();
  };

  return (
    <div className="paciente-search">
      <form onSubmit={handleSearch} className="search-form">
        <div className="form-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por DNI o nombre..."
            className="form-input"
            disabled={loading}
          />
        </div>
        
        <div className="search-actions">
          <button
            type="submit"
            className="btn btn-primary btn-flex"
            disabled={loading || !query.trim()}
          >
            {loading ? 'Buscando' : 'Buscar'}
          </button>
          
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary"
              disabled={loading}
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      <div className="search-tips">
        <p className="search-tips-title">Busque pacientes por:</p>
        <ul className="search-tips-list">
          <li>Número de DNI (8 dígitos)</li>
          <li>Nombre completo</li>
        </ul>
      </div>
    </div>
  );
};

export default PacienteSearch;