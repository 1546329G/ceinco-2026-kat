import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  visible: boolean;
  onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, visible, onClose }) => {
  if (!visible) return null;
  return (
    <div className={`alert-profesional ${type}`}>
      <div className="alert-header">
        <h3 className="alert-title">
          {type === 'success' && 'Éxito'}
          {type === 'error' && 'Error'}
          {type === 'warning' && 'Advertencia'}
          {type === 'info' && 'Información'}
        </h3>
        <button
          onClick={onClose}
          className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar alerta"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="alert-message">{message}</p>
    </div>
  );
};

export default Alert;