import axios from 'axios';
import type {
  User,
  CreatePacienteData,
  Cita,
  SignosVitales,
  CitaData,
  Doctor,
  LoginResponse,
  LoginData,
  CargoUsuario,
  PacientesResponse,
  CreatePacienteResponse,
  UpdatePacienteResponse,
  AntecedentesData,
  PrimeraConsultaResponse,
  Paciente,
  CIE10SearchResponse,
  SignosVitalesResponse,
  AntecedentesCompletosResponse,
  MultiDiagnosticoData,
  ExamenFisicoResponse,
  ResumenExamenFisicoResponse,
  ExamenFisicoData,
  VerificarExamenFisicoResponse,
  ConsultaCompletaData,
  ExamenFisicoDetallado,
  DiagnosticosConsultaResponse,
  SignosVitalesResponseData,
  RecetasResponse,
  ExamenesAuxiliaresResponse,
  ReporteDiagnosticoParams,
  ReporteDiagnosticoResponse,
  PacienteDetalleResponse,
  ConsultasPacienteResponse
} from '../types/models';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('cargo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

const removeAuthToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('cargo');
};

export const authService = {
  login: async (credentials: LoginData): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    if (response.data.token) {
      setAuthToken(response.data.token);
      localStorage.setItem('cargo', response.data.cargo);
    }
    return response.data;
  },

  logout: (): void => {
    removeAuthToken();
  },
};

export const userService = {
  
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string; changed: boolean }> => {
    const response = await api.put('/auth/change-password', {
      contrasena_actual: data.currentPassword,
      contrasena_nueva: data.newPassword
    });
    return { ...response.data, changed: true };
  },

  register: async (userData: {
    dni: string;
    nombre?: string;
    apellido?: string;
    cargo: CargoUsuario;
    contrasena: string;
  }): Promise<{ message: string; registered: boolean }> => {
    const response = await api.post('/auth/register', userData);
    return { ...response.data, registered: true };
  },

  toggleUserStatus: async (data: { dniToToggle: string; status: number }): Promise<{
    message: string;
    toggled: boolean;
    newStatus?: number;
  }> => {
    const response = await api.put('/auth/users/toggle-status', { dni: data.dniToToggle });
    return { ...response.data, toggled: true };
  },

  getAllUsers: async (): Promise<{
    data: User[];
    message?: string;
    total?: number
  }> => {
    const { data: rows } = await api.get<Array<{
      ID_USUARIO: number;
      DNI: string;
      NOMBRE: string;
      APELLIDO: string;
      CARGO: CargoUsuario;
      ESTADO: number;
      FECHA_CREACION: string;
    }>>('/auth/users');
    const data = rows.map(row => ({
      id: row.ID_USUARIO,
      dni: row.DNI,
      nombre: row.NOMBRE,
      apellido: row.APELLIDO,
      cargo: row.CARGO,
      estado: row.ESTADO,
      fecha_creacion: row.FECHA_CREACION
    }));
    return { data, total: data.length };
  }
}

export const pacienteService = {
  obtenerPacientes: async (): Promise<PacientesResponse> => {
    const response = await api.get<PacientesResponse>('/pacientes');
    return response.data;
  },

  buscarPacientes: async (query: string): Promise<{
    message: string;
    data: Paciente[];
    total: number;
    query: string
  }> => {
    const { data } = await api.get<Paciente[]>(`/pacientes/buscar/${encodeURIComponent(query)}`);
    return { message: 'Búsqueda completada', data, total: data.length, query };
  },

  obtenerPacientePorId: async (idFichaClinica: number): Promise<{
    message: string;
    data: Paciente
  }> => {
    const response = await api.get(`/paciente/${idFichaClinica}`);
    return response.data;
  },

  buscarPacientePorDNI: async (dni: string): Promise<{
    message: string;
    data: Paciente;
  }> => {
    const { data } = await api.get<Paciente>(`/pacientes/${encodeURIComponent(dni)}`);
    return { message: 'Paciente encontrado', data };
  },

  obtenerDetalleCompletoPaciente: async (dni: string): Promise<PacienteDetalleResponse> => {
    const { data: patient } = await api.get<Paciente>(`/pacientes/${encodeURIComponent(dni)}`);
    return { patient, consultas: [], antecedentes: null };
  },

  crearPaciente: async (pacienteData: CreatePacienteData): Promise<CreatePacienteResponse> => {
    const { nombreApellido, fechaNacimiento, estadoCivil, ...fields } = pacienteData;
    const { data } = await api.post<{ message: string; id_ficha: number; dni: string }>('/pacientes', {
      ...fields, nombre_apellido: nombreApellido, fecha_nacimiento: fechaNacimiento, estado_civil: estadoCivil
    });
    return {
      message: data.message,
      idFichaClinica: data.id_ficha,
      paciente: { dni: data.dni, nombre: nombreApellido }
    };
  },

  actualizarPaciente: async (dni: string, pacienteData: Partial<CreatePacienteData>): Promise<UpdatePacienteResponse> => {
    const { nombreApellido, fechaNacimiento, estadoCivil, ...fields } = pacienteData;
    const response = await api.put<UpdatePacienteResponse>(`/pacientes/${encodeURIComponent(dni)}`, {
      ...fields, nombre_apellido: nombreApellido, fecha_nacimiento: fechaNacimiento, estado_civil: estadoCivil
    });
    return response.data;
  },

  obtenerConsultasPaciente: async (dni: string): Promise<ConsultasPacienteResponse> => {
    const response = await api.get<ConsultasPacienteResponse>(`/paciente/${dni}/consultas`);
    return response.data;
  }
};

