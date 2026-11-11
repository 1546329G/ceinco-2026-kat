import React, { useState } from 'react';
import { pacienteService } from '../../services/apiService';
import type { Paciente, PacienteResponse } from '../../types/models';
import '../../styles/paciente.css'; 

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

  const handleSearch = async (): Promise<void> => {
    if (!searchTerm.trim()) {
      setSearchError('Por favor ingrese un DNI para buscar');
      return;
    }

    if (searchTerm.trim().length !== 8) {
      setSearchError('El DNI debe tener 8 dígitos');
      return;
    }

    if (!/^\d+$/.test(searchTerm.trim())) {
      setSearchError('El DNI debe contener solo números');
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const response: PacienteResponse = await pacienteService.buscarPacientePorDNI(searchTerm.trim());

      let paciente: Paciente | undefined;

      if (Array.isArray(response.data)) {
        paciente = response.data[0];
      } else {
        paciente = response.data;
      }

      if (paciente && paciente.DNI) {
        setSelectedPatient(paciente);
        setSearchError('');
      } else {
        setSearchError('No se encontró ningún paciente con ese DNI');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      if (apiError.response?.status === 404) {
        setSearchError('No se encontró ningún paciente con ese DNI');
      } else {
        setSearchError('Error al buscar el paciente');
      }
    } finally {
      setSearching(false);
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
    setSearchError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
          Ingrese el DNI del paciente para comenzar la consulta
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
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ingrese DNI (8 dígitos)..."
                className="search-input"
                maxLength={8}
                disabled={searching}
              />
              <div className="input-hint">DNI debe tener 8 dígitos</div>
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchTerm.trim()}
              className="btn btn-primary search-btn"
              type="button"
            >
              {searching ? (
                <>
                  <div className="loading-spinner"></div>
                  Buscando
                </>
              ) : (
                'Buscar Paciente'
              )}
            </button>
          </div>

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