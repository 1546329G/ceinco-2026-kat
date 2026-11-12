import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { recetaService } from '../../services/apiService';

interface Props {
  idConsulta: number;
  onClose: () => void;
}

// Muestra el PDF de la receta dentro de la misma página (sin abrir otra pestaña), con Descargar e Imprimir.
const RecetaVisorModal: React.FC<Props> = ({ idConsulta, onClose }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const marco = useRef<HTMLIFrameElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let vigente = true;
    let creada: string | null = null;
    recetaService.obtenerPdf(idConsulta)
      .then(pdf => {
        if (!vigente) return;
        creada = URL.createObjectURL(pdf);
        setUrl(creada);
      })
      .catch((e: { response?: { status?: number } }) => {
        if (vigente) setError(e.response?.status === 404 ? 'Esta consulta no tiene receta registrada.' : 'No se pudo generar la receta.');
      });
    return () => { vigente = false; if (creada) URL.revokeObjectURL(creada); };
  }, [idConsulta]);

  useEffect(() => {
    // Si ya hay otra ventana abierta (historial), no se le quita el bloqueo de scroll al cerrar.
    const yaBloqueado = document.body.classList.contains('con-modal-consulta');
    document.body.classList.add('con-modal-consulta');
    cerrarRef.current?.focus();
    const alPulsar = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alPulsar);
    return () => {
      if (!yaBloqueado) document.body.classList.remove('con-modal-consulta');
      window.removeEventListener('keydown', alPulsar);
    };
  }, [onClose]);

  const imprimir = (): void => {
    try {
      marco.current?.contentWindow?.focus();
      marco.current?.contentWindow?.print();
    } catch {
      window.alert('Su navegador no permite imprimir desde el visor. Use Descargar y luego imprima el archivo.');
    }
  };

  return createPortal(
    <div className="consulta-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="consulta-modal receta-visor" role="dialog" aria-modal="true" aria-label="Receta médica">
        <div className="consulta-modal-barra">
          <strong>Receta médica</strong>
          <div className="consulta-modal-acciones">
            {url && (
              <>
                <a className="btn btn-secondary btn-sm" href={url} download={`receta-consulta-${idConsulta}.pdf`}>Descargar</a>
                <button type="button" className="btn btn-secondary btn-sm" onClick={imprimir}>Imprimir</button>
              </>
            )}
            <button ref={cerrarRef} type="button" className="btn btn-primary btn-sm" onClick={onClose}>Cerrar</button>
          </div>
        </div>
        <div className="receta-visor-cuerpo">
          {error ? <div className="alert alert-error" role="alert">{error}</div>
            : url ? <iframe ref={marco} src={url} title="Receta en PDF" className="receta-visor-pdf" />
            : <div className="loading-container"><div className="loading-spinner" /><div className="loading-text">Generando receta…</div></div>}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecetaVisorModal;
