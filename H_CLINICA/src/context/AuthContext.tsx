import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import type { CargoUsuario, User } from '../types/models';
import api, { userService } from '../services/apiService'; 

interface AuthContextType {
  token: string | null;
  cargo: CargoUsuario | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, cargo: CargoUsuario) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [cargo, setCargo] = useState<CargoUsuario | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      const storedToken = localStorage.getItem('token');
      const storedCargo = localStorage.getItem('cargo') as CargoUsuario;
      
      if (storedToken && storedCargo) {
        setToken(storedToken);
        setCargo(storedCargo);
        
        try {
          const userProfile = await userService.getProfile();
          setUser(userProfile);
        } catch (error) {
          console.error('Error cargando perfil de usuario:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('cargo');
          setToken(null);
          setCargo(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const isAuthenticated = !!token;

  const login = (newToken: string, newCargo: CargoUsuario): void => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('cargo', newCargo);
    setToken(newToken);
    setCargo(newCargo);
    
    const loadUserProfile = async (): Promise<void> => {
      try {
        const userProfile = await userService.getProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('Error cargando perfil después de login:', error);
      }
    };
    
    loadUserProfile();
  };

  const logout = async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('cargo');
    setToken(null);
    setCargo(null);
    setUser(null);
  };

  const value: AuthContextType = {
    token,
    cargo,
    user,
    isAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};