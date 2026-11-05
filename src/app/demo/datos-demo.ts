// Datos completamente sintéticos para la presentación. No proceden de los Excel reales.
export interface ColumnaDemo
{
    clave: string;
    nombre: string;
}
export const COLUMNAS_CORPORACION: ColumnaDemo[] = [
    { clave: 'entidad', nombre: 'Entidad' },
    { clave: 'num', nombre: 'Núm.' },
    { clave: 'id_key', nombre: 'Identificador' },
    { clave: 'corporacion_reporta', nombre: 'Corporación' },
    { clave: 'nombre_detenido_corporacion', nombre: 'Persona reportada' },
    { clave: 'fecha_detencion_corporacion', nombre: 'Fecha de detención' }
];
export const COLUMNAS_RND: ColumnaDemo[] = [
    { clave: 'folio_RND', nombre: 'Folio RND' },
    { clave: 'num_detenido', nombre: 'Núm. de persona' },
    { clave: 'num_detencion', nombre: 'Núm. de detención' },
    { clave: 'nombre_detenido', nombre: 'Persona en RND' },
    { clave: 'fecha_detencion', nombre: 'Fecha en RND' },
    { clave: 'municipio_detencion', nombre: 'Municipio' },
    { clave: 'tipo_fuero', nombre: 'Fuero' },
    { clave: 'id_puesta', nombre: 'ID de puesta' },
    { clave: 'autoridad_puesta', nombre: 'Autoridad receptora' },
    { clave: 'motivo_detencion', nombre: 'Motivo de detención' },
    { clave: 'tipo_detencion', nombre: 'Tipo de detención' }
];
export const COLUMNAS_FISCALIA: ColumnaDemo[] = [
    { clave: 'recibido_por_fiscalia', nombre: 'Recibido por fiscalía' },
    { clave: 'libertad_sede_ministerial', nombre: 'Libertad ministerial' },
    { clave: 'razon_libertad', nombre: 'Razón de libertad' },
    { clave: 'audiencia_inicial', nombre: 'Audiencia inicial' },
    { clave: 'legal_detencion', nombre: 'Legalidad de detención' },
    { clave: 'motivo_no_legal', nombre: 'Motivo de detención ilegal' },
    { clave: 'vinculacion_proceso', nombre: 'Vinculación a proceso' },
    { clave: 'motivo_no_vinculacion', nombre: 'Motivo de no vinculación' },
    { clave: 'prision_preventiva', nombre: 'Prisión preventiva' },
    { clave: 'medida_cautelar', nombre: 'Medida cautelar' },
    { clave: 'MASC', nombre: 'MASC' },
    { clave: 'procedimiento_abreviado', nombre: 'Procedimiento abreviado' },
    { clave: 'inicia_juicio', nombre: 'Inicia juicio' },
    { clave: 'descripcion_conclusion', nombre: 'Conclusión' },
    { clave: 'comentarios', nombre: 'Comentarios' }
];
export const COLUMNAS_PRIMER_REPORTE: ColumnaDemo[] = [
    COLUMNAS_CORPORACION[3], COLUMNAS_RND[0], COLUMNAS_CORPORACION[4],
    COLUMNAS_CORPORACION[5], COLUMNAS_CORPORACION[0], COLUMNAS_RND[6], COLUMNAS_RND[8]
];
export const GRUPOS_DEMO = [
    { nombre: 'Primer respondiente', clase: 'origen-corporacion', columnas: COLUMNAS_CORPORACION },
    { nombre: 'Referencia RND', clase: 'origen-rnd', columnas: COLUMNAS_RND },
    { nombre: 'Seguimiento de fiscalía', clase: 'origen-fiscalia', columnas: COLUMNAS_FISCALIA }
];
const ubicaciones = [
    ['México', 'Toluca'], ['Ciudad de México', 'Cuauhtémoc'], ['Jalisco', 'Guadalajara'],
    ['Nuevo León', 'Monterrey'], ['Puebla', 'Puebla'], ['Veracruz', 'Xalapa'],
    ['Guanajuato', 'León'], ['Chihuahua', 'Juárez']
];
export const REGISTROS_DEMO: ReadonlyArray<Readonly<Record<string, string>>> = Array.from({ length: 48 }, (_, indice) =>
{
    const numero = String(indice + 1).padStart(3, '0');
    const [entidad, municipio] = ubicaciones[(indice * 3) % ubicaciones.length];
    const pendiente = indice % 4 === 0;
    const libertad = !pendiente && indice % 6 === 0;
    const audiencia = !pendiente && !libertad && indice % 5 !== 0;
    const legal = audiencia && indice % 7 !== 0;
    const vinculado = legal && indice % 5 !== 1;
    const prision = vinculado && indice % 3 === 0;
    const concluido = !pendiente && (libertad || (vinculado && indice % 7 === 1));
    const fecha = '2026-10-' + String(1 + (indice * 7) % 31).padStart(2, '0');
    const respuesta = (condicion: boolean) => pendiente ? 'Pendiente' : condicion ? 'Sí' : 'No';
    return Object.freeze({
        entidad, num: String(indice + 1), id_key: 'DEMO-EM-' + numero,
        corporacion_reporta: ['SEDENA', 'SEMAR', 'GN', 'SSPC'][Math.floor(indice / 3) % 4],
        nombre_detenido_corporacion: 'Persona ficticia ' + numero,
        fecha_detencion_corporacion: fecha, folio_RND: 'DEMO-RND-2026-' + numero,
        num_detenido: 'DEMO-P-' + numero, num_detencion: 'DEMO-D-' + numero,
        nombre_detenido: 'Persona ficticia ' + numero, fecha_detencion: fecha,
        municipio_detencion: municipio, tipo_fuero: indice % 3 === 0 ? 'Federal' : 'Común',
        id_puesta: 'DEMO-PD-' + numero,
        autoridad_puesta: indice % 3 === 0 ? 'Fiscalía General de la República' : 'Fiscalía de ' + entidad,
        motivo_detencion: ['Posible robo (ejemplo)', 'Posible delito contra la salud (ejemplo)', 'Posible portación de arma (ejemplo)'][indice % 3],
        tipo_detencion: 'Flagrancia (ejemplo)', recibido_por_fiscalia: pendiente ? 'Pendiente' : 'Sí',
        libertad_sede_ministerial: respuesta(libertad), razon_libertad: libertad ? 'Determinación ministerial de ejemplo' : 'No aplica',
        audiencia_inicial: respuesta(audiencia), legal_detencion: !audiencia ? pendiente ? 'Pendiente' : 'No aplica' : respuesta(legal),
        motivo_no_legal: audiencia && !legal ? 'Motivo ficticio para presentación' : 'No aplica',
        vinculacion_proceso: !audiencia ? pendiente ? 'Pendiente' : 'No aplica' : respuesta(vinculado),
        motivo_no_vinculacion: audiencia && !vinculado ? 'Determinación judicial de ejemplo' : 'No aplica',
        prision_preventiva: vinculado ? respuesta(prision) : pendiente ? 'Pendiente' : 'No aplica',
        medida_cautelar: vinculado ? prision ? 'Prisión preventiva' : 'Presentación periódica (ejemplo)' : 'No aplica',
        MASC: vinculado ? 'No' : pendiente ? 'Pendiente' : 'No aplica',
        procedimiento_abreviado: vinculado ? respuesta(concluido) : pendiente ? 'Pendiente' : 'No aplica',
        inicia_juicio: vinculado ? 'No' : pendiente ? 'Pendiente' : 'No aplica',
        descripcion_conclusion: concluido ? 'Conclusión ficticia para presentación' : 'Pendiente',
        comentarios: 'Registro sintético. Sin relación con personas o expedientes reales.',
        estado: pendiente ? 'Sin respuesta' : concluido ? 'Concluido' : 'En seguimiento'
    });
});
export function fechaDemo(valor: string): string
{
    return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor.split('-').reverse().join('/') : valor;
}
export function descargarCsvDemo(columnas: ColumnaDemo[], registros: ReadonlyArray<Readonly<Record<string, string>>>, nombre: string)
{
    const celda = (valor: string) => '"' + valor.replace(/"/g, '""') + '"';
    const contenido = ['DEMOSTRACIÓN: DATOS FICTICIOS', columnas.map(c => celda(c.nombre)).join(';'),
        ...registros.map(registro => columnas.map(c => celda(fechaDemo(registro[c.clave] ?? ''))).join(';'))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', contenido], { type: 'text/csv;charset=utf-8;' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
