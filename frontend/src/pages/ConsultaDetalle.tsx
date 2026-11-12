import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { consultaDetalleService, consultaService, pacienteService, type ConsultaDetalleApi } from '../services/apiService';
import type { Paciente } from '../types/models';
import { edad, formatoFecha, formatoFechaLarga } from '../utils/fechas';
import RecetaVisorModal from '../components/Consulta/RecetaVisorModal';

// Nombres legibles para el examen físico detallado (se guarda como JSON con claves camelCase)
const SECCIONES: Record<string, string> = {
  examenGeneral: 'General',
  examenRegional: 'Regional',
  examenCardiovascular: 'Cardiovascular',
  examenAbdominal: 'Abdominal',
  examenExtremidades: 'Extremidades',
  examenNeurologico: 'Neurológico'
};
const CAMPOS: Record<string, string> = {
  estadoGeneral: 'Estado general', habitus: 'Hábitus', hidratacion: 'Hidratación', conciencia: 'Conciencia', orientacion: 'Orientación',
  cabeza: 'Cabeza', ojos: 'Ojos', oidos: 'Oídos', nariz: 'Nariz', boca: 'Boca', cuello: 'Cuello', torax: 'Tórax', abdomen: 'Abdomen',
  ritmoCardiaco: 'Ritmo cardiaco', ruidosCardiacos: 'Ruidos cardiacos', soplos: 'Soplos', frotes: 'Frotes', pulsosPerifericos: 'Pulsos periféricos',
  formaAbdomen: 'Forma del abdomen', peristalsis: 'Peristalsis', visceromegalias: 'Visceromegalias', dolorPalpacion: 'Dolor a la palpación',
  signosIrritacion: 'Signos de irritación', extremidadesSuperiores: 'Extremidades superiores', extremidadesInferiores: 'Extremidades inferiores',
  edema: 'Edema', pulsosExtremidades: 'Pulsos en extremidades', temperaturaPiel: 'Temperatura de la piel', motilidad: 'Motilidad',
  sensibilidad: 'Sensibilidad', reflejos: 'Reflejos', fuerzaMuscular: 'Fuerza muscular', coordinacion: 'Coordinación'
};

const hora = (valor?: string | null): string => (valor && valor.length > 10 ? valor.slice(11, 16) : '');
const numero = (valor?: string | number | null, decimales = 1): string => {
  if (valor === null || valor === undefined || valor === '') return '—';
  const n = Number(valor);
  return Number.isFinite(n) ? n.toLocaleString('es-PE', { maximumFractionDigits: decimales }) : String(valor);
};

