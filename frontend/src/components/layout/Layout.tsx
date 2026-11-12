import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useModoAdmin, type ModoAdmin } from '../../context/ModoAdminContext';
import { EVENTO_ESCRITURA_BLOQUEADA, MENSAJE_MODO_LECTURA } from '../../services/apiService';

// Barra superior solo para el administrador: alterna entre ver los datos (lectura) y modificarlos (editor).
const BarraModoAdmin: React.FC = () => {
  const { modo, setModo } = useModoAdmin();
  const [aviso, setAviso] = useState(false);

  useEffect(() => {
    let temporizador: number | undefined;
    const mostrar = (): void => {
      setAviso(true);
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(() => setAviso(false), 4000);
    };
    window.addEventListener(EVENTO_ESCRITURA_BLOQUEADA, mostrar);
    return () => { window.removeEventListener(EVENTO_ESCRITURA_BLOQUEADA, mostrar); window.clearTimeout(temporizador); };
  }, []);

  const opciones: Array<{ valor: ModoAdmin; texto: string; titulo: string }> = [
    { valor: 'editor', texto: 'Editor', titulo: 'Puede crear, editar y eliminar en todo el sistema' },
    { valor: 'lectura', texto: 'Lectura', titulo: 'Ver los datos sin poder modificarlos' },
    { valor: 'doctor', texto: 'Ver como doctor', titulo: 'Ver la app tal como la ve un doctor (solo lectura)' },
    { valor: 'asistente', texto: 'Ver como asistente', titulo: 'Ver la app tal como la ve un asistente (solo lectura)' }
  ];
  const descripcion: Record<ModoAdmin, string> = {
    editor: 'Modo editor',
    lectura: 'Modo lectura · no se guardan cambios',
    doctor: 'Viendo como doctor · solo lectura',
    asistente: 'Viendo como asistente · solo lectura'
  };

  return (
    <div className={`modo-admin-barra ${modo !== 'editor' ? 'es-lectura' : ''}`}>
      <span className="modo-admin-texto">{descripcion[modo]}</span>
      <div className="modo-admin-switch" role="group" aria-label="Modo de trabajo del administrador">
        {opciones.map(opcion => (
          <button key={opcion.valor} type="button" title={opcion.titulo} aria-pressed={modo === opcion.valor}
            className={modo === opcion.valor ? 'activo' : ''} onClick={() => setModo(opcion.valor)}>
            {opcion.texto}
          </button>
        ))}
      </div>
      {aviso && <div className="modo-admin-aviso" role="alert">{MENSAJE_MODO_LECTURA}</div>}
    </div>
  );
};

const Layout: React.FC = () => {
  const { esAdmin } = useModoAdmin();
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        {esAdmin && <BarraModoAdmin />}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
