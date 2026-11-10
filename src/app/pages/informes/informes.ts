import { Component, ElementRef, afterRenderEffect, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface Totales
{
    entregas: number; registros: number; folios: number; localizados: number;
    noLocalizados: number; pendientes: number; duplicados: number;
}
interface Resumen extends Totales { periodoInicio: string; periodoFin: string; corporacion: string; }
interface Registro
{
    periodoInicio: string; periodoFin: string; folioEntrega: string; corporacion: string;
    folioRnd: string; fechaDetencion: string; nombreDetenido: string; entidad: string;
    autoridadPuesta: string; fuero: string; estadoCruce: string; duplicado: boolean; fechaFuente: string | null;
}
interface Informe { totales: Totales; resumen: Resumen[]; registros: Registro[]; pagina: number; tamano: number; }
interface Opciones
{
    acceso: { puedeElegirCorporacion: boolean; puedeElegirEntidad: boolean; corporacion: string | null; entidad: number | null };
    periodos: { inicio: string; fin: string; nombre: string }[];
    corporaciones: { codigo: string; nombre: string }[];
    entidades: { id: number; nombre: string }[];
}

@Component({
    selector: 'app-informes', imports: [CommonModule, FormsModule],
    templateUrl: './informes.html', styleUrl: './informes.css'
})
export class InformesPage
{
    readonly completo = input(false);
    private readonly http = inject(HttpClient);
    private readonly base = 'api/informes/primer-respondiente';
    private readonly espera = viewChild<ElementRef<HTMLDialogElement>>('espera');
    readonly opciones = signal<Opciones | null>(null);
    readonly reporte = signal<Informe | null>(null);
    readonly ocupado = signal(false);
    readonly exportando = signal(false);
    readonly mensaje = signal('');
    anio = '';
    orden = 'PeriodoInicio';
    descendente = true;
    ordenResumen = 'PeriodoInicio';
    descendenteResumen = true;
    periodo = '';
    corporacion = '';
    entidad = '';
    tamano = 25;
    private consulta?: Subscription;
    private catalogos?: Subscription;
    private descarga?: Subscription;

    constructor()
    {
        effect(() =>
        {
            if(!this.completo()) untracked(() => this.cargarCatalogos());
        });
        afterRenderEffect(() =>
        {
            const dialogo = this.espera()?.nativeElement;
            if(!dialogo) return;
            if(this.ocupado() || this.exportando())
            {
                if(!dialogo.open) dialogo.showModal();
            }
            else if(dialogo.open) dialogo.close();
        });
    }

    cargarCatalogos()
    {
        this.catalogos?.unsubscribe();
        this.ocupado.set(true);
        this.mensaje.set('');
        this.catalogos = this.http.get<Opciones>(`${this.base}/catalogos`).subscribe({
            next: opciones =>
            {
                this.opciones.set(opciones);
                this.anio = this.anios[0] ?? '';
                if(!opciones.acceso.puedeElegirCorporacion) this.corporacion = opciones.acceso.corporacion ?? '';
                if(!opciones.acceso.puedeElegirEntidad) this.entidad = String(opciones.acceso.entidad ?? '');
                this.ocupado.set(false);
                this.consultar();
            },
            error: error => this.error(error)
        });
    }

    get anios() { return [...new Set((this.opciones()?.periodos ?? []).map(p => p.inicio.slice(0, 4)))].sort().reverse(); }
    get periodos() { return (this.opciones()?.periodos ?? []).filter(p => p.inicio.startsWith(this.anio)); }
    cambiarAnio() { this.periodo = ''; this.cambiarFiltros(); }
    ordenar(columna: string, resumen = false)
    {
        if(resumen) { this.descendenteResumen = this.ordenResumen === columna ? !this.descendenteResumen : false; this.ordenResumen = columna; }
        else { this.descendente = this.orden === columna ? !this.descendente : false; this.orden = columna; }
        this.consultar();
    }
    indicador(columna: string, resumen = false)
    {
        return (resumen ? this.ordenResumen : this.orden) === columna ? ((resumen ? this.descendenteResumen : this.descendente) ? ' ▼' : ' ▲') : ' ↕';
    }

    cambiarFiltros()
    {
        this.reporte.set(null);
        this.mensaje.set('');
    }

    private parametros(pagina: number)
    {
        let parametros = new HttpParams().set('pagina', pagina).set('tamano', this.tamano).set('orden', this.orden).set('descendente', this.descendente).set('ordenResumen', this.ordenResumen).set('descendenteResumen', this.descendenteResumen);
        if(this.anio) parametros = parametros.set('anio', this.anio);
        if(this.periodo)
        {
            const [inicio, fin] = this.periodo.split('|');
            parametros = parametros.set('inicio', inicio).set('fin', fin);
        }
        if(this.corporacion) parametros = parametros.set('corporacion', this.corporacion);
        if(this.entidad) parametros = parametros.set('entidad', this.entidad);
        return parametros;
    }

    consultar(pagina = 1)
    {
        if(this.ocupado() || this.exportando() || !this.opciones()) return;
        this.consulta?.unsubscribe();
        this.ocupado.set(true);
        this.mensaje.set('');
        this.consulta = this.http.get<Informe>(this.base, { params: this.parametros(pagina) }).subscribe({
            next: reporte => { this.reporte.set(reporte); this.ocupado.set(false); },
            error: error => { this.reporte.set(null); this.error(error); }
        });
    }

    get paginas() { return Math.max(1, Math.ceil((this.reporte()?.totales.registros ?? 0) / this.tamano)); }

    descargar(tabla = 'ambas')
    {
        if(this.ocupado() || this.exportando() || !this.reporte()?.totales.registros) return;
        this.exportando.set(true);
        this.descarga = this.http.get(`${this.base}/excel`, { params: this.parametros(1).set('tabla', tabla), responseType: 'blob', observe: 'response' }).subscribe({
            next: respuesta =>
            {
                const disposicion = respuesta.headers.get('Content-Disposition') ?? '';
                const extendido = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposicion)?.[1];
                let nombre = /filename="?([^";]+)"?/i.exec(disposicion)?.[1] ?? 'Reporte_PrimerRespondiente.xlsx';
                if(extendido)
                {
                    try { nombre = decodeURIComponent(extendido); } catch { /* Se conserva el nombre alternativo. */ }
                }
                const url = URL.createObjectURL(respuesta.body!);
                const enlace = document.createElement('a');
                enlace.href = url; enlace.download = nombre.replace(/[\\/]/g, '_'); enlace.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                this.exportando.set(false);
            },
            error: async (error: HttpErrorResponse) =>
            {
                this.exportando.set(false);
                if(error.error instanceof Blob)
                {
                    try { this.mensaje.set(JSON.parse(await error.error.text()).mensaje ?? 'No fue posible descargar el reporte.'); return; } catch { /* Error sin cuerpo JSON. */ }
                }
                this.error(error);
            }
        });
    }

    estado(valor: string)
    {
        return valor === 'LOCALIZADO' ? 'Localizado en RND' : valor === 'NO_LOCALIZADO' ? 'No localizado' : 'Pendiente de cruce';
    }

    private error(error: HttpErrorResponse)
    {
        this.ocupado.set(false);
        this.mensaje.set(error.error?.mensaje ?? (error.status === 403 ? 'Su acceso no tiene permiso para este reporte.' : 'No fue posible consultar el reporte. Intente nuevamente.'));
    }

    ngOnDestroy()
    {
        this.consulta?.unsubscribe(); this.catalogos?.unsubscribe(); this.descarga?.unsubscribe();
    }
}