export const antecedentesService = {
  verificarPrimeraConsulta: async (dni: string): Promise<PrimeraConsultaResponse> => {
    const response = await api.get<PrimeraConsultaResponse>(`/pacientes/${encodeURIComponent(dni)}/primera-consulta`);
    return response.data;
  },

  crearAntecedentesCompletos: async (dni: string, antecedentesData: AntecedentesData): Promise<{
    message: string;
    idAntecedentes: number;
    paciente: string;
    idFichaClinica: number;
    registrosCreados: {
      enfermedadActual: boolean;
      factoresRiesgo: boolean;
      cardiovascular: boolean;
      patologicos: boolean;
    };
  }> => {
    const response = await api.put(`/pacientes/${encodeURIComponent(dni)}/antecedentes`, antecedentesData);
    return response.data;
  },

  obtenerAntecedentesCompletos: async (dni: string): Promise<AntecedentesCompletosResponse> => {
    const response = await api.get<AntecedentesCompletosResponse>(`/antecedentes/paciente/${dni}/antecedentes-completos`);
    return response.data;
  },
};

export const diagnosticoService = {
  agregarDiagnosticoSecundario: async (idConsulta: number, codigoCIE: string): Promise<{
    message: string;
    idDiagnosticoSecundario: number;
    diagnostico: {
      codigo: string;
      descripcion: string;
    };
    paciente: string;
  }> => {
    const response = await api.post(`/consultas/${idConsulta}/diagnosticos`, { codigoCIE });
    return response.data;
  },

  obtenerDiagnosticosConsulta: async (idConsulta: number): Promise<DiagnosticosConsultaResponse> => {
    const { data } = await api.get<ConsultaApi>(`/consultas/${idConsulta}`);
    const diagnosticos = data.diagnosticos.map(row => ({
      id: row.ID_DIAGNOSTICO, codigo: row.CODIGO, descripcion: row.DESCRIPCION,
      tipo: row.TIPO, esPrincipal: row.TIPO.toLowerCase() === 'principal'
    }));
    return { message: 'Diagnósticos de la consulta', diagnosticos, total: diagnosticos.length, paciente: data.paciente_nombre, idConsulta };
  },

  eliminarDiagnosticoSecundario: async (idConsulta: number, idDiagnosticoSecundario: number): Promise<{
    message: string;
    affectedRows: number;
    diagnosticoEliminado: {
      codigo: string;
      descripcion: string;
    };
    paciente: string;
  }> => {
    const response = await api.delete(`/consultas/${idConsulta}/diagnosticos/${idDiagnosticoSecundario}`);
    return response.data;
  },

  buscarCIE10Avanzado: async (query: string, limit?: number, categoria?: string): Promise<{
    message: string;
    data: Array<{ CODIGO: string; DESCRIPCION: string; CATEGORIA: string }>;
    total: number;
    query: string;
    filtros: {
      categoria: string;
      limite: number;
    };
  }> => {
    const { data: rows } = await api.get<Array<{ CODIGO: string; DESCRIPCION: string; CAPITULO?: string }>>(
      `/catalogos/cie10/buscar/${encodeURIComponent(query)}`
    );
    const limite = limit ?? 30;
    const data = rows.filter(row => !categoria || row.CAPITULO === categoria).slice(0, limite)
      .map(row => ({ ...row, CATEGORIA: row.CAPITULO ?? '' }));
    return { message: 'Búsqueda completada', data, total: data.length, query, filtros: { categoria: categoria ?? '', limite } };
  },

  obtenerCategoriasCIE10: async (): Promise<{
    message: string;
    categorias: Array<{ codigo: string; descripcion: string }>;
    total: number;
  }> => {
    const response = await api.get('/diagnosticos/cie10/categorias');
    return response.data;
  },

  obtenerDiagnosticoPorCodigo: async (codigo: string): Promise<{
    message: string;
    diagnostico: {
      CODIGO: string;
      DESCRIPCION: string;
      CATEGORIA: string;
    };
  }> => {
    const response = await api.get(`/diagnosticos/cie10/${codigo}`);
    return response.data;
  },

  agregarMultiplesDiagnosticos: async (data: MultiDiagnosticoData): Promise<{
    message: string;
    diagnosticosRegistrados: number;
    diagnosticosConError: number;
    detalles: {
      exitosos: Array<{
        id: number;
        codigo: string;
        descripcion: string;
        tipo: string;
      }>;
      errores: Array<{
        codigo: string;
        error: string;
      }>;
    };
    paciente: string;
  }> => {
    const response = await api.post('/diagnosticos/diagnosticos-multiples', data);
    return response.data;
  }
};

