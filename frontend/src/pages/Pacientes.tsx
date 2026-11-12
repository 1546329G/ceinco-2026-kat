import React, { useState, useEffect, useCallback } from 'react';
import { pacienteService } from '../services/apiService';
import { useModoAdmin } from '../context/ModoAdminContext';
import type { Paciente, CreatePacienteData } from '../types/models';
import PatientTable from '../components/Paciente/PacienteTable';
import PatientForm from '../components/Paciente/PacienteForm';
import PatientSearch from '../components/Paciente/PacienteSearch';
import PacienteDetalle from '../components/Paciente/PacienteDetalle';
import Alert from '../components/ui/Alert';

const Pacientes: React.FC = () => {
  const { ocultarEdicion } = useModoAdmin();
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
    <div className="page pacientes-container">
      <header className="page-header">
        <div className="page-heading">
          <h1 className="page-title">Pacientes</h1>
          <span className="pill">
            {loading ? 'Cargando…' : `${pacientes.length} ${pacientes.length === 1 ? 'paciente' : 'pacientes'}`}
          </span>
        </div>
        {!showForm && !selectedPaciente && (
          <div className="page-actions">
            <PatientSearch onSearchResults={handleSearch} onClear={handleClearSearch} />
            {!ocultarEdicion && <button onClick={() => setShowForm(true)} disabled={loading} className="btn btn-primary">
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo paciente
            </button>}
          </div>
        )}
      </header>

      <Alert
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
      />

      {showForm ? (
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Registrar nuevo paciente</h2>
            <button onClick={handleCancelForm} className="btn btn-ghost btn-sm" aria-label="Cerrar formulario">
              Cerrar
            </button>
          </div>
          <PatientForm onSubmit={handleCreatePaciente} onCancel={handleCancelForm} />
        </section>
      ) : selectedPaciente ? (
        <PacienteDetalle paciente={selectedPaciente} onBack={handleBackFromDetail} />
      ) : (
        <section className="card card-flush">
          <div className="card-header">
            <h2 className="card-title">
              {searchResults !== null ? `Resultados de búsqueda (${searchResults.length})` : 'Lista de pacientes'}
            </h2>
            {searchResults !== null && (
              <button onClick={handleClearSearch} className="btn btn-secondary btn-sm">
                Limpiar búsqueda
              </button>
            )}
          </div>
          <PatientTable pacientes={displayPacientes} loading={loading} onSelectPaciente={setSelectedPaciente} />
        </section>
      )}
    </div>
  );
};

export default Pacientes;