export type CargoUsuario = 'administrador' | 'doctor' | 'asistente';

export interface User {
  id: number;
  dni: string;
  email?: string | null;
  nombre: string;
  apellido: string;
  cargo: CargoUsuario;
  estado: number;
  fecha_creacion: string;
  ultima_sesion_token_id?: string;
}

//LOGIN 
export interface LoginData {
  email: string;
  contrasena: string;
}

export interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
}

export interface ValidationErrors {
  email?: string;
  contrasena?: string;
}

//USUARIO

//PERFIL

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

//DASHBOARD

export interface DashboardStats {
  totalPacientes: number;
  citasHoy: number;
  citasPendientes: number;
}

export interface PacienteBase {
  length: number;
  ID_FICHA_CLINICA: number;
  DNI: string;
  NOMBRE_APELLIDO: string;
  FECHA_NACIMIENTO: string;
  EDAD: number;
  SEXO: string;
  TELEFONO: string;
  EMAIL: string;
  DOMICILIO: string;
  FECHA: string;
  RAZA?: string;
  ESTADO_CIVIL?: string;
  OCUPACION?: string;
  NACIMIENTO?: string;
  PROCEDENCIA?: string;
  RESPONSABLE?: string;
  INSTITUCION?: string;
}

export type Paciente = PacienteBase;

export interface CreatePacienteData {
  dni: string;
  nombreApellido: string;
  fechaNacimiento?: string;
  edad?: number;
  sexo?: string;
  estadoCivil?: string;
  ocupacion?: string;
  domicilio?: string;
  telefono?: string;
  email?: string;
  responsable?: string;
  institucion?: string;
  raza?: string;
  nacimiento?: string;
  procedencia?: string;
}

export interface Cita {
  PACIENTE: string | undefined;
  ID_CITAS: number;
  ID_FICHA_CLINICA: number;
  ID_USUARIO: number | null;
  SERVICIO: string | null;
  FECHA: string; 
  HORA: string;  
  ESTADO: string | null;
  
  DNI?: string;
  NOMBRE_APELLIDO?: string;
  TELEFONO?: string;
  EMAIL?: string;
  
  DOCTOR_NOMBRE?: string;
  DOCTOR_APELLIDO?: string;
  DOCTOR?: string; 

  ESTADO_DISPLAY?: string;
  PACIENTE_NOMBRE?: string; 
  DNI_PACIENTE?: string;   
  TIPO_FECHA?: 'PASADA' | 'HOY' | 'FUTURA';
  TIEMPO_RESTANTE?: string;
  URGENTE?: boolean;
  DIAS_RESTANTES?: number;
}

export interface AlertState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  visible: boolean;
}

