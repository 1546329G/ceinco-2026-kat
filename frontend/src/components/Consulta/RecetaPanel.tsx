import React, { useEffect, useState } from 'react';
import {
  consultaDetalleService, recetaService, type LineaReceta, type MedicamentoCatalogo
} from '../../services/apiService';
import RecetaVisorModal from './RecetaVisorModal';

interface RecetaPanelProps {
  consultationId: number;
}

type Fila = LineaReceta & { clave: number };

let siguienteClave = 1;
const filaVacia = (): Fila => ({ clave: siguienteClave++, id_medicamento: 0, dosis: '', frecuencia: '', duracion: '' });

const FRECUENCIAS = ['Cada 4 horas', 'Cada 6 horas', 'Cada 8 horas', 'Cada 12 horas', 'Cada 24 horas', 'Antes de dormir', 'Condicional al dolor'];
const DURACIONES = ['3 días', '5 días', '7 días', '10 días', '14 días', '1 mes', 'Uso continuo'];

const descripcion = (m: MedicamentoCatalogo): string =>
  [m.NOMBRE, m.CONCENTRACION, m.FORMA_FARMACEUTICA && `(${m.FORMA_FARMACEUTICA})`].filter(Boolean).join(' ');

const mensajeError = (err: unknown, porDefecto: string): string =>
  (err as { response?: { data?: { error?: string } } }).response?.data?.error || porDefecto;

