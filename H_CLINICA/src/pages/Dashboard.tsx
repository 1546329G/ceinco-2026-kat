import React, { useState, useEffect } from 'react';
import { pacienteService, citaService } from '../services/apiService';
import type { Cita , DashboardStats } from '../types/models';
import '../styles/main.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    citasHoy: 0,
    citasPendientes: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadStats = async (): Promise<void> => {
      try {
        setLoading(true);
        const [pacientesRes, citasRes] = await Promise.all([
          pacienteService.obtenerPacientes(),
          citaService.obtenerCitasHoy()
        ]);

        const citasPendientes = citasRes.agenda.filter((cita: Cita) => 
          cita.ESTADO === 'PROGRAMADA'
        ).length;

        setStats({
          totalPacientes: pacientesRes.total || 0,
          citasHoy: citasRes.agenda.length || 0,
          citasPendientes
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">CEINCO</h1>
          <h2 className="dashboard-subtitle">Panel Principal</h2>
        </div>
        <div className="stats-grid">
          {[1, 2, 3].map((item) => (
            <div key={item} className="stat-card skeleton">
              <div className="skeleton-text"></div>
              <div className="skeleton-text-sm"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-subtitle">Panel Principal</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Total de Pacientes</h3>
            <div className="stat-card-icon">
              <svg className="icon-users" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.02 3.02 0 0 0 16.95 6h-2.66c-.77 0-1.47.41-1.85 1.07L9.5 12.5l-.78-1.41A2.98 2.98 0 0 0 6.61 10H4c-1.1 0-2 .9-2 2v6h2v6h4v-6h2v6h4v-6h2v6h4v-6zm-6-8h-2v-2h2v2zm-4 0H8v-2h2v2zm-4 0H4v-2h2v2z"/>
              </svg>
            </div>
          </div>
          <p className="stat-card-value text-blue">{stats.totalPacientes}</p>
          <p className="stat-card-description">Pacientes registrados en el sistema</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Citas Hoy</h3>
            <div className="stat-card-icon">
              <svg className="icon-calendar" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
            </div>
          </div>
          <p className="stat-card-value text-green">{stats.citasHoy}</p>
          <p className="stat-card-description">Citas programadas para hoy</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Citas Pendientes</h3>
            <div className="stat-card-icon">
              <svg className="icon-clock" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
          </div>
          <p className="stat-card-value text-yellow">{stats.citasPendientes}</p>
          <p className="stat-card-description">Citas por atender</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;