export interface ExamenFisicoGeneral {
  estadoGeneral?: string;
  habitus?: string;
  hidratacion?: string;
  conciencia?: string;
  orientacion?: string;
}
export interface ExamenFisicoRegional {
  cabeza?: string;
  ojos?: string;
  oidos?: string;
  nariz?: string;
  boca?: string;
  cuello?: string;
  torax?: string;
  abdomen?: string;
}
export interface ExamenFisicoCardiovascular {
  ritmoCardiaco?: string;
  ruidosCardiacos?: string;
  soplos?: string;
  frotes?: string;
  pulsosPerifericos?: string;
}
export interface ExamenFisicoAbdominal {
  formaAbdomen?: string;
  peristalsis?: string;
  visceromegalias?: string;
  dolorPalpacion?: string;
  signosIrritacion?: string;
}
export interface ExamenFisicoExtremidades {
  extremidadesSuperiores?: string;
  extremidadesInferiores?: string;
  edema?: string;
  pulsosExtremidades?: string;
  temperaturaPiel?: string;
}
export interface ExamenFisicoNeurologico {
  motilidad?: string;
  sensibilidad?: string;
  reflejos?: string;
  fuerzaMuscular?: string;
  coordinacion?: string;
}
export interface ExamenFisicoDetallado {
  examenGeneral?: ExamenFisicoGeneral;
  examenRegional?: ExamenFisicoRegional;
  examenCardiovascular?: ExamenFisicoCardiovascular;
  examenAbdominal?: ExamenFisicoAbdominal;
  examenExtremidades?: ExamenFisicoExtremidades;
  examenNeurologico?: ExamenFisicoNeurologico;
}
export interface ExamenFisicoDetalladoResponse {
  examenGeneral?: Record<string, string>;
  examenRegional?: Record<string, string>;
  examenCardiovascular?: Record<string, string>;
  examenAbdominal?: Record<string, string>;
  examenExtremidades?: Record<string, string>;
  examenNeurologico?: Record<string, string>;
}
export interface ExamenFisicoResponse {
  message: string;
  data: {
    examenNeurologico: string;
    examenExtremidades: string;
    examenAbdominal: string;
    examenCardiovascular: string;
    examenRegional: string;
    examenGeneral: string;
    tipoConsulta: 'primera' | 'control';
    paciente: {
      nombre: string;
      dni: string;
    };
    examenDetallado?: ExamenFisicoDetalladoResponse;
    examenSimplificado?: string;
    observaciones?: string;
    metadata: {
      tieneExamenDetallado: boolean;
      tieneExamenSimplificado: boolean;
      tieneObservaciones: boolean;
      seccionesCompletas?: {
        general: boolean;
        regional: boolean;
        cardiovascular: boolean;
        abdominal: boolean;
        extremidades: boolean;
        neurologico: boolean;
      };
    };
  };
}

export interface DiagnosticoSecundario {
  ID_DIAGNOSTICO_SECUNDARIO: number;
  CODIGO: string;
  DESCRIPCION: string;
  CATEGORIA?: string;
  TIPO: string;
  OBSERVACIONES?: string;
  FECHA_REGISTRO: string;
}
export interface RecetaConsulta {
  ID_RECETA: number;
  FECHA_RECETA: string;
  OBSERVACIONES_GENERALES?: string;
  ESTADO: string;
  TOTAL_MEDICAMENTOS?: number;
  DOCTOR_NOMBRE?: string;
  DOCTOR_APELLIDO?: string;
}
export interface ExamenAuxiliarConsulta {
  ID_EXAMENESAUX: number;
  TIPO_EXAMEN: string;
  DESCRIPCION: string;
  COMENTARIO?: string;
  IMAGEN_DOC?: string;
  FECHA_REGISTRO: string;
}

export interface ExamenFisicoConsulta {
  examenGeneral?: ExamenFisicoGeneral;
  examenRegional?: ExamenFisicoRegional;
  examenCardiovascular?: ExamenFisicoCardiovascular;
  examenAbdominal?: ExamenFisicoAbdominal;
  examenExtremidades?: ExamenFisicoExtremidades;
  examenNeurologico?: ExamenFisicoNeurologico;
  examenSimplificado?: string;
  observaciones?: string;
}

export interface FormData {
  estadoGeneral?: string;
  habitus?: string;
  hidratacion?: string;
  conciencia?: string;
  orientacion?: string;
  
  cabeza?: string;
  ojos?: string;
  oidos?: string;
  nariz?: string;
  boca?: string;
  cuello?: string;
  torax?: string;
  abdomen?: string;
  
  ritmoCardiaco?: string;
  ruidosCardiacos?: string;
  soplos?: string;
  frotes?: string;
  pulsosPerifericos?: string;
  
  formaAbdomen?: string;
  peristalsis?: string;
  visceromegalias?: string;
  dolorPalpacion?: string;
  signosIrritacion?: string;
  
  extremidadesSuperiores?: string;
  extremidadesInferiores?: string;
  edema?: string;
  pulsosExtremidades?: string;
  temperaturaPiel?: string;
  
  motilidad?: string;
  sensibilidad?: string;
  reflejos?: string;
  fuerzaMuscular?: string;
  coordinacion?: string;
  
  observaciones?: string;
}

