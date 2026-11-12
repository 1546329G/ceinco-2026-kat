import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cita } from '../../types/models';
import Paginacion, { usePaginacion } from '../ui/Paginacion';
import { formatoFecha } from '../../utils/fechas';

interface CitaListaProps {
  citas: Cita[];
  canManage: boolean;
  canAttend: boolean;
  filtroEstado: string;
  hayFiltros?: boolean;
  citaDestacada?: number | null;
  onCambiarEstado: (idCita: number, nuevoEstado: string) => void;
  onEditarCita: (cita: Cita) => void;
  onEliminarCita: (idCita: number) => void;
}

const ESTADOS: Record<string, { texto: string; badge: string }> = {
  PROGRAMADA: { texto: 'Programada', badge: 'badge-primary' },
  ATENDIDA: { texto: 'Atendida', badge: 'badge-success' },
  CANCELADA: { texto: 'Cancelada', badge: 'badge-danger' }
};

const hoyISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const CitaLista: React.FC<CitaListaProps> = ({
  citas,
  canManage,
  canAttend,
  filtroEstado,
  hayFiltros,
  citaDestacada,
  onCambiarEstado,
  onEditarCita,
  onEliminarCita,
}) => {
  const navigate = useNavigate();
  const paginacion = usePaginacion(citas, 20);
  const { setPagina, pagina } = paginacion;
  const hoy = hoyISO();
  const indiceDestacada = citaDestacada ? citas.findIndex(c => c.ID_CITAS === citaDestacada) : -1;

  // Ir a la página que contiene la cita destacada
  useEffect(() => {
    if (indiceDestacada >= 0) setPagina(Math.floor(indiceDestacada / 20) + 1);
  }, [indiceDestacada, setPagina]);

  // Desplazarse hasta la fila una vez visible
  useEffect(() => {
    if (indiceDestacada < 0) return;
    document.getElementById(`cita-${citaDestacada}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [indiceDestacada, citaDestacada, pagina]);

  if (citas.length === 0) {
    return (
      <section className="card">
        <p className="empty-state">
          {hayFiltros
            ? 'Ninguna cita coincide con la búsqueda.'
            : filtroEstado
              ? `No hay citas con estado "${ESTADOS[filtroEstado]?.texto ?? filtroEstado}".`
              : 'No hay citas registradas.'}
        </p>
      </section>
    );
  }

  return (
    <section className="card card-flush citas-lista">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Paciente</th>
              <th>DNI</th>
              <th>Doctor</th>
              <th>Servicio</th>
              <th>Estado</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {paginacion.visibles.map((cita) => {
              const fecha = cita.FECHA.slice(0, 10);
              const estado = cita.ESTADO || 'DESCONOCIDO';
              const info = ESTADOS[estado] ?? { texto: estado.toLowerCase(), badge: 'badge-neutral' };
              return (
                <tr
                  key={cita.ID_CITAS}
                  id={`cita-${cita.ID_CITAS}`}
                  className={[fecha < hoy ? 'cita-pasada' : '', cita.ID_CITAS === citaDestacada ? 'fila-destacada' : ''].filter(Boolean).join(' ')}
                  aria-current={cita.ID_CITAS === citaDestacada ? 'true' : undefined}
                >
                  <td className="nowrap">
                    {formatoFecha(fecha, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    {fecha === hoy && <span className="badge badge-warning badge-inline">Hoy</span>}
                  </td>
                  <td className="mono">{cita.HORA.slice(0, 5)}</td>
                  <td className="strong">{cita.NOMBRE_APELLIDO || cita.PACIENTE_NOMBRE || '—'}</td>
                  <td className="mono">{cita.DNI || cita.DNI_PACIENTE || '—'}</td>
                  <td>{cita.DOCTOR || '—'}</td>
                  <td className="text-muted truncate">{cita.SERVICIO || 'Consulta general'}</td>
                  <td><span className={`badge ${info.badge}`}>{info.texto}</span></td>
                  <td className="cell-actions">
                    {estado === 'PROGRAMADA' && (
                      <>
                        {canAttend && (
                          <button onClick={() => navigate(`/consulta?cita=${cita.ID_CITAS}`)} className="btn btn-success btn-sm" title="Iniciar la consulta de esta cita">
                            Atender
                          </button>
                        )}
                        {canManage && (
                          <>
                            <button onClick={() => onEditarCita(cita)} className="btn btn-secondary btn-sm" title="Editar cita">Editar</button>
                            <button onClick={() => onCambiarEstado(cita.ID_CITAS, 'CANCELADA')} className="btn btn-danger-soft btn-sm" title="Cancelar cita">Cancelar</button>
                          </>
                        )}
                      </>
                    )}
                    {estado === 'CANCELADA' && canManage && (
                      <button onClick={() => onEliminarCita(cita.ID_CITAS)} className="btn btn-danger-soft btn-sm" title="Eliminar cita cancelada">Eliminar</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Paginacion {...paginacion} onCambiar={paginacion.setPagina} />
    </section>
  );
};

export default CitaLista;