// Receta de la consulta: medicamentos del catálogo con dosis, frecuencia y duración, más indicaciones generales.
const RecetaPanel: React.FC<RecetaPanelProps> = ({ consultationId }) => {
  const [catalogo, setCatalogo] = useState<MedicamentoCatalogo[]>([]);
  const [filas, setFilas] = useState<Fila[]>([filaVacia()]);
  const [indicaciones, setIndicaciones] = useState('');
  const [guardada, setGuardada] = useState(false);
  const [cambiosSinGuardar, setCambiosSinGuardar] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [verPdf, setVerPdf] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    Promise.all([recetaService.obtenerMedicamentos(), consultaDetalleService.obtener(consultationId)])
      .then(([medicamentos, consulta]) => {
        if (!vigente) return;
        setCatalogo(medicamentos);
        const receta = consulta.receta;
        if (receta && receta.medicamentos.length) {
          setFilas(receta.medicamentos.map(m => ({
            clave: siguienteClave++, id_medicamento: m.id_medicamento ?? 0,
            dosis: m.dosis ?? '', frecuencia: m.frecuencia ?? '', duracion: m.duracion ?? ''
          })));
          setIndicaciones(receta.INDICACIONES_GENERALES ?? '');
          setGuardada(true);
        }
      })
      .catch(() => { if (vigente) setError('No se pudo cargar el catálogo de medicamentos o la receta.'); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [consultationId]);

  const cambiarFila = (clave: number, campo: keyof LineaReceta, valor: string): void => {
    setFilas(prev => prev.map(f => (f.clave === clave
      ? { ...f, [campo]: campo === 'id_medicamento' ? Number(valor) : valor }
      : f)));
    setCambiosSinGuardar(true);
    setExito('');
  };

  const quitarFila = (clave: number): void => {
    setFilas(prev => (prev.length > 1 ? prev.filter(f => f.clave !== clave) : [filaVacia()]));
    setCambiosSinGuardar(true);
  };

  const guardar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setExito('');
    const completas = filas.filter(f => f.id_medicamento > 0);
    if (!completas.length) {
      setError('Agregue al menos un medicamento a la receta.');
      return;
    }
    if (completas.some(f => !f.dosis.trim() || !f.frecuencia.trim() || !f.duracion.trim())) {
      setError('Complete dosis, frecuencia y duración de cada medicamento.');
      return;
    }
    setGuardando(true);
    try {
      await recetaService.guardar(consultationId, {
        indicaciones,
        medicamentos: completas.map(({ id_medicamento, dosis, frecuencia, duracion }) => ({ id_medicamento, dosis, frecuencia, duracion }))
      });
      setFilas(completas);
      setGuardada(true);
      setCambiosSinGuardar(false);
      setExito('Receta guardada. Ya puede imprimirla.');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar la receta.'));
    } finally {
      setGuardando(false);
    }
  };

  const imprimir = (): void => setVerPdf(true);

  if (cargando) {
    return <div className="alert alert-info"><div className="loading-spinner"></div>Cargando receta...</div>;
  }

  return (
    <form className="receta-panel" onSubmit={guardar}>
      <div className="form-header">
        <h3 className="form-title">Receta médica</h3>
        <p className="form-subtitle">Prescriba los medicamentos del catálogo y luego imprima la receta para el paciente.</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {exito && <div className="alert alert-success" role="status">{exito}</div>}

      <div className="receta-filas">
        <div className="receta-fila receta-encabezado" aria-hidden="true">
          <span>Medicamento</span><span>Dosis</span><span>Frecuencia</span><span>Duración</span><span />
        </div>
        {filas.map((fila, indice) => (
          <div className="receta-fila" key={fila.clave}>
            <select className="form-select" value={fila.id_medicamento || ''} disabled={guardando}
              aria-label={`Medicamento ${indice + 1}`} onChange={e => cambiarFila(fila.clave, 'id_medicamento', e.target.value)}>
              <option value="">Seleccionar medicamento…</option>
              {catalogo.map(m => <option key={m.ID_MEDICAMENTO} value={m.ID_MEDICAMENTO}>{descripcion(m)}</option>)}
            </select>
            <input className="form-input" value={fila.dosis} maxLength={100} placeholder="Ej: 1 tableta" disabled={guardando}
              aria-label={`Dosis ${indice + 1}`} onChange={e => cambiarFila(fila.clave, 'dosis', e.target.value)} />
            <input className="form-input" value={fila.frecuencia} maxLength={100} placeholder="Ej: Cada 8 horas" disabled={guardando}
              list="receta-frecuencias" aria-label={`Frecuencia ${indice + 1}`} onChange={e => cambiarFila(fila.clave, 'frecuencia', e.target.value)} />
            <input className="form-input" value={fila.duracion} maxLength={100} placeholder="Ej: 7 días" disabled={guardando}
              list="receta-duraciones" aria-label={`Duración ${indice + 1}`} onChange={e => cambiarFila(fila.clave, 'duracion', e.target.value)} />
            <button type="button" className="btn btn-sm btn-danger-soft" onClick={() => quitarFila(fila.clave)} disabled={guardando}
              aria-label={`Quitar medicamento ${indice + 1}`} title="Quitar">✕</button>
          </div>
        ))}
        <datalist id="receta-frecuencias">{FRECUENCIAS.map(f => <option key={f} value={f} />)}</datalist>
        <datalist id="receta-duraciones">{DURACIONES.map(d => <option key={d} value={d} />)}</datalist>
        <div>
          <button type="button" className="btn btn-sm btn-outline" disabled={guardando || filas.length >= 20}
            onClick={() => { setFilas(prev => [...prev, filaVacia()]); setCambiosSinGuardar(true); }}>
            + Agregar medicamento
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="receta-indicaciones" className="form-label">Indicaciones generales</label>
        <textarea id="receta-indicaciones" className="form-textarea" rows={3} maxLength={4000} value={indicaciones} disabled={guardando}
          placeholder="Ej: Tomar después de los alimentos. Abundantes líquidos. Control en 7 días."
          onChange={e => { setIndicaciones(e.target.value); setCambiosSinGuardar(true); setExito(''); }} />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={guardando}>
          {guardando ? 'Guardando…' : guardada ? 'Actualizar receta' : 'Guardar receta'}
        </button>
        <button type="button" className="btn btn-outline" onClick={imprimir} disabled={!guardada || cambiosSinGuardar || guardando}
          title={!guardada ? 'Guarde la receta para imprimirla' : cambiosSinGuardar ? 'Guarde los cambios antes de imprimir' : 'Imprimir receta'}>
          🖨 Ver / imprimir receta
        </button>
        {guardada && cambiosSinGuardar && <span className="text-muted">Hay cambios sin guardar</span>}
      </div>
      {verPdf && <RecetaVisorModal idConsulta={consultationId} onClose={() => setVerPdf(false)} />}
    </form>
  );
};

export default RecetaPanel;
