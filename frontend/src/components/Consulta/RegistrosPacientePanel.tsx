import React, { useEffect, useState } from 'react';
import { antecedentesService, consultaService } from '../../services/apiService';
import type { AntecedentesRegistradosResponse, SignosVitalesRegistrados } from '../../types/models';

interface Props {
  patientDni: string;
  idFichaClinica: number | null;
  // Cambia cuando se registran signos o antecedentes para volver a cargar.
  refreshKey: string;
}

const SECCIONES: Record<string, { titulo: string; campos: Record<string, string> }> = {
  enfermedadActual: {
    titulo: 'Enfermedad actual',
    campos: { tiempoEnfermedad: 'Tiempo de enfermedad', relato: 'Relato' }
  },
  factoresRiesgo: {
    titulo: 'Factores de riesgo',
    campos: {
      tabaquismo: 'Tabaquismo', hipertension: 'Hipertensión', diabetes: 'Diabetes', dislipidemia: 'Dislipidemia',
      edadFactor: 'Edad', obesidad: 'Obesidad', historiaFamiliar: 'Historia familiar', sedentarismo: 'Sedentarismo',
      estres: 'Estrés', dietaAterogenica: 'Dieta aterogénica', hiperurisemia: 'Hiperuricemia',
      personalidadTipoA: 'Personalidad tipo A', cantidadTabaco: 'Cantidad de tabaco', tiempoTabaco: 'Tiempo de tabaquismo'
    }
  },
  cardiovascular: {
    titulo: 'Antecedentes cardiovasculares',
    campos: {
      infartoMiocardio: 'Infarto de miocardio', valvulopatia: 'Valvulopatía', cardiopatiaCongenita: 'Cardiopatía congénita',
      fiebreReumaticaSecuelas: 'Fiebre reumática / secuelas', arritmias: 'Arritmias',
      enfermedadArterialPeriferica: 'Enfermedad arterial periférica', ultimaHospitalizacion: 'Última hospitalización',
      dxHospitalizacion: 'Diagnóstico de hospitalización', intervencionQxPciFecha: 'Intervención Qx / PCI (fecha)',
      cateterismoFecha: 'Cateterismo (fecha)', medicacionHabitual: 'Medicación habitual'
    }
  },
  patologicos: {
    titulo: 'Antecedentes patológicos',
    campos: {
      respiratorio: 'Respiratorio', gastrointestinal: 'Gastrointestinal', genitourinario: 'Genitourinario',
      neurologico: 'Neurológico', locomotor: 'Locomotor', hematologico: 'Hematológico', alergias: 'Alergias',
      cirugiasPrevias: 'Cirugías previas'
    }
  },
  sintomas: {
    titulo: 'Síntomas',
    campos: {
      angina: 'Angina', disnea: 'Disnea', palpitaciones: 'Palpitaciones', sincope: 'Síncope', cianosis: 'Cianosis',
      edemas: 'Edemas', ortopnea: 'Ortopnea', fiebre: 'Fiebre', claudicacionIntermitente: 'Claudicación intermitente',
      otros: 'Otros'
    }
  }
};

const nombreCampoPrevio = (campo: string): string => {
  const texto = campo.replace(/^ANTECEDENTES_/, '').replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const formatearFecha = (fecha?: string | null): string =>
  fecha ? new Date(fecha).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : '';

const filaStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', gap: '1rem',
  padding: '0.4rem 0', borderBottom: '1px solid #e5e7eb'
};
const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem'
};
const datoStyle: React.CSSProperties = {
  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.6rem 0.8rem'
};

