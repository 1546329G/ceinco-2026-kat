import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/apiService';
import type { LoginData, ApiError, ValidationErrors } from '../types/models';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    contrasena: ''
  });
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Ingrese un correo electrónico válido';
    }

    if (!formData.contrasena || formData.contrasena.length < 6) {
      errors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ ...formData, email: formData.email.trim().toLowerCase() });
      await login(response.token, response.cargo);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const apiError = err as ApiError;
      let errorMessage = 'Error al iniciar sesión';

      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError.message) {
        errorMessage = apiError.message;
      } else {
        errorMessage = 'Error al iniciar sesión. Verifique sus credenciales.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="" />
          <h1 className="login-title">
            CEINCO
          </h1>
          <p className="login-subtitle">
            Sistema de Historial Clínico
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="nombre@correo.com"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              disabled={loading}
            />
            {validationErrors.email && (
              <p className="validation-error">{validationErrors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contrasena" className="form-label">
              Contraseña
            </label>
            <div className="password-wrapper">
              <input
                id="contrasena"
                name="contrasena"
                type={showPassword ? 'text' : 'password'}
                value={formData.contrasena}
                onChange={handleChange}
                required
                className={`form-input password-input ${validationErrors.contrasena ? 'error' : ''}`}
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={loading}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {validationErrors.contrasena && (
              <p className="validation-error">{validationErrors.contrasena}</p>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Iniciando Sesión' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;