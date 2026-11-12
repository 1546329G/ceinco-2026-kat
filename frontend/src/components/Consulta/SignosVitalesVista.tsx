import React, { useEffect, useState } from 'react';
import { consultaService } from '../../services/apiService';
import type { SignosVitalesRegistrados } from '../../types/models';
import { SignosVitalesDetalle } from './RegistrosPacientePanel';

interface SignosVitalesVistaProps {
  idFichaClinica: number | null;
  // Cambia cuando se debe volver a consultar (p. ej. al seleccionar otro paciente).
  refreshKey?: string | number;
  // Se llama cuando aparecen signos registrados para habilitar la consulta.
  onEncontrados?: (idExamenClinico: number) => void;
}

// Vista de solo lectura para el doctor: los signos vitales los registra el asistente.
const SignosVitalesVista: React.FC<SignosVitalesVistaProps> = ({ idFichaClinica, refreshKey, onEncontrados }) => {
  const [signos, setSignos] = useState<SignosVitalesRegistrados | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!idFichaClinica) return;
    let vigente = true;
    setCargando(true);
    setError('');
    consultaService.verificarSignosVitalesHoy(idFichaClinica)
      .then(res => {
        if (!vigente) return;
        setSignos(res.signos ?? null);
        if (res.tieneSignosVitalesHoy && res.idExamenClinico) onEncontrados?.(res.idExamenClinico);
      })
      .catch(() => { if (vigente) setError('No se pudieron cargar los signos vitales.'); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
    // onEncontrados puede recrearse en cada render del padre; solo se vuelve a consultar al cambiar la ficha o al pulsar Actualizar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFichaClinica, refreshKey, recarga]);

  return (
    <div className="vital-signs-form">
      <div className="form-header">
        <h3 className="form-title">Signos Vitales</h3>
        <p className="form-subtitle">Registrados por el asistente en la preconsulta (solo lectura)</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {!error && (cargando || !idFichaClinica) && (
        <div className="alert alert-info"><div className="loading-spinner"></div>Cargando signos vitales...</div>
      )}
      {!error && !cargando && idFichaClinica && (signos ? <SignosVitalesDetalle signos={signos} /> : (
        <div className="alert alert-warning" role="status">
          El asistente aún no registra los signos vitales de hoy. La consulta se habilitará cuando estén registrados.
          <button type="button" className="btn btn-outline" style={{ marginLeft: '0.75rem' }} onClick={() => setRecarga(n => n + 1)}>
            Actualizar
          </button>
        </div>
      ))}
    </div>
  );
};

export default SignosVitalesVista;
