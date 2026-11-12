import React, { useEffect, useState } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export function usePaginacion<T>(items: T[], porPagina = 15) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina));
  // Si la lista cambia (búsqueda, filtros) y la página ya no existe, volver al inicio.
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1);
  }, [pagina, totalPaginas]);
  const actual = Math.min(pagina, totalPaginas);
  return {
    pagina: actual,
    totalPaginas,
    setPagina,
    visibles: items.slice((actual - 1) * porPagina, actual * porPagina),
    desde: items.length ? (actual - 1) * porPagina + 1 : 0,
    hasta: Math.min(actual * porPagina, items.length),
    total: items.length
  };
}

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  desde: number;
  hasta: number;
  total: number;
  onCambiar: (pagina: number) => void;
}

const Paginacion: React.FC<PaginacionProps> = ({ pagina, totalPaginas, desde, hasta, total, onCambiar }) => {
  if (total === 0) return null;
  return (
    <nav className="paginacion" aria-label="Paginación">
      <span className="paginacion-info">{desde}–{hasta} de {total}</span>
      {totalPaginas > 1 && (
        <div className="paginacion-botones">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onCambiar(pagina - 1)} disabled={pagina === 1}>
            ‹ Anterior
          </button>
          <span className="paginacion-actual">Página {pagina} de {totalPaginas}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onCambiar(pagina + 1)} disabled={pagina === totalPaginas}>
            Siguiente ›
          </button>
        </div>
      )}
    </nav>
  );
};

export default Paginacion;
