export interface AccesoUsuario
{
    id?: number;
    rol: string;
    institucion: string | null;
    ambito: string;
    entidad: number | null;
}

export interface Perfil
{
    codigo: string;
    nombre: string;
    tipoInstitucion: string | null;
    requiereInstitucion: boolean;
    permiteEstatal: boolean;
}

export interface CatalogosCarga
{
    periodos: { id: number; inicio: string; fin: string; nombre: string }[];
    limites: { maximoBytes: number; maximoFilas: number };
}

export interface CatalogosUsuarios
{
    perfiles: Perfil[];
    ambitos: { codigo: string; nombre: string; requiereEntidad: boolean }[];
    entidades: { id: number; nombre: string }[];
    instituciones: { codigo: string; nombre: string; tipo: string }[];
}

export interface Usuario
{
    activo?: boolean;
    idAcceso?: number;
    accesos?: AccesoUsuario[];
    id: number;
    usuario: string;
    nombre: string;
    rol: string;
    institucion: string | null;
    ambito: string;
    entidad: number | null;
}

export interface Sesion
{
    token: string;
    venceUtc: string;
    usuario: Usuario;
}

export interface Carga
{
    id: string;
    folio: string;
    institucion: string;
    nombreArchivo: string;
    periodoInicio: string;
    periodoFin: string;
    estado: string;
    totalRegistros: number;
    creadoUtc: string;
    confirmadoUtc: string;
}

export interface Validacion
{
    valido: boolean;
    idCarga: string | null;
    totalRegistros: number;
    errores: { fila: number; campo: string; mensaje: string }[];
    avisos: string[];
}

export interface IncidenciaValidacion
{
    tipo: string;
    fila: number | null;
    campo: string;
    mensaje: string;
}
