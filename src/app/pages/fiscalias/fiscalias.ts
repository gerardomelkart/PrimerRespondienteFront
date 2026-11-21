import { Component, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface Entrega { omitidos?: number; id: number; folio: string; inicio: string; fin: string; recibidos: number; noRecibidos: number; }
interface Validacion { omitidos?: number; previo?: string; esperados: number; recibidos: number; noRecibidos: number; errores: { fila: number | null; campo: string; detalle: string }[]; }
interface Opciones { enCorreccion?: { inicio:string; nombre:string }[]; entregas: Entrega[]; periodos: { inicio: string; fin: string; nombre: string }[]; }
@Component({
    selector: 'app-fiscalias', imports: [FormsModule, DecimalPipe, DatePipe], templateUrl: './fiscalias.html', styleUrls: ['../carga/carga.css', './fiscalias.css']
})
export class FiscaliasPage
{
    private readonly espera = viewChild<ElementRef<HTMLDialogElement>>('espera');
    private readonly http = inject(HttpClient);
    readonly opciones = signal<Opciones | null>(null);
    readonly ocupado = signal(false);
    readonly mensaje = signal('');
    readonly resultado = signal<Validacion | null>(null);
    private readonly tablaResultados = viewChild<ElementRef<HTMLDivElement>>('tablaResultados');
    paginaResultado = 1;
    filasPorPagina = 20;
    get totalPaginas()
    {
        return Math.max(1, Math.ceil((this.resultado()?.errores ?? []).length / this.filasPorPagina));
    }

    get incidenciasPagina()
    {
        const inicio = (this.paginaResultado - 1) * this.filasPorPagina;
        return (this.resultado()?.errores ?? []).slice(inicio, inicio + this.filasPorPagina);
    }

    get paginasVisibles()
    {
        const inicio = Math.max(1, Math.min(this.paginaResultado - 2, this.totalPaginas - 4));
        return Array.from({ length: Math.min(5, this.totalPaginas) }, (_, indice) => inicio + indice);
    }

    irAPagina(pagina: number | null)
    {
        this.paginaResultado = Math.min(this.totalPaginas, Math.max(1, Math.trunc(Number(pagina)) || 1));
        if(this.tablaResultados())
        {
            this.tablaResultados()!.nativeElement.scrollTop = 0;
        }
    }


    entrega = signal<Entrega | null>(null);
    aceptada = false;
    archivo?: File;
    arrastrando = false;
    readonly modal = viewChild.required<ElementRef<HTMLDialogElement>>('modalAcuse');
    private readonly sanitizer = inject(DomSanitizer);
    readonly pdf = signal<SafeResourceUrl | null>(null);
    private pdfUrl = '';
    readonly errorPdf = signal('');
    readonly columnasHistorial = [{ campo: 'inicio', nombre: 'Periodo de entrega' }, { campo: 'folio', nombre: 'Folio' }, { campo: 'recibidos', nombre: 'Recibidas' }, { campo: 'noRecibidos', nombre: 'No recibidas' }] as const;
    ordenHistorial: 'inicio' | 'folio' | 'recibidos' | 'noRecibidos' = 'inicio';
    historialDesc = true;
    ordenarHistorial(campo: typeof this.ordenHistorial) {
        this.historialDesc = this.ordenHistorial === campo ? !this.historialDesc : false;
        this.ordenHistorial = campo;
    }
    get historial() {
        const comparador = new Intl.Collator('es', { numeric: true });
        return [...(this.opciones()?.entregas ?? [])].sort((a, b) =>
            comparador.compare(String(a[this.ordenHistorial]), String(b[this.ordenHistorial])) * (this.historialDesc ? -1 : 1));
    }
    readonly columnas = [{ campo: 'fila', nombre: 'Fila del Excel' }, { campo: 'campo', nombre: 'Campo' }, { campo: 'detalle', nombre: 'Detalle' }] as const;
    verEntrega(entrega: Entrega) {
        this.periodo = this.valor(entrega); this.entrega.set(entrega); this.abrirAcuse();
    }
    volver() { this.limpiar(); this.cargar(); }
    private conflicto(e: HttpErrorResponse) {
        if(!e.error?.entrega) return false;
        this.entrega.set(e.error.entrega); this.mensaje.set(e.error.mensaje);
        return true;
    }

    private liberarPdf() {
        if(this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
        this.pdfUrl = ''; this.pdf.set(null); this.errorPdf.set('');
    }
    private mostrarPdf(blob: Blob) {
        this.liberarPdf();
        this.pdfUrl = URL.createObjectURL(blob);
        this.pdf.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl + '#toolbar=0'));
    }
    abrirAcuse() {
        const dialogo = this.modal().nativeElement;
        if(!dialogo.open) dialogo.showModal();
        this.liberarPdf();
        const entrega = this.entrega();
        if(entrega) {
            this.ocupado.set(true);
            this.peticion = this.http.get('api/fiscalias/entregas/' + entrega.id + '/acuse', { responseType: 'blob' }).subscribe({
                next: blob => { this.mostrarPdf(blob); this.ocupado.set(false); },
                error: () => { this.errorPdf.set('La entrega está confirmada. Intente abrir el acuse nuevamente.'); this.ocupado.set(false); }
            });
        } else if(this.resultado()?.previo) {
            const bytes = Uint8Array.from(atob(this.resultado()!.previo!), c => c.charCodeAt(0));
            this.mostrarPdf(new Blob([bytes], { type: 'application/pdf' }));
        } else this.errorPdf.set('Vuelva a validar la plantilla para obtener la vista previa.');
    }
    cerrarAcuse(evento?: Event) {
        evento?.preventDefault();
        if(this.ocupado()) return;
        this.modal().nativeElement.close(); this.aceptada = false; this.liberarPdf();
    }
    private nombrePeriodo() { return this.periodo.split('|').map(v => v.split('-').reverse().join('-')).join('_al_'); }
    private guardar(url: string, nombre: string) {
        const enlace = document.createElement('a');
        enlace.href = url; enlace.download = nombre; enlace.click();
    }
    descargarPdf() {
        if(this.pdfUrl) this.guardar(this.pdfUrl, (this.entrega() ? 'Acuse_Fiscalia_' : 'Vista_previa_Fiscalia_') + this.nombrePeriodo() + '.pdf');
    }
    exportarErrores() {
        this.ocupado.set(true);
        this.peticion = this.http.post('api/fiscalias/errores/excel', this.resultado()!.errores, { responseType: 'blob' }).subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                this.guardar(url, 'Errores_Fiscalia_' + this.nombrePeriodo() + '.xlsx');
                setTimeout(() => URL.revokeObjectURL(url), 1000); this.ocupado.set(false);
            },
            error: () => { this.mensaje.set('No fue posible descargar los errores.'); this.ocupado.set(false); }
        });
    }
    ordenarPor(campo: 'fila' | 'campo' | 'detalle') {
        const r = this.resultado();
        if(!r) return;
        this.desc = this.orden === campo && !this.desc;
        this.orden = campo;
        const comparador = new Intl.Collator('es', { numeric: true });
        this.resultado.set({ ...r, errores: [...r.errores].sort((a,b) => comparador.compare(String(a[campo] ?? ''), String(b[campo] ?? '')) * (this.desc ? -1 : 1)) });
        this.irAPagina(1);
    }
    orden = ''; desc = false;
    limpiar() { this.liberarPdf(); this.orden = ''; this.desc = false; this.entrega.set(null); this.aceptada = false; this.archivo = undefined; this.arrastrando = false; this.resultado.set(null); this.irAPagina(1); this.mensaje.set(''); }
    seleccionar(files: FileList | null)
    {
        if(this.ocupado() || !files?.length) return;
        this.limpiar();
        const archivo = files[0];
        if(files.length !== 1 || !archivo.name.toLowerCase().endsWith('.xlsx') || !archivo.size)
            this.mensaje.set('Seleccione un solo archivo .xlsx con contenido.');
        else this.archivo = archivo;
    }
    soltar(evento: DragEvent)
    {
        evento.preventDefault();
        this.arrastrando = false;
        this.seleccionar(evento.dataTransfer?.files ?? null);
    }
    validar(confirmar = false)
    {
        const archivo = this.archivo;
        if(!archivo || !this.periodo || this.ocupado()) return;
        if(confirmar && (!this.aceptada || !this.resultado() || this.resultado()!.errores.length || this.entrega())) return;
        if(!confirmar) { this.resultado.set(null); this.aceptada = false; }
        this.irAPagina(1); this.mensaje.set('');
        const [inicio, fin] = this.periodo.split('|');
        const form = new FormData();
        form.append('archivo', archivo);
        this.ocupado.set(true);
        if(confirmar) {
            this.peticion = this.http.post<Entrega>('api/fiscalias/confirmar', form, { params: { inicio, fin } }).subscribe({
                next: entrega => {
                    this.entrega.set(entrega);
                    this.opciones.update(o => o && ({ ...o, entregas: [...(o.entregas ?? []).filter(e => e.id !== entrega.id), entrega] }));
                    this.ocupado.set(false); this.abrirAcuse();
                },
                error: e => {
                    this.ocupado.set(false); this.cerrarAcuse();
                    if(this.conflicto(e)) return;
                    if(e.error?.revision) this.resultado.set(e.error.revision.esperados ? e.error.revision : null);
                    this.aceptada = false; this.ocupado.set(false);
                    this.mensaje.set(e.error?.mensaje ?? 'No se pudo verificar la confirmación. Puede reintentar con el mismo archivo.');
                }
            });
            return;
        }
        this.peticion = this.http.post<Validacion>('api/fiscalias/validar', form, { params: { inicio, fin } }).subscribe({
            next: r => { this.resultado.set(r); this.ocupado.set(false); if(!r.errores.length) this.abrirAcuse(); },
            error: e => { this.ocupado.set(false); if(!this.conflicto(e)) this.mensaje.set(e.error?.mensaje ?? 'No fue posible validar el archivo.'); }
        });
    }
    anio = ''; periodo = '';
    private peticion?: Subscription;
    constructor()
    {
        this.cargar();
        afterRenderEffect(() => {
            const dialogo = this.espera()?.nativeElement;
            if(!dialogo) return;
            if(this.ocupado()) { if(!dialogo.open) dialogo.showModal(); }
            else if(dialogo.open) dialogo.close();
        });
    }
    get anios() { return [...new Set((this.opciones()?.periodos ?? []).map(p => p.inicio.slice(0, 4)))].sort().reverse(); }
    get periodos() { return (this.opciones()?.periodos ?? []).filter(p => p.inicio.startsWith(this.anio)); }
    cambiarAnio() { this.limpiar(); this.periodo = this.periodos[0] ? this.valor(this.periodos[0]) : ''; }
    valor(p: { inicio: string; fin: string }) { return p.inicio.slice(0, 10) + '|' + p.fin.slice(0, 10); }
    cargar()
    {
        this.ocupado.set(true); this.mensaje.set('');
        this.peticion = this.http.get<Opciones>('api/fiscalias/catalogos').subscribe({
            next: opciones => { this.opciones.set(opciones); this.anio = this.anios[0] ?? ''; this.cambiarAnio(); this.ocupado.set(false); },
            error: e => { this.ocupado.set(false); this.mensaje.set(e.status === 403 ? 'Este acceso no tiene permiso para la plantilla.' : 'No fue posible obtener los periodos. Intente nuevamente.'); }
        });
    }
    descargar()
    {
        if(this.ocupado() || !this.periodo) return;
        const [inicio, fin] = this.periodo.split('|');
        this.ocupado.set(true); this.mensaje.set('');
        this.peticion = this.http.get('api/fiscalias/plantilla', { params: new HttpParams().set('inicio', inicio).set('fin', fin), responseType: 'blob' }).subscribe({
            next: archivo => {
                const url = URL.createObjectURL(archivo); const enlace = document.createElement('a');
                const fecha = (v: string) => v.split('-').reverse().join('-');
                enlace.href = url; enlace.download = `Plantilla_Fiscalia_${fecha(inicio)}_al_${fecha(fin)}.xlsx`; enlace.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000); this.ocupado.set(false);
            },
            error: async (e: HttpErrorResponse) => {
                this.ocupado.set(false);
                try { this.mensaje.set(JSON.parse(await e.error.text()).mensaje ?? 'No fue posible generar la plantilla.'); }
                catch { this.mensaje.set('No fue posible generar la plantilla.'); }
            }
        });
    }
    ngOnDestroy() { this.liberarPdf(); this.peticion?.unsubscribe(); }
}