// Documento completo de una consulta. Se usa en la ventana emergente del historial y en /consultas/:id.
export const ConsultaDocumento: React.FC<{ idConsulta: number; actualizarTitulo?: boolean }> = ({ idConsulta, actualizarTitulo = false }) => {
  const [consulta, setConsulta] = useState<ConsultaDetalleApi | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(idConsulta);
    if (!Number.isInteger(id) || id < 1) { setError('Consulta no válida.'); return; }
    let vigente = true;
    consultaDetalleService.obtener(id)
      .then(async datos => {
        // Edad y sexo vienen de la ficha; si falla, la consulta se muestra igual.
        const ficha = await pacienteService.buscarPacientePorDNI(datos.DNI).then(r => r.data).catch(() => null);
        if (!vigente) return;
        setPaciente(ficha);
        setConsulta(datos);
        if (actualizarTitulo) document.title = `Consulta ${formatoFecha(datos.FECHA)} · ${datos.paciente_nombre} · CEINCO`;
      })
      .catch((e: { response?: { status?: number } }) => {
        if (vigente) setError(e.response?.status === 404 ? 'La consulta no existe.' : 'No se pudo cargar la consulta.');
      });
    return () => { vigente = false; };
  }, [idConsulta, actualizarTitulo]);

  const descargar = async (nombre: string): Promise<void> => {
    setDescargando(nombre);
    try {
      const archivo = await consultaService.descargarAdjunto(`/adjuntos/${encodeURIComponent(nombre)}`);
      const url = URL.createObjectURL(archivo);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre.replace(/^[0-9a-f-]{36}-/, '');
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert('No se pudo descargar el archivo.');
    } finally {
      setDescargando(null);
    }
  };

  if (error) {
    return <div className="alert alert-error" role="alert">{error}</div>;
  }
  if (!consulta) {
    return <div className="loading-container"><div className="loading-spinner" /><div className="loading-text">Cargando consulta…</div></div>;
  }

  const doctor = [consulta.doctor_nombre, consulta.doctor_apellido].filter(Boolean).join(' ');
  const sv = consulta.signos_vitales;
  const detallado: Record<string, unknown> | null = (() => {
    const v = consulta.EXAMEN_FISICO_DETALLADO;
    if (!v) return null;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch { return null; }
  })();
  const seccionesExamen = detallado
    ? Object.entries(SECCIONES)
        .map(([clave, titulo]) => {
          const datos = (detallado[clave] ?? {}) as Record<string, string>;
          const filas = Object.entries(datos).filter(([, valor]) => typeof valor === 'string' && valor.trim());
          return { titulo, filas };
        })
        .filter(s => s.filas.length)
    : [];
  const observacionesExamen = typeof detallado?.observaciones === 'string' ? detallado.observaciones : '';
  const principal = consulta.diagnosticos.filter(d => d.TIPO.toLowerCase() === 'principal');
  const secundarios = consulta.diagnosticos.filter(d => d.TIPO.toLowerCase() !== 'principal');
  const anios = edad(paciente?.FECHA_NACIMIENTO);
  const sexo = paciente?.SEXO === 'F' ? 'Femenino' : paciente?.SEXO === 'M' ? 'Masculino' : null;

  const signos: Array<[string, string]> = sv ? [
    ['Presión arterial', sv.PA ? `${sv.PA} mmHg` : '—'],
    ['Pulso', sv.PULSO ? `${sv.PULSO} lpm` : '—'],
    ['Frecuencia respiratoria', sv.FR ? `${sv.FR} rpm` : '—'],
    ['Saturación O₂', sv.SAO2 ? `${numero(sv.SAO2, 0)} %` : '—'],
    ['Temperatura', sv.TEMPERATURA ? `${numero(sv.TEMPERATURA)} °C` : '—'],
    ['Peso', sv.PESO ? `${numero(sv.PESO)} kg` : '—'],
    ['Talla', sv.TALLA ? `${numero(sv.TALLA, 2)} m` : '—'],
    ['IMC', sv.IMC ? numero(sv.IMC) : '—']
  ] : [];

  return (
      <article className="doc">
        <header className="doc-header">
          <div className="doc-brand">
            <img src="/logo.png" alt="" />
            <div>
              <strong>CEINCO</strong>
              <span>Registro de consulta médica</span>
            </div>
          </div>
          <div className="doc-meta">
            <span className={`badge ${consulta.ES_PRIMERA_CONSULTA ? 'badge-primary' : 'badge-neutral'}`}>
              {consulta.ES_PRIMERA_CONSULTA ? 'Primera consulta' : 'Control'}
            </span>
            <span>Consulta N.º <strong className="mono">{consulta.ID_CONSULTA}</strong></span>
          </div>
        </header>

        <section className="doc-section doc-resumen">
          <div className="data-item"><dt>Paciente</dt><dd className="strong">{consulta.paciente_nombre}</dd></div>
          <div className="data-item"><dt>DNI</dt><dd className="mono">{consulta.DNI}</dd></div>
          <div className="data-item"><dt>Edad / sexo</dt><dd>{[anios !== null ? `${anios} años` : null, sexo].filter(Boolean).join(' · ') || '—'}</dd></div>
          <div className="data-item"><dt>Fecha</dt><dd>{formatoFechaLarga(consulta.FECHA)}{hora(consulta.FECHA) && ` · ${hora(consulta.FECHA)}`}</dd></div>
          <div className="data-item"><dt>Médico tratante</dt><dd>{doctor ? `Dr(a). ${doctor}` : '—'}</dd></div>
          <div className="data-item"><dt>Estado</dt><dd className="capitalize">{consulta.ESTADO}</dd></div>
        </section>

        <section className="doc-section">
          <h2 className="doc-title">Signos vitales</h2>
          {signos.length ? (
            <dl className="doc-signos">
              {signos.map(([etiqueta, valor]) => (
                <div key={etiqueta}><dt>{etiqueta}</dt><dd>{valor}</dd></div>
              ))}
            </dl>
          ) : <p className="text-muted">No se registraron signos vitales.</p>}
        </section>

        <section className="doc-section">
          <h2 className="doc-title">Relato / motivo de consulta</h2>
          <p className="doc-texto">{consulta.RELATO || <span className="text-muted">Sin relato registrado.</span>}</p>
        </section>

        <section className="doc-section">
          <h2 className="doc-title">Examen físico</h2>
          {consulta.EXAMEN_FISICO_SIMPLIFICADO && <p className="doc-texto">{consulta.EXAMEN_FISICO_SIMPLIFICADO}</p>}
          {seccionesExamen.length > 0 && (
            <div className="doc-examen">
              {seccionesExamen.map(s => (
                <div key={s.titulo} className="doc-examen-seccion">
                  <h3>{s.titulo}</h3>
                  <dl>
                    {s.filas.map(([campo, valor]) => (
                      <div key={campo}><dt>{CAMPOS[campo] ?? campo}</dt><dd>{valor}</dd></div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
          {observacionesExamen && <p className="doc-texto"><strong>Observaciones:</strong> {observacionesExamen}</p>}
          {!consulta.EXAMEN_FISICO_SIMPLIFICADO && !seccionesExamen.length && !observacionesExamen && (
            <p className="text-muted">No se registró examen físico.</p>
          )}
        </section>

        <section className="doc-section">
          <h2 className="doc-title">Diagnósticos (CIE-10)</h2>
          {consulta.diagnosticos.length ? (
            <table className="table doc-tabla">
              <thead><tr><th>Tipo</th><th>Código</th><th>Descripción</th><th>Observaciones</th></tr></thead>
              <tbody>
                {[...principal, ...secundarios].map(d => (
                  <tr key={d.ID_DIAGNOSTICO}>
                    <td><span className={`badge ${d.TIPO.toLowerCase() === 'principal' ? 'badge-primary' : 'badge-neutral'}`}>{d.TIPO}</span></td>
                    <td className="mono strong">{d.CODIGO}</td>
                    <td>{d.DESCRIPCION}</td>
                    <td className="text-muted">{d.OBSERVACIONES || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-muted">Sin diagnósticos registrados.</p>}
        </section>

        <section className="doc-section">
          <h2 className="doc-title">Receta</h2>
          {consulta.receta && consulta.receta.medicamentos.length ? (
            <>
              <table className="table doc-tabla">
                <thead><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Duración</th></tr></thead>
                <tbody>
                  {consulta.receta.medicamentos.map(m => (
                    <tr key={m.id_detalle}>
                      <td className="strong">{m.medicamento}{m.concentracion ? ` ${m.concentracion}` : ''}</td>
                      <td>{m.dosis || '—'}</td>
                      <td>{m.frecuencia || '—'}</td>
                      <td>{m.duracion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {consulta.receta.INDICACIONES_GENERALES && (
                <p className="doc-texto"><strong>Indicaciones:</strong> {consulta.receta.INDICACIONES_GENERALES}</p>
              )}
            </>
          ) : <p className="text-muted">No se emitió receta.</p>}
        </section>

        <section className="doc-section">
          <h2 className="doc-title">Exámenes auxiliares</h2>
          {consulta.examenes_auxiliares.length ? (
            <table className="table doc-tabla">
              <thead><tr><th>Examen</th><th>Tipo</th><th>Resultados</th><th>Fecha</th><th className="no-print">Archivo</th></tr></thead>
              <tbody>
                {consulta.examenes_auxiliares.map(e => (
                  <tr key={e.ID_EXAMENESAUX}>
                    <td>
                      <div className="strong">{e.NOMBRE_EXAMEN || e.TIPO_EXAMEN}</div>
                      {e.DESCRIPCION && <div className="text-muted">{e.DESCRIPCION}</div>}
                    </td>
                    <td>{e.TIPO_EXAMEN}</td>
                    <td>{e.RESULTADOS || <span className="text-muted">Pendiente</span>}</td>
                    <td className="nowrap">{formatoFecha(e.FECHA_REGISTRO)}</td>
                    <td className="no-print">
                      {e.IMAGEN_DOC ? (
                        <button className="archivo-link" onClick={() => descargar(e.IMAGEN_DOC!)} disabled={descargando === e.IMAGEN_DOC}>
                          {descargando === e.IMAGEN_DOC ? 'Descargando…' : 'Descargar'}
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-muted">No se solicitaron exámenes.</p>}
        </section>

        <section className="doc-section">
          <h2 className="doc-title">Plan de trabajo</h2>
          <p className="doc-texto">{consulta.PLAN_TRABAJO || <span className="text-muted">Sin plan registrado.</span>}</p>
        </section>

        <footer className="doc-footer">
          <div className="doc-firma">
            <span />
            <small>{doctor ? `Dr(a). ${doctor}` : 'Médico tratante'}</small>
          </div>
          <small className="text-muted">
            Generado el {new Date().toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })}
          </small>
        </footer>
      </article>
  );
};

// Página independiente (enlace directo o impresión)
const ConsultaDetalle: React.FC = () => {
  const { idConsulta } = useParams();
  const [verReceta, setVerReceta] = useState(false);
  return (
    <div className="consulta-doc">
      <div className="doc-toolbar no-print">
        <a className="btn btn-ghost btn-sm" href="/pacientes">Ir a Pacientes</a>
        <button className="btn btn-outline btn-sm" onClick={() => setVerReceta(true)}>Ver receta</button>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Imprimir</button>
      </div>
      <ConsultaDocumento idConsulta={Number(idConsulta)} actualizarTitulo />
      {verReceta && <RecetaVisorModal idConsulta={Number(idConsulta)} onClose={() => setVerReceta(false)} />}
    </div>
  );
};

export default ConsultaDetalle;
