import React from 'react';
import '../../styles/main.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  ...props 
}) => {
  const buttonClass = `btn btn-${variant}`;
  
  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Cargando" 
}) => {
  return (
    <div className="loading-container">
      <div className="loading-text">{message}</div>
    </div>
  );
};