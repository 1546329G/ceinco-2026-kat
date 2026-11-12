import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pacienteService, citaService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import type { Cita } from '../types/models';
import { formatoFecha, formatoFechaLarga } from '../utils/fechas';

interface Resumen {
  totalPacientes: number;
  citasHoy: Cita[];
  proximas: Cita[];
}

const hoyISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const estadoBadge = (estado: string | null): string =>
  estado === 'ATENDIDA' ? 'badge-success' : estado === 'CANCELADA' ? 'badge-danger' : estado === 'PROGRAMADA' ? 'badge-primary' : 'badge-neutral';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const rutaCita = (id: number): string => `/citas?cita=${id}`;
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    Promise.all([
      pacienteService.obtenerPacientes(),
      citaService.obtenerCitasHoy(),
      citaService.obtenerTodasCitas({ estado: 'PROGRAMADA' })
    ]).then(([pacientes, hoy, programadas]) => {
      if (!vigente) return;
      const fechaHoy = hoyISO();
      const proximas = programadas.citas
        .filter(c => c.FECHA > fechaHoy)
        .sort((a, b) => (a.FECHA + a.HORA).localeCompare(b.FECHA + b.HORA))
        .slice(0, 8);
      setResumen({ totalPacientes: pacientes.total ?? pacientes.data.length, citasHoy: hoy.agenda, proximas });
    }).catch(() => { if (vigente) setError(true); });
    return () => { vigente = false; };
  }, []);

  const pendientesHoy = resumen?.citasHoy.filter(c => c.ESTADO === 'PROGRAMADA').length ?? 0;
  const atendidasHoy = resumen?.citasHoy.filter(c => c.ESTADO === 'ATENDIDA').length ?? 0;

  const indicadores = [
    { titulo: 'Pacientes registrados', valor: resumen?.totalPacientes, tono: 'blue', enlace: '/pacientes' },
    { titulo: 'Citas de hoy', valor: resumen?.citasHoy.length, tono: 'green', enlace: '/citas' },
    { titulo: 'Pendientes hoy', valor: resumen ? pendientesHoy : undefined, tono: 'amber', enlace: '/citas' },
    { titulo: 'Atendidas hoy', valor: resumen ? atendidasHoy : undefined, tono: 'violet', enlace: '/citas' }
  ];

  return (
    <div className="page dashboard-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Hola{user?.nombre ? `, ${user.nombre}` : ''}</h1>
          <p className="page-subtitle">{formatoFechaLarga(hoyISO())}</p>
        </div>
      </header>

      {error && <div className="alert alert-error" role="alert">No se pudo cargar el resumen. Recargue la página.</div>}

      <div className="stats-grid">
        {indicadores.map(i => (
          <Link key={i.titulo} to={i.enlace} className={`stat-card stat-${i.tono}`}>
            <span className="stat-card-title">{i.titulo}</span>
            <span className="stat-card-value">{i.valor ?? '—'}</span>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="card card-flush">
          <div className="card-header">
            <h2 className="card-title">Agenda de hoy</h2>
            <Link to="/citas" className="btn btn-ghost btn-sm">Ver todas</Link>
          </div>
          {!resumen ? (
            <div className="skeleton-pulse">{[...Array(4)].map((_, i) => <div key={i} className="skeleton-row" />)}</div>
          ) : resumen.citasHoy.length === 0 ? (
            <p className="empty-state">No hay citas para hoy.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Hora</th><th>Paciente</th><th>Servicio</th><th>Doctor</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {resumen.citasHoy.map(c => (
                    <tr key={c.ID_CITAS} className="table-row" onClick={() => navigate(rutaCita(c.ID_CITAS))}
                      title="Ver esta cita en Citas">
                      <td className="mono">{c.HORA?.slice(0, 5)}</td>
                      <td><Link to={rutaCita(c.ID_CITAS)} className="link-fila" onClick={e => e.stopPropagation()}>{c.NOMBRE_APELLIDO}</Link></td>
                      <td className="text-muted">{c.SERVICIO}</td>
                      <td>{c.DOCTOR || '—'}</td>
                      <td><span className={`badge ${estadoBadge(c.ESTADO)}`}>{c.ESTADO?.toLowerCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card card-flush">
          <div className="card-header">
            <h2 className="card-title">Próximas citas</h2>
          </div>
          {!resumen ? (
            <div className="skeleton-pulse">{[...Array(4)].map((_, i) => <div key={i} className="skeleton-row" />)}</div>
          ) : resumen.proximas.length === 0 ? (
            <p className="empty-state">No hay citas programadas.</p>
          ) : (
            <ul className="list">
              {resumen.proximas.map(c => (
                <li key={c.ID_CITAS}>
                  <Link to={rutaCita(c.ID_CITAS)} className="list-item list-link" title="Ver esta cita en Citas">
                  <div className="list-date">
                    <span>{formatoFecha(c.FECHA, { day: '2-digit', month: 'short' })}</span>
                    <small className="mono">{c.HORA?.slice(0, 5)}</small>
                  </div>
                  <div className="list-main">
                    <span className="list-title">{c.NOMBRE_APELLIDO}</span>
                    <span className="list-sub">{c.SERVICIO}{c.DOCTOR ? ` · ${c.DOCTOR}` : ''}</span>
                  </div>
                  <span className="list-arrow" aria-hidden="true">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
