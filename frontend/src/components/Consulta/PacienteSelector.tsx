import React, { useEffect, useRef, useState } from 'react';
import { pacienteService } from '../../services/apiService';
import type { Paciente, PacienteResponse } from '../../types/models';

interface PatientSelectorProps {
  onPatientSelect: (dni: string) => void;
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

const PatientSelector: React.FC<PatientSelectorProps> = ({ onPatientSelect }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null);
  const [searchError, setSearchError] = useState<string>('');

  const [resultados, setResultados] = useState<Paciente[]>([]);
  const ultimaBusqueda = useRef(0);

  // Búsqueda en vivo por DNI o nombre mientras se escribe (sin botón "Buscar").
  useEffect(() => {
    const termino = searchTerm.trim();
    const id = ++ultimaBusqueda.current;
    setSearchError('');
    if (termino.length < 2) {
      setResultados([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const temporizador = window.setTimeout(async () => {
      try {
        const { data } = await pacienteService.buscarPacientes(termino);
        if (id !== ultimaBusqueda.current) return;
        setResultados(data);
        if (!data.length) setSearchError('No se encontró ningún paciente con ese DNI o nombre');
      } catch (error: unknown) {
        if (id !== ultimaBusqueda.current) return;
        const apiError = error as ApiError;
        setResultados([]);
        setSearchError(apiError.response?.data?.error || 'Error al buscar el paciente');
      } finally {
        if (id === ultimaBusqueda.current) setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [searchTerm]);

  const seleccionar = async (paciente: Paciente): Promise<void> => {
    // La búsqueda trae datos básicos; se carga la ficha completa (edad y sexo) para la tarjeta.
    try {
      const response: PacienteResponse = await pacienteService.buscarPacientePorDNI(paciente.DNI);
      const completo = Array.isArray(response.data) ? response.data[0] : response.data;
      setSelectedPatient(completo ?? paciente);
    } catch {
      setSelectedPatient(paciente);
    }
  };

  const handleConfirmSelection = (): void => {
    if (selectedPatient && selectedPatient.DNI) {
      onPatientSelect(selectedPatient.DNI);
    }
  };

  const handleClearSelection = (): void => {
    setSelectedPatient(null);
    setSearchTerm('');
    setResultados([]);
    setSearchError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    // Enter elige el primer resultado
    if (e.key === 'Enter' && resultados[0]) seleccionar(resultados[0]);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="patient-selector">
      <div className="selector-header">
        <h3 className="selector-title">Buscar Paciente</h3>
        <p className="selector-description">
          Escriba el DNI o el nombre del paciente para comenzar la consulta
        </p>
      </div>

      {selectedPatient ? (
        <div className="patient-selected-card">
          <div className="selected-patient-header">
            <div className="patient-avatar">
              {getInitials(selectedPatient.NOMBRE_APELLIDO)}
            </div>
            <div className="patient-details">
              <h4 className="patient-name">{selectedPatient.NOMBRE_APELLIDO}</h4>
              <div className="patient-info">
                <span className="info-item">
                  <strong>DNI:</strong> {selectedPatient.DNI}
                </span>
                {selectedPatient.EDAD && (
                  <span className="info-item">
                    <strong>Edad:</strong> {selectedPatient.EDAD} años
                  </span>
                )}
                {selectedPatient.SEXO && (
                  <span className="info-item">
                    <strong>Sexo:</strong> {selectedPatient.SEXO}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="selection-actions">
            <button
              onClick={handleClearSelection}
              className="btn btn-outline"
              type="button"
            >
              Cambiar Paciente
            </button>
            <button
              onClick={handleConfirmSelection}
              className="btn btn-primary"
              type="button"
            >
              Continuar con {selectedPatient.NOMBRE_APELLIDO.split(' ')[0]}
            </button>
          </div>
        </div>
      ) : (
        <div className="search-section">
          <div className="search-input">
            <div className="input-container">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escriba el DNI o el nombre del paciente..."
                className="search-input"
                autoFocus
                aria-label="Buscar paciente por DNI o nombre"
                aria-busy={searching}
              />
              <div className="input-hint">
                {searching ? 'Buscando…' : 'Los resultados aparecen mientras escribe'}
              </div>
            </div>
          </div>

          {resultados.length > 0 && (
            <div className="search-results" role="listbox" aria-label="Pacientes encontrados">
              {resultados.map(p => (
                <div key={p.DNI} role="option" aria-selected="false" tabIndex={0} className="search-result-item"
                  onClick={() => seleccionar(p)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seleccionar(p); } }}>
                  <strong>{p.NOMBRE_APELLIDO}</strong>
                  <span className="text-muted"> · DNI <span className="mono">{p.DNI}</span>{p.TELEFONO ? ` · ${p.TELEFONO}` : ''}</span>
                </div>
              ))}
            </div>
          )}

          {searchError && (
            <div className="alert alert-error">
              {searchError}
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

export default PatientSelector;