export const SignosVitalesDetalle: React.FC<{ signos: SignosVitalesRegistrados }> = ({ signos }) => {
  const imc = signos.peso && signos.talla ? (signos.peso / (signos.talla * signos.talla)).toFixed(2) : null;
  const datos: Array<[string, string | number | null | undefined]> = [
    ['Presión arterial', signos.pa && `${signos.pa} mmHg`],
    ['Pulso', signos.pulso && `${signos.pulso} lpm${signos.tipoPulso ? ` (${signos.tipoPulso})` : ''}`],
    ['Saturación O₂', signos.sao2 != null ? `${signos.sao2} %` : null],
    ['Frecuencia respiratoria', signos.fr != null ? `${signos.fr} rpm` : null],
    ['Temperatura', signos.temperatura != null ? `${signos.temperatura} °C` : null],
    ['Peso', signos.peso && `${signos.peso} kg`],
    ['Talla', signos.talla && `${signos.talla} m`],
    ['IMC', imc]
  ];
  return (
    <>
      <div style={gridStyle}>
        {datos.filter(([, valor]) => valor != null && valor !== '').map(([label, valor]) => (
          <div key={label} style={datoStyle}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{valor}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
        Registrado {formatearFecha(signos.fechaRegistro)}
        {signos.registradoPor ? ` por ${signos.registradoPor}` : ''}
      </p>
    </>
  );
};

const AntecedentesDetalle: React.FC<{ antecedentes: AntecedentesRegistradosResponse }> = ({ antecedentes }) => {
  const datos = (antecedentes.datos ?? {}) as Record<string, Record<string, unknown> | undefined>;
  const secciones = Object.entries(SECCIONES).map(([clave, { titulo, campos }]) => {
    const valores = datos[clave] ?? {};
    const marcados = Object.entries(campos).filter(([campo]) => valores[campo] === true).map(([, label]) => label);
    const textos = Object.entries(campos)
      .filter(([campo]) => typeof valores[campo] === 'string' && (valores[campo] as string).trim())
      .map(([campo, label]) => [label, valores[campo] as string]);
    return { clave, titulo, marcados, textos };
  }).filter(seccion => seccion.marcados.length || seccion.textos.length);
  const previos = Object.entries(antecedentes.registrosPrevios ?? {});

  if (!secciones.length && !previos.length) {
    return <p style={{ color: '#64748b' }}>Los antecedentes se registraron sin hallazgos positivos.</p>;
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {secciones.map(seccion => (
        <div key={seccion.clave}>
          <h5 style={{ fontWeight: 600, color: '#132f6b', marginBottom: '0.4rem' }}>{seccion.titulo}</h5>
          {seccion.marcados.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
              {seccion.marcados.map(label => (
                <span key={label} style={{ background: '#dbeafe', color: '#1e3a8a', borderRadius: 999, padding: '0.15rem 0.6rem', fontSize: '0.85rem' }}>
                  {label}
                </span>
              ))}
            </div>
          )}
          {seccion.textos.map(([label, valor]) => (
            <div key={label} style={filaStyle}>
              <span style={{ color: '#64748b' }}>{label}</span>
              <span style={{ color: '#1e293b', textAlign: 'right', whiteSpace: 'pre-wrap' }}>{valor}</span>
            </div>
          ))}
        </div>
      ))}
      {previos.length > 0 && (
        <div>
          <h5 style={{ fontWeight: 600, color: '#132f6b', marginBottom: '0.4rem' }}>Registros anteriores</h5>
          {previos.map(([campo, valor]) => (
            <div key={campo} style={filaStyle}>
              <span style={{ color: '#64748b' }}>{nombreCampoPrevio(campo)}</span>
              <span style={{ color: '#1e293b', textAlign: 'right', whiteSpace: 'pre-wrap' }}>{valor}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RegistrosPacientePanel: React.FC<Props> = ({ patientDni, idFichaClinica, refreshKey }) => {
  const [signos, setSignos] = useState<SignosVitalesRegistrados | null>(null);
  const [antecedentes, setAntecedentes] = useState<AntecedentesRegistradosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    const cargar = async (): Promise<void> => {
      setLoading(true);
      setError('');
      try {
        const [signosHoy, antecedentesRes] = await Promise.all([
          idFichaClinica ? consultaService.verificarSignosVitalesHoy(idFichaClinica) : Promise.resolve(null),
          antecedentesService.obtenerAntecedentes(patientDni)
        ]);
        if (!activo) return;
        setSignos(signosHoy?.signos ?? null);
        setAntecedentes(antecedentesRes);
      } catch {
        if (activo) setError('No se pudieron cargar los registros del paciente.');
      } finally {
        if (activo) setLoading(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, [patientDni, idFichaClinica, refreshKey]);

  return (
    <div className="status-panel">
      <h3 className="status-title">Registros del Paciente</h3>
      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>Cargando registros...</p>
      ) : error ? (
        <p role="alert" style={{ textAlign: 'center', color: '#b91c1c' }}>{error}</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>Signos vitales de hoy</h4>
            {signos ? <SignosVitalesDetalle signos={signos} /> : (
              <p style={{ color: '#64748b' }}>Aún no se registran signos vitales hoy.</p>
            )}
          </section>
          <section>
            <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>
              Antecedentes médicos
              {antecedentes?.fechaRegistro && (
                <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#64748b' }}>
                  {' '}· {formatearFecha(antecedentes.fechaRegistro)}
                </span>
              )}
            </h4>
            {antecedentes?.tieneAntecedentes ? <AntecedentesDetalle antecedentes={antecedentes} /> : (
              <p style={{ color: '#64748b' }}>El paciente aún no tiene antecedentes registrados.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default RegistrosPacientePanel;