export interface ConsultaCompletaData {
  ID_CONSULTA: number;
  ID_FICHA_CLINICA: number;
  ID_EXAMEN_CLINICO: number;
  ID_USUARIO: number;
  FECHA: string;
  RELATO: string;
  PLAN_DE_TRABAJO: string;
  ESTADO: string;
  ES_PRIMERA_CONSULTA: number;
  EXAMEN_FISICO_GENERAL?: string;
  EXAMEN_FISICO_REGIONAL?: string;
  EXAMEN_FISICO_CARDIOVASCULAR?: string;
  EXAMEN_FISICO_ABDOMINAL?: string;
  EXAMEN_FISICO_EXTREMIDADES?: string;
  EXAMEN_FISICO_NEUROLOGICO?: string;
  EXAMEN_FISICO_SIMPLIFICADO?: string;
  OBSERVACIONES_EXAMEN_FISICO?: string;
  CREATED_AT: string;
  UPDATED_AT: string;
  
  // Datos del paciente
  DNI: string;
  NOMBRE_APELLIDO: string;
  FECHA_NACIMIENTO?: string;
  SEXO?: string;
  
  // Signos vitales
  PA?: string;
  PULSO?: number;
  TIPO_PULSO?: string;
  PESO?: number;
  TALLA?: number;
  IMC?: number;
  TEMPERATURA?: number;
  SAO2?: number;
  FR?: number;
  FECHA_SIGNOS_VITALES?: string;
  
  // Diagnóstico principal
  CIE_PRINCIPAL?: string;
  DIAGNOSTICO_PRINCIPAL?: string;

  // Doctor
  DOCTOR_NOMBRE?: string;
  DOCTOR_APELLIDO?: string;
  DOCTOR_DNI?: string;
  
  // Relaciones
  examenFisico?: ExamenFisicoConsulta;
  diagnosticosSecundarios?: DiagnosticoSecundario[];
  recetas?: RecetaConsulta[];
  examenesAuxiliares?: ExamenAuxiliarConsulta[];
  metadata?: {
    esPrimeraConsulta: boolean;
    totalDiagnosticos: number;
    totalRecetas: number;
    totalExamenesAux: number;
  };
}

export interface CitaData {
  dniPaciente: string;
  idDoctor: number;
  fecha: string;
  hora: string;
  servicio: string;
  idCita?: number;
  estado?: string;
}

export interface Consulta {
  ID_CONSULTA: number;
  FECHA: string;
  RELATO: string;
  PLAN_DE_TRABAJO: string;
  ANAMESIA?: string;
  CIE10?: string;
  DIAGNOSTICO?: string;
  PA?: string;
  PULSO?: number;
  PESO?: number;
  TALLA?: number;
  IMC?: number;
  DOCTOR?: string;
  DIAGNOSTICO_NOMBRE?: string;
  DOCTOR_NOMBRE?: string;
  DOCTOR_APELLIDO?: string;
}

export interface SignosVitales {
  idFichaClinica: number;
  pa: string;
  pulso: number;
  tipoPulso?: string;
  sao2?: number;
  fr?: number;
  peso: number;
  talla: number;
  temperatura?: number;
  fechaRegistro?: string;
}

export interface SignosVitalesResponse {
  message: string;
  idExamenClinico: number;
  imc: string;
  idFichaClinica: number;
  esActualizacion?: boolean;
}

export interface Doctor {
  ID_USUARIO: number;
  DNI: string;
  NOMBRE: string;
  APELLIDO: string;
  CARGO: string;
  ESTADO: number;
  ESTADO_DISPLAY: string;
  NOMBRE_COMPLETO: string;
  FECHA_CREACION?: string;
  ULTIMA_SESION_TOKEN_ID?: string;
}

