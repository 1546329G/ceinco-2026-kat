import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConsultaDocumento } from '../../pages/ConsultaDetalle';
import RecetaVisorModal from '../Consulta/RecetaVisorModal';

interface Props {
  idConsulta: number;
  onClose: () => void;
}

// Ventana emergente en la misma página con la consulta completa.
const ConsultaModal: React.FC<Props> = ({ idConsulta, onClose }) => {
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const [verReceta, setVerReceta] = useState(false);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    document.body.classList.add('con-modal-consulta');
    cerrarRef.current?.focus();
    const alPulsar = (e: KeyboardEvent): void => { if (e.key === 'Escape' && !document.querySelector('.receta-visor')) onClose(); };
    window.addEventListener('keydown', alPulsar);
    return () => {
      document.body.classList.remove('con-modal-consulta');
      window.removeEventListener('keydown', alPulsar);
      anterior?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="consulta-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="consulta-modal" role="dialog" aria-modal="true" aria-label="Consulta completa">
        <div className="consulta-modal-barra no-print">
          <strong>Consulta completa</strong>
          <div className="consulta-modal-acciones">
            <button className="btn btn-secondary btn-sm" onClick={() => setVerReceta(true)}>Ver receta</button>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Imprimir</button>
            <button ref={cerrarRef} className="btn btn-primary btn-sm" onClick={onClose}>Cerrar</button>
          </div>
        </div>
        <div className="consulta-modal-cuerpo">
          <ConsultaDocumento idConsulta={idConsulta} />
        </div>
      </div>
      {verReceta && <RecetaVisorModal idConsulta={idConsulta} onClose={() => setVerReceta(false)} />}
    </div>,
    document.body
  );
};

export default ConsultaModal;
