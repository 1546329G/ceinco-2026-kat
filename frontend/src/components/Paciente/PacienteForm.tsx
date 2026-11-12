import React, { useState } from 'react';
import type { CreatePacienteData } from '../../types/models';

interface PacienteFormProps {
  onSubmit: (data: CreatePacienteData) => Promise<void>;
  onCancel: () => void;
  initialData?: CreatePacienteData;
  isEditing?: boolean;
}

const PacienteForm: React.FC<PacienteFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  isEditing = false 
}) => {
  const [formData, setFormData] = useState<CreatePacienteData>(
    initialData || {
      dni: '',
      nombreApellido: '',
      fechaNacimiento: '',
      edad: undefined,
      sexo: '',
      estadoCivil: '',
      ocupacion: '',
      domicilio: '',
      telefono: '',
      email: '',
      responsable: '',
      institucion: '',
      raza: '',
      nacimiento: '',
      procedencia: ''
    }
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'edad' ? (value ? parseInt(value, 10) : undefined) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dni || formData.dni.length !== 8) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }

    if (!formData.nombreApellido || formData.nombreApellido.trim().length < 3) {
      newErrors.nombreApellido = 'El nombre y apellido son obligatorios (mínimo 3 caracteres)';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del email es inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : `Error al ${isEditing ? 'actualizar' : 'registrar'} el paciente. Por favor, intente nuevamente.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <div className="paciente-form">
      <div className="form-header">
        <h2 className="form-title">
          {isEditing ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}
        </h2>
        <p className="form-subtitle">
          {isEditing ? 'Modifique la información del paciente' : 'Complete la información del paciente'}
        </p>
      </div>

      {submitError && (
        <div className="alert alert-error mb-4">
          <div className="alert-content">
            <p className="alert-message">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-section">
            <h3 className="section-title">Información Básica</h3>
          </div>

          <div className="form-group">
            <label htmlFor="dni" className="form-label">
              DNI *
            </label>
            <input
              id="dni"
              name="dni"
              type="text"
              value={formData.dni}
              onChange={handleChange}
              className={`form-input ${errors.dni ? 'form-input-error' : ''}`}
              placeholder="Ingrese DNI (8 dígitos)"
              maxLength={8}
              pattern="[0-9]{8}"
              required
              disabled={loading || isEditing} // DNI no editable en modo edición
            />
            {errors.dni && <span className="error-message">{errors.dni}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="nombreApellido" className="form-label">
              Nombre y Apellido *
            </label>
            <input
              id="nombreApellido"
              name="nombreApellido"
              type="text"
              value={formData.nombreApellido}
              onChange={handleChange}
              className={`form-input ${errors.nombreApellido ? 'form-input-error' : ''}`}
              placeholder="Nombre completo del paciente"
              required
              disabled={loading}
            />
            {errors.nombreApellido && <span className="error-message">{errors.nombreApellido}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="fechaNacimiento" className="form-label">
              Fecha de Nacimiento
            </label>
            <input
              id="fechaNacimiento"
              name="fechaNacimiento"
              type="date"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edad" className="form-label">
              Edad
            </label>
            <input
              id="edad"
              name="edad"
              type="number"
              value={formData.edad || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="Edad en años"
              min="0"
              max="120"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sexo" className="form-label">
              Sexo
            </label>
            <select
              id="sexo"
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            >
              <option value="">Seleccione sexo</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="estadoCivil" className="form-label">
              Estado Civil
            </label>
            <input
              id="estadoCivil"
              name="estadoCivil"
              type="text"
              value={formData.estadoCivil}
              onChange={handleChange}
              className="form-input"
              placeholder="Ej: Soltero, Casado, etc."
              disabled={loading}
            />
          </div>

          <div className="form-section">
            <h3 className="section-title">Información de Contacto</h3>
          </div>

          <div className="form-group">
            <label htmlFor="telefono" className="form-label">
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
              className="form-input"
              placeholder="Número de teléfono"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="correo@ejemplo.com"
              disabled={loading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group md:col-span-2">
            <label htmlFor="domicilio" className="form-label">
              Domicilio
            </label>
            <input
              id="domicilio"
              name="domicilio"
              type="text"
              value={formData.domicilio}
              onChange={handleChange}
              className="form-input"
              placeholder="Dirección completa"
              disabled={loading}
            />
          </div>

          <div className="form-section">
            <h3 className="section-title">Información Adicional</h3>
          </div>

          <div className="form-group">
            <label htmlFor="ocupacion" className="form-label">
              Ocupación
            </label>
            <input
              id="ocupacion"
              name="ocupacion"
              type="text"
              value={formData.ocupacion}
              onChange={handleChange}
              className="form-input"
              placeholder="Profesión u oficio"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="responsable" className="form-label">
              Responsable
            </label>
            <input
              id="responsable"
              name="responsable"
              type="text"
              value={formData.responsable}
              onChange={handleChange}
              className="form-input"
              placeholder="Nombre del responsable"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="institucion" className="form-label">
              Institución
            </label>
            <input
              id="institucion"
              name="institucion"
              type="text"
              value={formData.institucion}
              onChange={handleChange}
              className="form-input"
              placeholder="Institución o empresa"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="raza" className="form-label">
              Raza/Etnia
            </label>
            <input
              id="raza"
              name="raza"
              type="text"
              value={formData.raza}
              onChange={handleChange}
              className="form-input"
              placeholder="Raza o etnia"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="nacimiento" className="form-label">
              Lugar de Nacimiento
            </label>
            <input
              id="nacimiento"
              name="nacimiento"
              type="text"
              value={formData.nacimiento}
              onChange={handleChange}
              className="form-input"
              placeholder="Ciudad, País"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="procedencia" className="form-label">
              Procedencia
            </label>
            <input
              id="procedencia"
              name="procedencia"
              type="text"
              value={formData.procedencia}
              onChange={handleChange}
              className="form-input"
              placeholder="Lugar de procedencia"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  {isEditing ? 'Actualizando' : 'Registrando'}
                </>
              ) : (
                isEditing ? 'Actualizar Paciente' : 'Registrar Paciente'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PacienteForm;