export interface AntecedentesData {
  enfermedadActual?: {
    tiempoEnfermedad?: string;
    relato?: string;
  };
  cardiovascular?: {
    infartoMiocardio?: boolean;
    valvulopatia?: boolean;
    cardiopatiaCongenita?: boolean;
    fiebreReumaticaSecuelas?: boolean;
    arritmias?: boolean;
    enfermedadArterialPeriferica?: boolean;
    ultimaHospitalizacion?: string;
    dxHospitalizacion?: string;
    intervencionQxPciFecha?: string;
    cateterismoFecha?: string;
    medicacionHabitual?: string;
  };
  patologicos?: {
    respiratorio?: string;
    gastrointestinal?: string;
    genitourinario?: string;
    neurologico?: string;
    locomotor?: string;
    hematologico?: string;
    alergias?: string;
    cirugiasPrevias?: string;
  };
  factoresRiesgo?: {
    tabaquismo?: boolean;
    hipertension?: boolean;
    diabetes?: boolean;
    dislipidemia?: boolean;
    edadFactor?: boolean;
    obesidad?: boolean;
    historiaFamiliar?: boolean;
    sedentarismo?: boolean;
    estres?: boolean;
    dietaAterogenica?: boolean;
    hiperurisemia?: boolean;
    personalidadTipoA?: boolean;
    cantidadTabaco?: string;
    tiempoTabaco?: string;
  };
  sintomas?: {
    angina?: boolean;
    disnea?: boolean;
    palpitaciones?: boolean;
    sincope?: boolean;
    cianosis?: boolean;
    edemas?: boolean;
    ortopnea?: boolean;
    fiebre?: boolean;
    claudicacionIntermitente?: boolean;
    otros?: string;
  };
}

export interface AntecedentesCompletos {
  ID_ANTECEDENTES: number;
  INFARTO_MIOCARDIO?: string;
  VALVULOPATIA?: string;
  CARDIOPATIA_CONGENITA?: string;
  RESPIRATORIO?: string;
  GASTROINTESTINAL?: string;
  ALERGIAS?: string;
  TABAQUISMO?: string;
  HIPERTENSION?: string;
  DIABETES?: string;
  ANGINA?: string;
  DISNEA?: string;
  PALPITACIONES?: string;
  TIEMPO_ENFERMEDAD?: string;
  RELATO_ENFERMEDAD?: string;
}

export interface CIE10 {
  CODIGO: string;   
  DESCRIPCION: string; 
}

export interface CIE10SearchResponse {
  message: string;
  data: CIE10[];
  total: number;
  query: string;
}

export interface LoginResponse {
  token: string;
  cargo: CargoUsuario;
  user?: {
    id: number;
    dni: string;
    nombre: string;
    apellido: string;
  };
  login: boolean;
}

export interface PacientesResponse {
  data: Paciente[];
  message?: string;
  total?: number;
}

export interface PacienteResponse {
  data: Paciente | Paciente[];
  message?: string;
  total?: number;
  query?: string;
}

export interface PacienteDetalleResponse {
  patient: Paciente;
  consultas: Consulta[];
  antecedentes: AntecedentesCompletos | null;
  message?: string;
}

export interface PrimeraConsultaResponse {
  message: string;
  esPrimeraConsulta: boolean;
  mostrarAntecedentes: boolean;
  tieneAntecedentes: boolean;
  totalConsultas: number;
  idFichaClinica: number;
}

export interface CreatePacienteResponse {
  message: string;
  idFichaClinica: number;
  paciente: {
    dni: string;
    nombre: string;
  };
}

export interface UpdatePacienteResponse {
  message: string;
  affectedRows?: number;
}

// En types/models.ts
export interface ReporteDiagnosticoParams {
  fechaInicio: string;
  fechaFin: string;
  codigoCIE: string;
}

export interface ReporteDiagnosticoResponse {
  message: string;
  parametros: {
    diagnostico: string;
    descripcion: string;
    rangoFechas: string;
    periodoDias: number;
  };
  resultados: {
    totalConsultasAtendidas: number;
    pacientesConDiagnostico: number;
    porcentaje: string;
    estadisticasSexo: Array<{
      SEXO: string;
      cantidad: number;
    }>;
  };
  detallePacientes: {
    total: number;
    lista: Array<{
      DNI: string;
      NOMBRE_APELLIDO: string;
      EDAD: number;
      SEXO: string;
      FECHA: string;
      DOCTOR_NOMBRE: string;
      DOCTOR_APELLIDO: string;
    }>;
  };
  metadatos: {
    generadoPor: string;
    fechaGeneracion: string;
    horaGeneracion: string;
  };
}

