export type CargoUsuario = 'administrador' | 'doctor' | 'asistente';

export interface User {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  cargo: CargoUsuario;
  estado: number;
  fecha_creacion: string;
  ultima_sesion_token_id?: string;
}

//LOGIN 
export interface LoginData {
  dni: string;
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
  dni?: string;
  contrasena?: string;
}

//USUARIO

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ToggleUserStatusData {
  dniToToggle: string;
  status: number;
}

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


export interface AntecedentesCompletosResponse {
  message: string;
  data: {
    ID_ANTECEDENTES: number;
    ID_FICHA_CLINICA: number;
    ID_ANT_CARDIO?: number;
    ID_ANT_PATOLOGICOS?: number;
    ID_RIESGO_CV?: number;
    ID_ENFERMEDAD_ACTUAL_FK?: number;
    FECHA_REGISTRO: string;
    TIEMPO_ENFERMEDAD?: string;
    INICIO?: string;
    CURSO?: string;
    RELATO_ENFERMEDAD?: string;
    TABAQUISMO?: number;
    TABAQUISMO_DESC?: string;
    HIPERTENSION?: number;
    HIPERTENSION_DESC?: string;
    DIABETES?: number;
    DIABETES_DESC?: string;
    DISLIPIDEMIA?: number;
    DISLIPIDEMIA_DESC?: string;
    EDAD_FACTOR?: number;
    OBESIDAD?: number;
    OBESIDAD_DESC?: string;
    HISTORIA_FAMILIAR?: number;
    HISTORIA_FAMILIAR_DESC?: string;
    SEDENTARISMO?: number;
    SEDENTARISMO_DESC?: string;
    ESTRES?: number;
    ESTRES_DESC?: string;
    DIETA_ATEROGENICA?: number;
    DIETA_ATEROGENICA_DESC?: string;
    HIPERURISEMIA?: number;
    HIPERURISEMIA_DESC?: string;
    PERSONLIDAD_TIPO_A?: number;
    PERSONLIDAD_TIPO_A_DESC?: string;

    INFARTO_MIOCARDIO?: number;
    VALVULOPATIA?: number;
    CARDIOPATIA_CONGENITA?: number;
    FIEBRE_REUMATICA_SECUELAS?: number;
    ARRITMIAS?: number;
    ENFERMEDAD_ARTERIAL_PERIFERICA?: number;
    ULTIMA_HOSPITALIZACION?: string;
    DX_HOSPITALIZACION?: string;
    INTERVENCION_QX_PCI_FECHA?: string;
    CATETERISMO_FECHA?: string;
    MEDICACION_HABITUAL?: string;
    
    RESPIRATORIO?: string;
    GASTROINTESTINAL?: string;
    GENITOURINARIO?: string;
    NEUROLOGICO?: string;
    LOCOMOTOR?: string;
    HEMATOLOGICO?: string;
    ALERGIAS?: string;
    CIRUGIAS_PREVIAS?: string;
  };
  paciente: {
    idFichaClinica: number;
    nombre: string;
    dni: string;
  };
  metadata: {
    tieneEnfermedadActual: boolean;
    tieneFactoresRiesgo: boolean;
    tieneCardiovascular: boolean;
    tienePatologicos: boolean;
  };
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
export interface ExamenFisicoData {
  idConsulta: number;
  esPrimeraConsulta?: boolean;
  examenDetallado?: ExamenFisicoDetallado;
  examenSimplificado?: string;
  observaciones?: string;
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

export interface VerificarExamenFisicoResponse {
  message: string;
  data: {
    tieneExamenFisico: boolean;
    tipoExamen: 'detallado' | 'simplificado' | 'no_registrado';
    esPrimeraConsulta: boolean;
    tieneObservaciones: boolean;
    seccionesCompletadas?: {
      general: boolean;
    };
  };
}

export interface ResumenExamenFisicoResponse {
  message: string;
  data: {
    resumen: string;
    tipo: 'detallado' | 'simplificado' | 'no_registrado';
    esPrimeraConsulta: boolean;
    tieneObservaciones: boolean;
    paciente: string;
  };
}

export interface ExamenFisicoDetalladoConsulta {
  examenGeneral?: ExamenFisicoGeneral;
  examenRegional?: ExamenFisicoRegional;
  examenCardiovascular?: ExamenFisicoCardiovascular;
  examenAbdominal?: ExamenFisicoAbdominal;
  examenExtremidades?: ExamenFisicoExtremidades;
  examenNeurologico?: ExamenFisicoNeurologico;
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
export interface CitasResponse {
  message: string;
  total: number;
  agenda?: Cita[];
  citas?: Cita[];
  filtros?: Record<string, unknown>;
  doctor?: string;
  paciente?: string;
  dni?: string;
  periodo?: string;
}

export interface CitaEstadoResponse {
  message: string;
  affectedRows: number;
  paciente: string;
}

export interface CitaEditResponse {
  message: string;
  affectedRows: number;
  cambios: string[];
  cita: Cita;
}

export interface CitaDeleteResponse {
  message: string;
  affectedRows: number;
  citaEliminada: {
    id: number;
    paciente: string;
    fecha: string;
    hora: string;
    estado: string;
  };
}

export interface CitaFiltros {
  fecha?: string;
  estado?: string;
  idDoctor?: number;
  dias?: number;
}

export interface CrearCitaData {
  dniPaciente: string;
  idDoctor: number;
  fecha: string;
  hora: string;
  servicio?: string;
}
export interface ActualizarCitaData {
  idDoctor?: number;
  fecha?: string;
  hora?: string;
  servicio?: string;
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

export interface ConsultaPaciente {
  ID_CONSULTA: number;
  FECHA: string;
  RELATO: string;
  PLAN_DE_TRABAJO: string;
  DIAGNOSTICO_NOMBRE?: string;
  DOCTOR_NOMBRE?: string;
}
export interface ConsultaData {
  idFichaClinica: number;
  idExamenClinico: number;
  relato: string;
  planDeTrabajo: string;
  anamesia?: string;
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

export interface SignosVitalesHoyResponse {
  tieneSignosVitalesHoy: boolean;
  message: string;
  idExamenClinico: number | null;
  idFichaClinica: number;
}

export interface SignosVitalesResponse {
  message: string;
  idExamenClinico: number;
  imc: string;
  idFichaClinica: number;
  esActualizacion?: boolean;
}

export interface Medicamento {
  descripcion: string;
  cantidad: number;
  dias: number;
  indicaciones?: string;
}

export interface RecetaData {
  idConsulta: number;
  medicamentos: Medicamento[];
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

export interface MultiDiagnosticoData {
  idConsulta: number;
  diagnosticos: {
    codigoCIE: string;
    esPrincipal: boolean;
  }[];
}

export interface EstadisticaSexo {
  SEXO: string;
  cantidad: number;
}

export interface PacienteReporte {
  DNI: string;
  NOMBRE_APELLIDO: string;
  EDAD: number;
  SEXO: string;
  FECHA: string;
  DOCTOR_NOMBRE: string;
  DOCTOR_APELLIDO: string;
}

export interface ExamenAuxiliarData {
  idFichaClinica: number;
  comentario?: string;
  imagenDoc: File;
}

export interface ExamenAuxiliarResponse {
  message: string;
  idExamenAuxiliar: number;
  rutaGuardada: string;
  paciente: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
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

export interface ConsultasPacienteResponse {
  data: ConsultaPaciente[];
  message?: string;
  total?: number;
}

export interface VitalSignsFormProps {
  patientDni: string;
  onComplete: (idExamenClinico: number, idFichaClinica: number) => void;
  onCancel?: () => void;
}

export interface AntecedentesFormProps {
  patientDni: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export interface ConsultationFormProps {
  patientDni: string;
  vitalSignsId: number | null;
  idFichaClinica: number | null;
  onComplete: (idConsulta: number) => void;
  onBack?: () => void;
}

export interface PrescriptionFormProps {
  consultationId: number;
  onComplete: () => void;
  onCancel?: () => void;
}


export interface AxiosErrorResponse {
  data?: {
    error?: string;
    message?: string;
  };
  status?: number;
  statusText?: string;
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
export interface ConsultaData {
  idFichaClinica: number;
  idExamenClinico: number;
  esPrimeraConsulta: boolean;
  relato: string;
  planDeTrabajo: string;
  examenFisicoDetallado?: {
    examenGeneral: Record<string, string>;
    examenRegional: Record<string, string>;
    examenCardiovascular: Record<string, string>;
    examenAbdominal: Record<string, string>;
    examenExtremidades: Record<string, string>;
    examenNeurologico: Record<string, string>;
  };
  examenFisicoSimplificado?: string;
  diagnosticosSecundarios?: string[];
}
export interface DiagnosticosConsultaResponse {
  message: string;
  diagnosticos: DiagnosticoConsulta[];
  total: number;
  paciente: string;
  idConsulta: number;
}

export interface MultiDiagnosticoData {
  idConsulta: number;
  diagnosticos: {
    codigoCIE: string;
    esPrincipal: boolean;
  }[];
}

export interface MedicamentoReceta {
  id_medicamento?: number;
  descripcion: string;
  cantidad: number;
  indicaciones?: string;
  dias_tratamiento?: number;
  dias?: number;
  observaciones?: string;
}

export interface RecetaData {
  idConsulta: number;
  observacionesGenerales?: string;
  medicamento: MedicamentoReceta[];
}

export interface RecetaResponse {
  message: string;
  idReceta: number;
  totalMedicamentos: number;
  medicamentosRegistrados: Array<string | number>;
  metodo?: string;
}

export interface RecetaDataItem {
  ID_RECETA: number;
  FECHA_RECETA: string;
  FECHA?: string;
  OBSERVACIONES_GENERALES: string;
  ESTADO: string;
  DOCTOR_NOMBRE?: string;
  DOCTOR_APELLIDO?: string;
  DESCRIPCION?: string;
  CANTIDAD?: number;
  DIAS?: number;
  INDICACIONES?: string;
  TOTAL_MEDICAMENTOS?: number;
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

export interface CIE10Categoria {
  codigo: string;
  descripcion: string;
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

export interface MultiDiagnosticoData {
  idConsulta: number;
  diagnosticos: {
    codigoCIE: string;
    esPrincipal: boolean;
  }[];
}

export interface ExamenFisicoDetalladoData {
  examenGeneral?: {
    estadoGeneral?: string;
    habitus?: string;
    hidratacion?: string;
    conciencia?: string;
    orientacion?: string;
  };
  examenRegional?: {
    cabeza?: string;
    ojos?: string;
    oidos?: string;
    nariz?: string;
    boca?: string;
    cuello?: string;
    torax?: string;
    abdomen?: string;
  };
  examenCardiovascular?: {
    ritmoCardiaco?: string;
    ruidosCardiacos?: string;
    soplos?: string;
    frotes?: string;
    pulsosPerifericos?: string;
  };
  examenAbdominal?: {
    formaAbdomen?: string;
    peristalsis?: string;
    visceromegalias?: string;
    dolorPalpacion?: string;
    signosIrritacion?: string;
  };
  examenExtremidades?: {
    extremidadesSuperiores?: string;
    extremidadesInferiores?: string;
    edema?: string;
    pulsosExtremidades?: string;
    temperaturaPiel?: string;
  };
  examenNeurologico?: {
    motilidad?: string;
    sensibilidad?: string;
    reflejos?: string;
    fuerzaMuscular?: string;
    coordinacion?: string;
  };
  observaciones?: string;
  examenFisicoSimplificado: string;
}


export interface SignosVitalesData {
  ID_EXAMEN_CLINICO: number;
  ID_FICHA_CLINICA: number;
  PA: string;
  PULSO: number;
  TIPO_PULSO?: string;
  SAO2?: number;
  FR?: number;
  PESO: number;
  TALLA: number;
  TEMPERATURA?: number;
  IMC?: number;
  FECHA_REGISTRO: string;
}

export interface SignosVitalesResponseData {
  message: string;
  data: SignosVitalesData;
}

export interface ConsultaCompletaData {
  ID_CONSULTA: number;
  ID_FICHA_CLINICA: number;
  ID_EXAMEN_CLINICO: number;
  ID_DIAGNOSTICO: number;
  ID_USUARIO: number;
  FECHA: string;
  ANAMESIA?: string;
  RELATO: string;
  PLAN_DE_TRABAJO: string;
  ESTADO: string;
  DNI: string;
  NOMBRE_APELLIDO: string;
  CIE_PRINCIPAL: string;
  DIAGNOSTICO_PRINCIPAL: string;
  PA?: string;
  PULSO?: number;
  PESO?: number;
  TALLA?: number;
  IMC?: number;
  TEMPERATURA?: number;
  SAO2?: number;
  FR?: number;
  DOCTOR_NOMBRE?: string;
  DOCTOR_APELLIDO?: string;
  diagnosticosSecundarios?: DiagnosticoSecundario[];
}
export interface ConsultaCompletaResponse {
  message: string;
  data: ConsultaCompletaData;
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

export interface SignosVitalesHoyResponse {
  tieneSignosVitalesHoy: boolean;
  idExamenClinico: number | null;
  fechaVerificacion?: string;
  mensaje?: string;
}

export interface EnfermedadActualData {
  idConsulta: number;
  tiempoEnfermedad: string;
  inicio?: string;
  curso?: string;
  sintomas?: string;
  relato: string;
}

export interface FactoresRiesgoData {
  idConsulta: number;
  tabaquismo?: boolean;
  hipertension?: boolean;
  diabetes?: boolean;
  dislipidemia?: boolean;
  obesidad?: boolean;
  sedentarismo?: boolean;
  estres?: boolean;
  dietaAterogenica?: boolean;
  historiaFamiliar?: boolean;
  cantidadTabaco?: string;
  tiempoTabaco?: string;
}

export interface AntecedentesCardiovascularesData {
  idConsulta: number;
  infartoMiocardio?: boolean;
  valvulopatia?: boolean;
  cardiopatiaCongenita?: boolean;
  arritmias?: boolean;
  enfermedadArterialPeriferica?: boolean;
  ultimaHospitalizacion?: string;
  dxHospitalizacion?: string;
  intervencionQxPciFecha?: string;
  cateterismoFecha?: string;
  medicacionHabitual?: string;
}

export interface AntecedentesPatologicosData {
  idConsulta: number;
  respiratorio?: string;
  gastrointestinal?: string;
  genitourinario?: string;
  neurologico?: string;
  locomotor?: string;
  hematologico?: string;
  alergias?: string;
  cirugiasPrevias?: string;
}

export interface HistoriaClinicaState {
  enfermedadActualCompleta: boolean;
  factoresRiesgoCompleta: boolean;
  antecedentesCardiovascularesCompleta: boolean;
  antecedentesPatologicosCompleta: boolean;
  examenFisicoCompleto: boolean;
  consultaCompleta: boolean;
}