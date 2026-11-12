import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { consultaDetalleService, pacienteService, type ConsultaDetalleApi } from '../services/apiService';
import type { Paciente } from '../types/models';
import { edad, formatoFechaLarga } from '../utils/fechas';

// Receta lista para imprimir (A5). Se abre en pestaña nueva desde la consulta y lanza la impresión al cargar.
const RecetaImprimir: React.FC = () => {
  const { idConsulta } = useParams();
  const [consulta, setConsulta] = useState<ConsultaDetalleApi | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [error, setError] = useState('');
  const impreso = useRef(false);

  useEffect(() => {
    const id = Number(idConsulta);
    if (!Number.isInteger(id) || id < 1) { setError('Consulta no válida.'); return; }
    let vigente = true;
    consultaDetalleService.obtener(id)
      .then(async datos => {
        const ficha = await pacienteService.buscarPacientePorDNI(datos.DNI).then(r => r.data).catch(() => null);
        if (!vigente) return;
        setPaciente(ficha);
        setConsulta(datos);
        document.title = `Receta · ${datos.paciente_nombre} · CEINCO`;
      })
      .catch((e: { response?: { status?: number } }) => {
        if (vigente) setError(e.response?.status === 404 ? 'La consulta no existe.' : 'No se pudo cargar la receta.');
      });
    return () => { vigente = false; };
  }, [idConsulta]);

  const receta = consulta?.receta;
  const tieneReceta = Boolean(receta && receta.medicamentos.length);

  useEffect(() => {
    if (tieneReceta && !impreso.current) {
      impreso.current = true;
      // Espera a que el logo y la maquetación terminen antes de abrir el diálogo de impresión.
      const t = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(t);
    }
  }, [tieneReceta]);

  if (error) return <div className="receta-print"><div className="alert alert-error" role="alert">{error}</div></div>;
  if (!consulta) return <div className="receta-print"><div className="loading-text">Cargando receta…</div></div>;
  if (!receta || !tieneReceta) {
    return <div className="receta-print"><div className="alert alert-warning" role="status">Esta consulta no tiene receta registrada.</div></div>;
  }

  const doctor = [consulta.doctor_nombre, consulta.doctor_apellido].filter(Boolean).join(' ');
  const anios = edad(paciente?.FECHA_NACIMIENTO);
  const diagnosticos = [...consulta.diagnosticos].sort((a, b) => (a.TIPO === 'principal' ? -1 : b.TIPO === 'principal' ? 1 : 0));

  return (
    <div className="receta-print">
      <div className="doc-toolbar no-print">
        <button className="btn btn-ghost btn-sm" onClick={() => window.close()}>Cerrar</button>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Imprimir</button>
      </div>

      <article className="receta-hoja">
        <header className="doc-header">
          <div className="doc-brand">
            <img src="/logo.png" alt="" />
            <div>
              <strong>CEINCO</strong>
              <span>Receta médica</span>
            </div>
          </div>
          <div className="doc-meta">
            <span>N.º <strong className="mono">{receta.ID_RECETA}</strong></span>
            <span>{formatoFechaLarga((receta.FECHA_EMISION || consulta.FECHA)?.slice(0, 10))}</span>
          </div>
        </header>

        <dl className="receta-paciente">
          <div><dt>Paciente</dt><dd>{consulta.paciente_nombre}</dd></div>
          <div><dt>DNI</dt><dd className="mono">{consulta.DNI}</dd></div>
          <div><dt>Edad</dt><dd>{anios !== null ? `${anios} años` : '—'}</dd></div>
        </dl>

        {diagnosticos.length > 0 && (
          <section className="receta-bloque">
            <h2 className="doc-title">Diagnóstico</h2>
            <ul className="receta-dx">
              {diagnosticos.map(d => (
                <li key={d.ID_DIAGNOSTICO}><span className="mono">{d.CODIGO}</span> {d.DESCRIPCION}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="receta-bloque">
          <h2 className="receta-rp">Rp.</h2>
          <ol className="receta-lista">
            {receta.medicamentos.map(m => (
              <li key={m.id_detalle}>
                <strong>{[m.medicamento, m.concentracion].filter(Boolean).join(' ')}</strong>
                {m.forma_farmaceutica && <span className="text-muted"> · {m.forma_farmaceutica}</span>}
                <div className="receta-indicacion">
                  {[m.dosis, m.frecuencia, m.duracion && `por ${m.duracion}`].filter(Boolean).join(' · ')}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {receta.INDICACIONES_GENERALES && (
          <section className="receta-bloque">
            <h2 className="doc-title">Indicaciones</h2>
            <p className="doc-texto">{receta.INDICACIONES_GENERALES}</p>
          </section>
        )}

        <footer className="receta-pie">
          <div className="doc-firma">
            <span />
            <small>{doctor ? `Dr(a). ${doctor}` : 'Médico tratante'}</small>
            <small className="text-muted">Firma y sello</small>
          </div>
        </footer>
      </article>
    </div>
  );
};

export default RecetaImprimir;
