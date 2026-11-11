import React, { useState, useEffect } from 'react';
import type { CitaData, Doctor } from '../../types/models';
import '../../styles/cita.css';

interface CitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (citaData: CitaData) => Promise<void>;
  doctores: Doctor[];
  citaExistente?: CitaData & { idCita?: number };
  loading?: boolean;
}

const CitaModal: React.FC<CitaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  doctores,
  citaExistente,
  loading = false
}) => {
  const [formData, setFormData] = useState<CitaData>({
    dniPaciente: '',
    idDoctor: 0,
    fecha: '',
    hora: '',
    servicio: 'CONSULTA GENERAL'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (citaExistente) {
      setFormData({
        dniPaciente: citaExistente.dniPaciente,
        idDoctor: citaExistente.idDoctor,
        fecha: citaExistente.fecha,
        hora: citaExistente.hora,
        servicio: citaExistente.servicio || 'CONSULTA GENERAL'
      });
    } else {
      setFormData({
        dniPaciente: '',
        idDoctor: 0,
        fecha: '',
        hora: '',
        servicio: 'CONSULTA GENERAL'
      });
    }
    setErrors({});
  }, [citaExistente, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dniPaciente || formData.dniPaciente.length !== 8) {
      newErrors.dniPaciente = 'El DNI debe tener 8 dígitos';
    }

    if (!formData.idDoctor) {
      newErrors.idDoctor = 'Seleccione un doctor';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es obligatoria';
    }

    if (!formData.hora) {
      newErrors.hora = 'La hora es obligatoria';
    }

    if (formData.fecha && formData.hora) {
      const fechaHoraCita = new Date(`${formData.fecha}T${formData.hora}`);
      if (fechaHoraCita <= new Date()) {
        newErrors.fecha = 'La cita debe ser en fecha/hora futura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar cita:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'idDoctor' ? parseInt(value, 10) : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  const hoy = new Intl.DateTimeFormat('sv-SE').format();

  return (
    <div className="modal-overlay">
      <div className="cita-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {citaExistente ? 'Editar Cita' : 'Programar Nueva Cita'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="dniPaciente" className="form-label">
                DNI del Paciente *
              </label>
              <input
                id="dniPaciente"
                name="dniPaciente"
                type="text"
                value={formData.dniPaciente}
                onChange={handleChange}
                className={`form-input ${errors.dniPaciente ? 'error' : ''}`}
                placeholder="Ingrese DNI (8 dígitos)"
                maxLength={8}
                pattern="[0-9]{8}"
                disabled={!!citaExistente}
              />
              {errors.dniPaciente && (
                <span className="form-error">{errors.dniPaciente}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="idDoctor" className="form-label">
                Doctor *
              </label>
              <select
                id="idDoctor"
                name="idDoctor"
                value={formData.idDoctor}
                onChange={handleChange}
                className={`form-input ${errors.idDoctor ? 'error' : ''}`}
                disabled={loading}
              >
                <option value={0}>Seleccione un doctor</option>
                {doctores.map(doctor => (
                  <option key={doctor.ID_USUARIO} value={doctor.ID_USUARIO}>
                    Dr. {doctor.NOMBRE} {doctor.APELLIDO}
                  </option>
                ))}
              </select>
              {errors.idDoctor && (
                <span className="form-error">{errors.idDoctor}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="fecha" className="form-label">
                Fecha *
              </label>
              <input
                id="fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleChange}
                className={`form-input ${errors.fecha ? 'error' : ''}`}
                min={hoy}
                disabled={loading}
              />
              {errors.fecha && (
                <span className="form-error">{errors.fecha}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="hora" className="form-label">
                Hora *
              </label>
              <input
                id="hora"
                name="hora"
                type="time"
                value={formData.hora}
                onChange={handleChange}
                className={`form-input ${errors.hora ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.hora && (
                <span className="form-error">{errors.hora}</span>
              )}
            </div>

            <div className="form-group full-width">
              <label htmlFor="servicio" className="form-label">
                Servicio
              </label>
              <input
                id="servicio"
                name="servicio"
                type="text"
                value={formData.servicio}
                onChange={handleChange}
                className="form-input"
                placeholder="Tipo de consulta o servicio"
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? 'Guardando' : (citaExistente ? 'Actualizar' : 'Programar Cita')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CitaModal;