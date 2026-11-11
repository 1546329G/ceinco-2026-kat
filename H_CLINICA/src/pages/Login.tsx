import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/apiService';
import type { LoginData, ApiError, ValidationErrors } from '../types/models';
import '../styles/login.css';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({
    dni: '',
    contrasena: ''
  });
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.dni || formData.dni.length !== 8) {
      errors.dni = 'El DNI debe tener 8 dígitos';
    }

    if (!formData.contrasena || formData.contrasena.length < 6) {
      errors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    const cleanedValue = name === 'dni' ? value.replace(/\D/g, '') : value;

    setFormData(prev => ({
      ...prev,
      [name]: cleanedValue
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
      const response = await authService.login(formData as LoginData);
      login(response.token, response.cargo);
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
            <label htmlFor="dni" className="form-label">
              DNI
            </label>
            <input
              id="dni"
              name="dni"
              type="text"
              value={formData.dni}
              onChange={handleChange}
              required
              className={`form-input ${validationErrors.dni ? 'error' : ''}`}
              placeholder="Ingrese su DNI"
              maxLength={8}
              inputMode="numeric"
              disabled={loading}
            />
            {validationErrors.dni && (
              <p className="validation-error">{validationErrors.dni}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contrasena" className="form-label">
              Contraseña
            </label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              value={formData.contrasena}
              onChange={handleChange}
              required
              className={`form-input ${validationErrors.contrasena ? 'error' : ''}`}
              placeholder="Ingrese su contraseña"
              minLength={6}
              disabled={loading}
            />
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