export const examenFisicoService = {
  registrarExamenFisico: async (data: ExamenFisicoData): Promise<{
    message: string;
    idConsulta: number;
    tipoExamen: string;
    metadata: {
      paciente: string;
      fecha: string;
      tieneObservaciones: boolean;
    };
  }> => {
    const response = await api.put(`/consultas/${data.idConsulta}/examen-fisico`, data);
    return response.data;
  },

  obtenerExamenFisico: async (idConsulta: number): Promise<ExamenFisicoResponse> => {
    const response = await api.get<ExamenFisicoResponse>(`/consultas/${idConsulta}/examen-fisico`);
    return response.data;
  },

  verificarExamenFisico: async (idConsulta: number): Promise<VerificarExamenFisicoResponse> => {
    const response = await api.get<VerificarExamenFisicoResponse>(`/examen-fisico/consulta/${idConsulta}/verificar`);
    return response.data;
  },

  actualizarObservaciones: async (idConsulta: number, observaciones: string): Promise<{
    message: string;
    idConsulta: number;
    tieneObservaciones: boolean;
  }> => {
    const response = await api.put(`/examen-fisico/consulta/${idConsulta}/observaciones`, { observaciones });
    return response.data;
  },

  obtenerResumenExamenFisico: async (idConsulta: number): Promise<ResumenExamenFisicoResponse> => {
    const response = await api.get<ResumenExamenFisicoResponse>(`/examen-fisico/consulta/${idConsulta}/resumen`);
    return response.data;
  }
};

type CitaApi = Cita & { paciente_nombre: string; doctor_nombre?: string; doctor_apellido?: string };

const toCita = (cita: CitaApi): Cita => ({
  ...cita,
  PACIENTE: cita.paciente_nombre,
  NOMBRE_APELLIDO: cita.paciente_nombre,
  DOCTOR_NOMBRE: cita.doctor_nombre,
  DOCTOR_APELLIDO: cita.doctor_apellido,
  DOCTOR: [cita.doctor_nombre, cita.doctor_apellido].filter(Boolean).join(' '),
  ESTADO: cita.ESTADO?.toUpperCase() ?? null
});

