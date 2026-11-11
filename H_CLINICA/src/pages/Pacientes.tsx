import React, { useState, useEffect, useCallback } from 'react';
import { pacienteService } from '../services/apiService';
import type { Paciente, CreatePacienteData } from '../types/models';
import PatientTable from '../components/Paciente/PacienteTable';
import PatientForm from '../components/Paciente/PacienteForm';
import PatientSearch from '../components/Paciente/PacienteSearch';
import PacienteDetalle from '../components/Paciente/PacienteDetalle';
import Alert from '../components/ui/Alert';
import '../styles/paciente.css';

const Pacientes: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [searchResults, setSearchResults] = useState<Paciente[] | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string; visible: boolean }>({
    type: 'success',
    message: '',
    visible: false
  });

  const mostrarAlert = useCallback((type: 'success' | 'error', message: string): void => {
    setAlert({ type, message, visible: true });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, visible: false }));
    }, 5000);
  }, []);

  const loadPacientes = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await pacienteService.obtenerPacientes();
      setPacientes(response.data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      mostrarAlert('error', 'Error al cargar los pacientes');
    } finally {
      setLoading(false);
    }
  }, [mostrarAlert]);

  useEffect(() => {
    loadPacientes();
  }, [loadPacientes]);

  const handleCreatePaciente = async (data: CreatePacienteData): Promise<void> => {
    try {
      await pacienteService.crearPaciente(data);
      setShowForm(false);
      mostrarAlert('success', 'Paciente registrado exitosamente');
      await loadPacientes();
    } catch (error) {
      console.error('Error creating patient:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar el paciente';
      mostrarAlert('error', errorMessage);
      throw error;
    }
  };

  const handleSearch = (results: Paciente[]): void => {
    setSearchResults(results);
    if (results.length === 0) {
      mostrarAlert('error', 'No se encontraron pacientes con los criterios de búsqueda');
    }
  };

  const handleClearSearch = (): void => {
    setSearchResults(null);
  };

  const handleCancelForm = (): void => {
    setShowForm(false);
  };

  const handleBackFromDetail = (): void => {
    setSelectedPaciente(null);
  };

  const displayPacientes = searchResults ?? pacientes;

  return (
    <div className="pacientes-container">
      <div className="pacientes-header">
        <div className="pacientes-header-content">
          <div className="pacientes-title-section">
            <div>
              <h1 className="pacientes-title">Gestión de Pacientes</h1>
              <p className="pacientes-subtitle">Administre los registros médicos de los pacientes</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="pacientes-count">
                <span className="count-dot"></span>
                {pacientes.length} {pacientes.length === 1 ? 'paciente' : 'pacientes'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pacientes-main">
        <div className="alert-container">
          <Alert
            type={alert.type}
            message={alert.message}
            visible={alert.visible}
            onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
          />
        </div>

        <div className="pacientes-grid">
          <div className="sidebar-column">
            <div className="sidebar-panel">
              <div className="sidebar-content">
                <div className="action-section">
                  <button
                    onClick={() => setShowForm(true)}
                    disabled={loading}
                    className="btn-new-patient"
                  >
                    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Paciente
                  </button>
                </div>
                <div className="search-section">
                  <h3 className="section-title">Buscar Pacientes</h3>
                  <PatientSearch onSearchResults={handleSearch} onClear={handleClearSearch} />
                </div>
              </div>
            </div>
          </div>
          <div className="main-column">
            <div className="main-panel">
              {showForm ? (
                <div className="panel-content">
                  <div className="panel-header">
                    <h2 className="panel-title">Registrar Nuevo Paciente</h2>
                    <button
                      onClick={handleCancelForm}
                      className="btn-close"
                      aria-label="Cerrar formulario"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <PatientForm
                    onSubmit={handleCreatePaciente}
                    onCancel={handleCancelForm}
                  />
                </div>
              ) : selectedPaciente ? (
                <div className="panel-content">
                  <div className="panel-header">
                    <h2 className="panel-title">Detalles del Paciente</h2>
                    <button
                      onClick={handleBackFromDetail}
                      className="btn-secondary"
                    >
                      Volver a la lista
                    </button>
                  </div>
                  <PacienteDetalle
                    paciente={selectedPaciente}
                    onBack={handleBackFromDetail}
                  />
                </div>
              ) : (
                <div className="panel-content">
                  <div className="panel-header">
                    <div className="panel-title-section">
                      <h2 className="panel-title">
                        {searchResults !== null ? 'Resultados de Búsqueda' : 'Lista de Pacientes'}
                      </h2>
                      <p className="panel-subtitle">
                        {searchResults !== null
                          ? `${searchResults.length} paciente(s) encontrado(s)`
                          : `Mostrando todos los pacientes registrados`
                        }
                      </p>
                    </div>
                    {searchResults !== null && (
                      <button
                        onClick={handleClearSearch}
                        className="btn-secondary"
                      >
                        
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                  <PatientTable
                    pacientes={displayPacientes}
                    loading={loading}
                    onSelectPaciente={setSelectedPaciente}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pacientes;