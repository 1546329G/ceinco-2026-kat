import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { citaService } from '../services/apiService';
import { doctorService } from '../services/apiService';
import type { Cita, Doctor, CitaData, AlertState } from '../types/models';
import CitaModal from '../components/Cita/CitaModal';
import CitaFiltros from '../components/Cita/CitaFiltro';
import CitaLista from '../components/Cita/CitaLista';
import Alert from '../components/ui/Alert';
import '../styles/cita.css';

const Citas: React.FC = () => {
  const { cargo } = useAuth();
  const canManage = cargo === 'administrador' || cargo === 'asistente';
  const [citas, setCitas] = useState<Cita[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [citaEditando, setCitaEditando] = useState<Cita | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [alert, setAlert] = useState<AlertState>({
    type: 'info',
    message: '',
    visible: false
  });

  const mostrarAlert = useCallback((type: AlertState['type'], message: string): void => {
    setAlert({ type, message, visible: true });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, visible: false }));
    }, 5000);
  }, []);

  const cargarDatosIniciales = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const [citasResponse, doctoresResponse] = await Promise.all([
        citaService.obtenerTodasCitas(),
        doctorService.obtenerDoctores()
      ]);
      
      setCitas(citasResponse.citas || []);
      setDoctores(doctoresResponse.data || []);
      mostrarAlert('success', 'Datos cargados correctamente');
    } catch (err: unknown) {
      console.error('Error cargando datos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
      mostrarAlert('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mostrarAlert]);

  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  const cargarCitasHoy = async (): Promise<void> => {
    try {
      setActionLoading(true);
      const response = await citaService.obtenerCitasHoy();
      const citasHoy = response.agenda || [];
      setCitas(citasHoy);
      setFiltroEstado('');
      mostrarAlert('success', `Cargadas ${citasHoy.length} citas para hoy`);
    } catch (err: unknown) {
      console.error('Error cargando citas de hoy:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las citas de hoy';
      mostrarAlert('error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const cargarTodasCitas = async (): Promise<void> => {
    try {
      setActionLoading(true);
      const response = await citaService.obtenerTodasCitas();
      const todasCitas = response.citas || [];
      setCitas(todasCitas);
      setFiltroEstado('');
      mostrarAlert('success', `Cargadas ${todasCitas.length} citas en total`);
    } catch (err: unknown) {
      console.error('Error cargando todas las citas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar todas las citas';
      mostrarAlert('error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCrearCita = async (citaData: CitaData): Promise<void> => {
    try {
      setActionLoading(true);
      const result = await citaService.crearCita(citaData);
      mostrarAlert('success', `Cita creada exitosamente para ${result.paciente}`);
      await cargarTodasCitas();
    } catch (err: unknown) {
      console.error('Error creando cita:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la cita';
      mostrarAlert('error', errorMessage);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditarCita = async (citaData: CitaData): Promise<void> => {
    if (!citaEditando) return;

    try {
      setActionLoading(true);
      const datosEdicion: Partial<CitaData> & { estado?: string } = {
        idDoctor: citaData.idDoctor,
        fecha: citaData.fecha,
        hora: citaData.hora,
        servicio: citaData.servicio
      };
      
      const result = await citaService.editarCita(citaEditando.ID_CITAS, datosEdicion);
      mostrarAlert('success', `Cita actualizada exitosamente: ${result.message}`);
      await cargarTodasCitas();
    } catch (err: unknown) {
      console.error('Error editando cita:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al editar la cita';
      mostrarAlert('error', errorMessage);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCambiarEstado = async (idCita: number, nuevoEstado: string): Promise<void> => {
    try {
      setActionLoading(true);
      const result = await citaService.actualizarEstadoCita(idCita, nuevoEstado);
      mostrarAlert('success', result.message);
      
      setCitas(prevCitas => 
        prevCitas.map(cita => 
          cita.ID_CITAS === idCita 
            ? { ...cita, ESTADO: nuevoEstado }
            : cita
        )
      );
    } catch (err: unknown) {
      console.error('Error cambiando estado de cita:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar el estado de la cita';
      mostrarAlert('error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEliminarCita = async (idCita: number): Promise<void> => {
    if (!confirm('¿Está seguro de que desea eliminar esta cita? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setActionLoading(true);
      const result = await citaService.eliminarCita(idCita);
      mostrarAlert('success', `Cita eliminada exitosamente: ${result.message}`);
      
      setCitas(prevCitas => prevCitas.filter(cita => cita.ID_CITAS !== idCita));
    } catch (err: unknown) {
      console.error('Error eliminando cita:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la cita';
      mostrarAlert('error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const abrirModalCrear = (): void => {
    setCitaEditando(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (cita: Cita): void => {
    setCitaEditando(cita);
    setModalAbierto(true);
  };

  const cerrarModal = (): void => {
    setModalAbierto(false);
    setCitaEditando(null);
  };

  const handleGuardarCita = async (citaData: CitaData): Promise<void> => {
    if (citaEditando) {
      await handleEditarCita(citaData);
    } else {
      await handleCrearCita(citaData);
    }
  };

  const getIdDoctor = (cita: Cita): number => {
    return cita.ID_USUARIO || 0;
  };

  const citasFiltradas = filtroEstado 
    ? citas.filter(cita => cita.ESTADO === filtroEstado)
    : citas;

  if (loading) {
    return (
      <div className="citas-loading">
        <div className="loading-text">Cargando citas...</div>
      </div>
    );
  }

  return (
    <div className="citas-container">
      <Alert
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
      />

      <div className="citas-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="header-title">Gestión de Citas</h1>
            <p className="header-subtitle">Programa y gestiona las citas médicas</p>
          </div>
          {canManage && <button
            onClick={abrirModalCrear}
            className="btn btn-primary"
            disabled={actionLoading}
          >
            Nueva Cita
          </button>}
        </div>
      </div>

      <CitaFiltros
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={setFiltroEstado}
        onCargarCitasHoy={cargarCitasHoy}
        onCargarTodasCitas={cargarTodasCitas}
        loading={actionLoading}
      />

      <CitaLista
        citas={citasFiltradas}
        canManage={canManage}
        canAttend={cargo === 'administrador' || cargo === 'doctor'}
        filtroEstado={filtroEstado}
        onCambiarEstado={handleCambiarEstado}
        onEditarCita={abrirModalEditar}
        onEliminarCita={handleEliminarCita}
      />

      <CitaModal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        onSave={handleGuardarCita}
        doctores={doctores}
        citaExistente={citaEditando ? {
          dniPaciente: citaEditando.DNI_PACIENTE || citaEditando.DNI || '',
          idDoctor: getIdDoctor(citaEditando),
          fecha: citaEditando.FECHA.slice(0, 10),
          hora: citaEditando.HORA.slice(0, 5),
          servicio: citaEditando.SERVICIO || 'CONSULTA GENERAL',
          idCita: citaEditando.ID_CITAS
        } : undefined}
        loading={actionLoading}
      />
    </div>
  );
};

export default Citas;