export const citaService = {
  obtenerCitasHoy: async (): Promise<{ message: string; total: number; agenda: Cita[] }> => {
    const { data } = await api.get<CitaApi[]>('/citas/today');
    return { message: 'Citas del día', total: data.length, agenda: data.map(toCita) };
  },

   crearCita: async (citaData: CitaData): Promise<{
    message: string;
    idCita: number;
    paciente: string;
    doctor: string;
    fecha: string;
    hora: string;
  }> => {
    const { dniPaciente, idDoctor, fecha, hora, servicio } = citaData;
    const { data } = await api.post<{ message: string; id_cita: number }>('/citas', {
      dni: dniPaciente, id_doctor: idDoctor, fecha, hora, servicio
    });
    return { message: data.message, idCita: data.id_cita, paciente: dniPaciente, doctor: String(idDoctor), fecha, hora };
  },

  obtenerTodasCitas: async (filters?: {
    fecha?: string;
    estado?: string;
    idDoctor?: number
  }): Promise<{
    message: string;
    total: number;
    filtros: Record<string, unknown>;
    citas: Cita[]
  }> => {
    const { data } = await api.get<CitaApi[]>('/citas/search', {
      params: { ...filters, estado: filters?.estado?.toLowerCase() }
    });
    const citas = data.map(toCita);
    return { message: 'Citas encontradas', total: citas.length, filtros: filters ?? {}, citas };
  },

  obtenerCitasPorDoctor: async (idDoctor: number, filters?: {
    fecha?: string;
    estado?: string
  }): Promise<{
    message: string;
    total: number;
    doctor: string;
    filtros: Record<string, unknown>;
    citas: Cita[]
  }> => {
    const response = await api.get(`/cita/doctor/${idDoctor}`, { params: filters });
    return response.data;
  },

  obtenerCitasPorPaciente: async (dniPaciente: string, filters?: {
    estado?: string
  }): Promise<{
    message: string;
    total: number;
    paciente: string;
    dni: string;
    filtros: Record<string, unknown>;
    citas: Cita[]
  }> => {
    const response = await api.get(`/cita/paciente/${dniPaciente}`, { params: filters });
    return response.data;
  },

  obtenerCitasProximas: async (dias?: number): Promise<{
    message: string;
    total: number;
    periodo: string;
    citas: Cita[]
  }> => {
    const response = await api.get('/cita/proximas', { params: { dias } });
    return response.data;
  },

  actualizarEstadoCita: async (idCita: number, estado: string): Promise<{
    message: string;
    affectedRows: number;
    paciente: string
  }> => {
    const response = await api.patch(`/citas/${idCita}/${estado === 'CANCELADA' ? 'cancelar' : 'atender'}`);
    return response.data;
  },

  editarCita: async (idCita: number, citaData: Partial<CitaData> & { estado?: string }): Promise<{
    message: string;
    affectedRows: number;
    cambios: string[];
    cita: Cita
  }> => {
    const response = await api.put(`/citas/${idCita}`, { fecha: citaData.fecha, hora: citaData.hora, servicio: citaData.servicio, id_doctor: citaData.idDoctor });
    return response.data;
  },

  eliminarCita: async (idCita: number): Promise<{
    message: string;
    affectedRows: number;
    citaEliminada: {
      id: number;
      paciente: string;
      fecha: string;
      hora: string;
      estado: string;
    }
  }> => {
    const response = await api.delete(`/citas/${idCita}`);
    return response.data;
  }
};

type ConsultaApi = ConsultaCompletaData & {
  PLAN_TRABAJO: string;
  EXAMEN_FISICO_SIMPLIFICADO?: string;
  paciente_nombre: string;
  doctor_nombre?: string;
  doctor_apellido?: string;
  signos_vitales?: Partial<ConsultaCompletaData>;
  receta?: RecetasResponse['data'][number];
  diagnosticos: Array<{ ID_DIAGNOSTICO: number; CODIGO: string; DESCRIPCION: string; TIPO: string }>;
  examenes_auxiliares: Array<ExamenesAuxiliaresResponse['data'][number] & { IMAGEN_DOC?: string }>;
};

