import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { setModoLecturaApi } from '../services/apiService';
import type { CargoUsuario } from '../types/models';

// editor: el admin modifica todo. lectura: el admin ve sus pantallas sin poder cambiar nada.
// doctor / asistente: el admin observa la app tal como la ve ese rol, también sin poder cambiar nada.
export type ModoAdmin = 'editor' | 'lectura' | 'doctor' | 'asistente';

interface ModoAdminContextType {
  esAdmin: boolean;
  modo: ModoAdmin;
  setModo: (modo: ModoAdmin) => void;
  // Bloquea cualquier escritura en la API (todo modo distinto de editor).
  soloLectura: boolean;
  // Oculta los botones de edición (solo en modo lectura del propio admin).
  ocultarEdicion: boolean;
  // Rol con el que se dibuja la interfaz (menú, rutas y pantallas).
  cargoVista: CargoUsuario | null;
}

const ModoAdminContext = createContext<ModoAdminContextType | undefined>(undefined);
const CLAVE = 'modoAdmin';
const MODOS: ModoAdmin[] = ['editor', 'lectura', 'doctor', 'asistente'];

const leerModo = (): ModoAdmin => {
  try {
    const valor = localStorage.getItem(CLAVE) as ModoAdmin | null;
    return valor && MODOS.includes(valor) ? valor : 'editor';
  } catch {
    return 'editor';
  }
};

export const ModoAdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { cargo } = useAuth();
  const [modo, setModoState] = useState<ModoAdmin>(leerModo);
  const esAdmin = cargo === 'administrador';
  const soloLectura = esAdmin && modo !== 'editor';
  const ocultarEdicion = esAdmin && modo === 'lectura';
  const cargoVista: CargoUsuario | null = esAdmin && (modo === 'doctor' || modo === 'asistente') ? modo : cargo;

  useEffect(() => {
    setModoLecturaApi(soloLectura);
  }, [soloLectura]);

  const setModo = (nuevo: ModoAdmin): void => {
    setModoState(nuevo);
    try { localStorage.setItem(CLAVE, nuevo); } catch { /* sin almacenamiento: solo dura la sesión */ }
  };

  return (
    <ModoAdminContext.Provider value={{ esAdmin, modo, setModo, soloLectura, ocultarEdicion, cargoVista }}>
      {children}
    </ModoAdminContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useModoAdmin = (): ModoAdminContextType => {
  const context = useContext(ModoAdminContext);
  if (!context) throw new Error('useModoAdmin debe usarse dentro de ModoAdminProvider');
  return context;
};