export interface DiagnosticoConsulta {
  id: string | number;
  codigo: string;
  descripcion: string;
  tipo: string;
  esPrincipal: boolean;
  fechaRegistro?: string;
}
export interface DiagnosticosConsultaResponse {
  message: string;
  diagnosticos: DiagnosticoConsulta[];
  total: number;
  paciente: string;
  idConsulta: number;
}

export interface RecetaCompleta {
  ID_RECETA: number;
  FECHA_RECETA: string;
  OBSERVACIONES_GENERALES: string;
  ESTADO: string;
  DOCTOR_NOMBRE?: string;
  DOCTOR_APELLIDO?: string;
  medicamentos: MedicamentoRecetaDetalle[];
}

export interface MedicamentoRecetaDetalle {
  ID_RECETA_MEDICAMENTO: number;
  ID_MEDICAMENTO?: number;
  MEDICAMENTO_NOMBRE?: string;
  CONCENTRACION?: string;
  FORMA_FARMACEUTICA?: string;
  DESCRIPCION: string;
  CANTIDAD: number;
  INDICACIONES: string;
  DIAS_TRATAMIENTO?: number;
  DIAS?: number;
  OBSERVACIONES?: string;
}

export interface RecetasResponse {
  message: string;
  data: RecetaCompleta[];
  total: number;
}

export interface ExamenFisicoData {
  idConsulta: number;
  estadoGeneral?: string;
  habitus?: string;
  hidratacion?: string;
  conciencia?: string;
  orientacion?: string;
  cabeza?: string;
  ojos?: string;
  oidos?: string;
  nariz?: string;
  boca?: string;
  cuello?: string;
  torax?: string;
  abdomen?: string;
  ritmoCardiaco?: string;
  ruidosCardiacos?: string;
  soplos?: string;
  frotes?: string;
  pulsosPerifericos?: string;
  formaAbdomen?: string;
  peristalsis?: string;
  visceromegalias?: string;
  dolorPalpacion?: string;
  signosIrritacion?: string;
  extremidadesSuperiores?: string;
  extremidadesInferiores?: string;
  edema?: string;
  pulsosExtremidades?: string;
  temperaturaPiel?: string;
  motilidad?: string;
  sensibilidad?: string;
  reflejos?: string;
  fuerzaMuscular?: string;
  coordinacion?: string;
  observaciones?: string;
}

export interface CIE10Avanzado {
  CODIGO: string;
  DESCRIPCION: string;
  CATEGORIA: string;
}

export interface ExamenAuxiliarData {
  ID_EXAMENESAUX: number;
  TIPO_EXAMEN: string;
  DESCRIPCION: string;
  RESULTADOS?: string;
  URL_ARCHIVO?: string;
  FECHA_REGISTRO: string;
}

export interface ExamenesAuxiliaresResponse {
  message: string;
  data: ExamenAuxiliarData[];
}

export interface SignosVitalesRegistrados {
  pa?: string;
  pulso?: number;
  tipoPulso?: string;
  sao2?: number;
  fr?: number;
  peso?: number;
  talla?: number;
  temperatura?: number;
  fechaRegistro?: string;
  registradoPor?: string | null;
}

export interface SignosVitalesHoyDetalle {
  tieneSignosVitalesHoy: boolean;
  idExamenClinico: number | null;
  signos?: SignosVitalesRegistrados | null;
}

export interface AntecedentesRegistradosResponse {
  tieneAntecedentes: boolean;
  datos: AntecedentesData | null;
  registrosPrevios: Record<string, string>;
  fechaRegistro?: string | null;
}