export const consultaService = {
  registrarConsultaCompleta: async (consultaData: {
    idFichaClinica: number;
    idExamenClinico: number;
    esPrimeraConsulta?: boolean;
    examenFisicoDetallado?: ExamenFisicoDetallado;
    examenFisicoSimplificado?: string;
    relato: string;
    planDeTrabajo: string;
    diagnosticosSecundarios?: string[];
  }): Promise<{
    message: string;
    idConsulta: number;
    esPrimeraConsulta: boolean;
    diagnosticosRegistrados: number;
    metadata: {
      paciente: string;
      doctor: string;
      fecha: string;
    };
  }> => {
    const { data } = await api.post('/consultas/completa', {
      ...consultaData, plan_trabajo: consultaData.planDeTrabajo, examen_fisico: consultaData.examenFisicoSimplificado
    });
    return { ...data, idConsulta: data.id_consulta };
  },

  obtenerConsultaCompleta: async (idConsulta: number): Promise<{ message: string; data: ConsultaCompletaData }> => {
    const { data: consulta } = await api.get<ConsultaApi>(`/consultas/${idConsulta}`);
    const principal = consulta.diagnosticos.find(row => row.TIPO.toLowerCase() === 'principal');
    return { message: 'Consulta encontrada', data: {
      ...consulta, ...consulta.signos_vitales, PLAN_DE_TRABAJO: consulta.PLAN_TRABAJO,
      NOMBRE_APELLIDO: consulta.paciente_nombre, DOCTOR_NOMBRE: consulta.doctor_nombre,
      DOCTOR_APELLIDO: consulta.doctor_apellido, CIE_PRINCIPAL: principal?.CODIGO ?? '',
      DIAGNOSTICO_PRINCIPAL: principal?.DESCRIPCION ?? ''
    } };
  },

  editarConsulta: async (idConsulta: number, consultaData: {
    relato: string;
    planDeTrabajo: string;
    examenFisicoSimplificado?: string;
  }): Promise<{
    message: string;
    actualizaciones: {
      relato: boolean;
      planDeTrabajo: boolean;
      examenFisico: boolean;
    };
  }> => {
    const response = await api.put(`/consultas/${idConsulta}`, { relato: consultaData.relato, plan_trabajo: consultaData.planDeTrabajo, examen_fisico: consultaData.examenFisicoSimplificado });
    return response.data;
  },

  obtenerConsultasPorPaciente: async (dni: string): Promise<{
    message: string;
    total: number;
    consultas: Array<{
      ID_CONSULTA: number;
      FECHA: string;
      RELATO: string;
      EXAMEN_FISICO?: string;
      EXAMEN_DETALLE?: Array<{ nombre: string; valor: string }>;
      DIAGNOSTICO?: string;
      DOCTOR?: string;
      PLAN_DE_TRABAJO: string;
      ES_PRIMERA_CONSULTA: number;
      ESTADO: string;
      DOCTOR_NOMBRE?: string;
      DOCTOR_APELLIDO?: string;
      PA?: string;
      PULSO?: number;
      PESO?: number;
      TALLA?: number;
      IMC?: number;
      SAO2?: number;
      FR?: number;
      TEMPERATURA?: number;
      FECHA_SIGNOS_VITALES?: string;
      TOTAL_DIAGNOSTICOS: number;
      TOTAL_RECETAS: number;
      TIPO_CONSULTA: string;
    }>;
  }> => {
    const { data } = await api.get(`/consultas/paciente/${encodeURIComponent(dni)}`);
    const consultas = (data as Array<ConsultaApi & { ES_PRIMERA_CONSULTA: number; TOTAL_DIAGNOSTICOS: number; TOTAL_RECETAS: number }>).map(row => ({
      ...row, PLAN_DE_TRABAJO: row.PLAN_TRABAJO,
      EXAMEN_FISICO: row.EXAMEN_FISICO_SIMPLIFICADO,
      DOCTOR: [row.doctor_nombre, row.doctor_apellido].filter(Boolean).join(' '),
      DOCTOR_NOMBRE: row.doctor_nombre,
      DOCTOR_APELLIDO: row.doctor_apellido, TIPO_CONSULTA: row.ES_PRIMERA_CONSULTA ? 'Primera consulta' : 'Control'
    }));
    return { message: 'Historial de consultas', consultas, total: consultas.length };
  },

  registrarSignosVitales: async (signosData: SignosVitales & { idFichaClinica: number }): Promise<SignosVitalesResponse> => {
    const response = await api.post<SignosVitalesResponse>('/consultas/signos-vitales', signosData);
    return response.data;
  },

  verificarSignosVitalesHoy: async (idFichaClinica: number): Promise<{
    tieneSignosVitalesHoy: boolean;
    idExamenClinico: number | null;
  }> => {
    const { data } = await api.get<{ tieneSignosVitalesHoy: boolean; idExamenClinico: number | null }>(
      `/consultas/signos-vitales/hoy/${idFichaClinica}`
    );
    return data;
  },

  obtenerSignosVitalesPorId: async (idExamenClinico: number): Promise<SignosVitalesResponseData> => {
    const response = await api.get<SignosVitalesResponseData>(`/signos-vitales/signos-vitales/${idExamenClinico}`);
    return response.data;
  },

  crearReceta: async (recetaData: {
    idConsulta: number;
    observacionesGenerales?: string;
    medicamentos: Array<{
      id_medicamento?: number;
      descripcion?: string;
      cantidad: number;
      indicaciones?: string;
      dias_tratamiento?: number;
      dias?: number;
      observaciones?: string;
    }>;
  }): Promise<{
    message: string;
    idReceta: number;
  }> => {
    const response = await api.post(`/consultas/${recetaData.idConsulta}/recetas`, {
      indicaciones: recetaData.observacionesGenerales,
      medicamentos: recetaData.medicamentos.map(med => ({
        id_medicamento: med.id_medicamento,
        dosis: String(med.cantidad),
        frecuencia: med.indicaciones,
        duracion: med.dias_tratamiento ?? med.dias
      }))
    });
    return response.data;
  },

  subirExamenAuxiliar: async (formData: FormData): Promise<{
    message: string;
    idExamenAuxiliar: number;
    filePath: string;
  }> => {
    const idConsulta = formData.get('idConsulta');
    const response = await api.post(`/consultas/${idConsulta}/examenes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  obtenerAntecedentesPaciente: async (dni: string): Promise<{
    message: string;
    antecedentes: {
      ANTECEDENTES_FAMILIARES?: string;
      ANTECEDENTES_PERSONALES?: string;
      ANTECEDENTES_PERSONALES_PATOLOGICOS?: string;
      ANTECEDENTES_PERSONALES_NO_PATOLOGICOS?: string;
      ANTECEDENTES_ALERGICOS?: string;
      ANTECEDENTES_QUIRURGICOS?: string;
      ANTECEDENTES_TRANSFUSIONALES?: string;
      ANTECEDENTES_TOXICOS?: string;
      ANTECEDENTES_GINECO_OBSTETRICOS?: string;
      MEDICACION_ACTUAL?: string;
    };
  }> => {
    const response = await api.get(`/paciente/${dni}/antecedentes`);
    return response.data;
  },

  buscarCIE10: async (query: string): Promise<CIE10SearchResponse> => {
    const { data } = await api.get<CIE10SearchResponse['data']>('/consultas/cie10/search', { params: { q: query } });
    return { message: 'Búsqueda completada', data, total: data.length, query };
  },

  obtenerRecetasPorConsulta: async (idConsulta: number): Promise<RecetasResponse> => {
    const { data } = await api.get<ConsultaApi>(`/consultas/${idConsulta}`);
    return { message: 'Recetas de la consulta', data: data.receta ? [data.receta] : [], total: data.receta ? 1 : 0 };
  },

  obtenerExamenesAuxiliaresPorConsulta: async (idConsulta: number): Promise<ExamenesAuxiliaresResponse> => {
    const { data } = await api.get<ConsultaApi>(`/consultas/${idConsulta}`);
    return { message: 'Exámenes auxiliares', data: data.examenes_auxiliares.map(examen => ({
      ...examen, URL_ARCHIVO: examen.IMAGEN_DOC ? `/adjuntos/${encodeURIComponent(examen.IMAGEN_DOC)}` : undefined
    })) };
  },

  descargarAdjunto: async (url: string): Promise<Blob> => {
    const response = await api.get<Blob>(url, { responseType: 'blob' });
    return response.data;
  }
};

export const reporteService = {
  generarReporteDiagnostico: async (params: ReporteDiagnosticoParams): Promise<ReporteDiagnosticoResponse> => {
    const response = await api.get<ReporteDiagnosticoResponse>('/reportes/diagnostico', {
      params: {
        fechaInicio: params.fechaInicio,
        fechaFin: params.fechaFin,
        codigoCIE: params.codigoCIE
      }
    });
    return response.data;
  }
};

export const historiaClinicaService = {
  obtenerAntecedentes: async (dni: string): Promise<Array<{ nombre: string; valor: string }>> => {
    const { data } = await api.get<{ campos: Array<{ nombre: string; valor: string }> }>(`/pacientes/${encodeURIComponent(dni)}/antecedentes`);
    return data.campos;
  },
  generarHistoriaClinicaPDF: async (dni: string, soloAntecedentes = false): Promise<Blob> => {
    const response = await api.get(`/pacientes/${encodeURIComponent(dni)}/pdf`, {
      responseType: 'blob',
      params: soloAntecedentes ? { seccion: 'antecedentes' } : undefined
    });
    return response.data;
  }
};
export const doctorService = {
  obtenerDoctores: async (): Promise<{
    message: string;
    total: number;
    data: Doctor[];
  }> => {
    const response = await api.get<{
      message: string;
      total: number;
      data: Doctor[];
    }>('/doctores');
    return response.data;
  },

  obtenerDoctorPorId: async (idDoctor: number): Promise<{
    message: string;
    data: Doctor;
  }> => {
    const response = await api.get<{
      message: string;
      data: Doctor;
    }>(`/doctores/${idDoctor}`);
    return response.data;
  }
};
export default api;