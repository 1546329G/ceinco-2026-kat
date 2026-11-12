import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { citaService } from '../services/apiService';
import { doctorService } from '../services/apiService';
import type { Cita, Doctor, CitaData, AlertState } from '../types/models';
import CitaModal from '../components/Cita/CitaModal';
import CitaFiltros, { FILTROS_VACIOS, type FiltrosCitas } from '../components/Cita/CitaFiltro';
import CitaLista from '../components/Cita/CitaLista';
import Alert from '../components/ui/Alert';
import { useModoAdmin } from '../context/ModoAdminContext';

const Citas: React.FC = () => {
  const [searchParams] = useSearchParams();
  const citaDestacada = Number(searchParams.get('cita')) || null;
  const { ocultarEdicion, cargoVista: cargo } = useModoAdmin();
  const canManage = !ocultarEdicion && (cargo === 'administrador' || cargo === 'asistente');
  const [citas, setCitas] = useState<Cita[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [citaEditando, setCitaEditando] = useState<Cita | null>(null);
  const [filtros, setFiltros] = useState<FiltrosCitas>(FILTROS_VACIOS);
  const [vista, setVista] = useState<'todas' | 'hoy'>('todas');
  // Estado de la última carga: se muestra junto a "Hoy / Todas" en lugar de un aviso emergente.
  const [estadoCarga, setEstadoCarga] = useState<{ texto: string; error: boolean } | null>(null);
  const [alert, setAlert] = useState<AlertState>({
    type: 'info',
    message: '',
    visible: false
  });

  const marcarCarga = (cantidad: number, ambito: string): void => {
    const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    setEstadoCarga({ texto: `${cantidad} citas ${ambito} · ${hora}`, error: false });
  };

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
      marcarCarga(citasResponse.citas?.length ?? 0, 'cargadas');
    } catch (err: unknown) {
      console.error('Error cargando datos:', err);
      setEstadoCarga({ texto: 'No se pudieron cargar las citas', error: true });
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
      setVista('hoy');
      marcarCarga(citasHoy.length, 'para hoy');
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
      setVista('todas');
      marcarCarga(todasCitas.length, 'cargadas');
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

  // Al llegar con ?cita=ID, quitar filtros para que la cita quede visible.
  useEffect(() => {
    if (citaDestacada) setFiltros(FILTROS_VACIOS);
  }, [citaDestacada]);

  const citasFiltradas = useMemo(() => {
    const normalizar = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const texto = normalizar(filtros.texto.trim());
    return citas.filter(cita => {
      const fecha = cita.FECHA.slice(0, 10);
      if (filtros.estado && cita.ESTADO !== filtros.estado) return false;
      if (filtros.doctor && String(cita.ID_USUARIO ?? '') !== filtros.doctor) return false;
      if (filtros.desde && fecha < filtros.desde) return false;
      if (filtros.hasta && fecha > filtros.hasta) return false;
      if (texto) {
        const campos = [cita.NOMBRE_APELLIDO, cita.PACIENTE_NOMBRE, cita.DNI, cita.DNI_PACIENTE, cita.SERVICIO, cita.DOCTOR];
        if (!campos.some(c => c && normalizar(c).includes(texto))) return false;
      }
      return true;
    }).sort((a, b) => {
      // Primero lo pendiente por atender (la más antigua/próxima arriba); luego el resto, de la más reciente a la más antigua.
      const pa = a.ESTADO === 'PROGRAMADA', pb = b.ESTADO === 'PROGRAMADA';
      if (pa !== pb) return pa ? -1 : 1;
      const ka = a.FECHA.slice(0, 10) + a.HORA, kb = b.FECHA.slice(0, 10) + b.HORA;
      return pa ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });
  }, [citas, filtros]);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container"><div className="loading-text">Cargando citas…</div></div>
      </div>
    );
  }

  return (
    <div className="page citas-container">
      <Alert
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
      />

      <header className="page-header">
        <div className="page-heading">
          <h1 className="page-title">Citas</h1>
        </div>
        <div className="page-actions">
          {estadoCarga && (
            <span className={`estado-carga ${estadoCarga.error ? 'estado-carga-error' : ''}`} role="status">
              {estadoCarga.error ? '⚠' : '✓'} {estadoCarga.texto}
            </span>
          )}
          <div className="segmented" role="group" aria-label="Rango de citas">
            <button onClick={cargarCitasHoy} disabled={actionLoading} aria-pressed={vista === 'hoy'}
              className={`segmented-btn ${vista === 'hoy' ? 'active' : ''}`}>Hoy</button>
            <button onClick={cargarTodasCitas} disabled={actionLoading} aria-pressed={vista === 'todas'}
              className={`segmented-btn ${vista === 'todas' ? 'active' : ''}`}>Todas</button>
          </div>
          {canManage && (
            <button onClick={abrirModalCrear} className="btn btn-primary" disabled={actionLoading}>
              Nueva cita
            </button>
          )}
        </div>
      </header>

      <CitaFiltros
        filtros={filtros}
        onChange={setFiltros}
        doctores={doctores}
        total={citas.length}
        encontrados={citasFiltradas.length}
      />

      <CitaLista
        citas={citasFiltradas}
        canManage={canManage}
        canAttend={!ocultarEdicion && (cargo === 'administrador' || cargo === 'doctor')}
        filtroEstado={filtros.estado}
        hayFiltros={Object.values(filtros).some(Boolean)}
        citaDestacada={citaDestacada}
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