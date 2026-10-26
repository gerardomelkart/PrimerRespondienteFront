export interface Usuario
{
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
