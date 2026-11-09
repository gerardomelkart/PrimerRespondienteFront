export interface AccesoUsuario
{
    id?: number;
    rol: 'SUPER_USUARIO' | 'PRIMER_RESPONDIENTE' | 'FISCALIA' | 'CONSULTA';
    institucion: string | null;
    ambito: 'NACIONAL' | 'ESTATAL';
    entidad: number | null;
}

export interface CatalogosUsuarios
{
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
    rol: 'SUPER_USUARIO' | 'PRIMER_RESPONDIENTE' | 'FISCALIA' | 'CONSULTA';
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
