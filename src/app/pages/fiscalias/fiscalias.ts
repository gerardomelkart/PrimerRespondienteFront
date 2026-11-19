import { Component, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface Validacion { esperados: number; recibidos: number; noRecibidos: number; errores: { fila: number | null; campo: string; detalle: string }[]; }
interface Opciones { periodos: { inicio: string; fin: string; nombre: string }[]; }
@Component({
    selector: 'app-fiscalias', imports: [FormsModule, DecimalPipe], templateUrl: './fiscalias.html', styleUrl: './fiscalias.css'
})
export class FiscaliasPage
{
    private readonly espera = viewChild<ElementRef<HTMLDialogElement>>('espera');
    private readonly http = inject(HttpClient);
    readonly opciones = signal<Opciones | null>(null);
    readonly ocupado = signal(false);
    readonly mensaje = signal('');
    readonly resultado = signal<Validacion | null>(null);
    paginaErrores = 0;
    archivo?: File;
    arrastrando = false;
    limpiar() { this.archivo = undefined; this.arrastrando = false; this.resultado.set(null); this.paginaErrores = 0; this.mensaje.set(''); }
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
    validar()
    {
        const archivo = this.archivo;
        if(!archivo || !this.periodo || this.ocupado()) return;
        this.resultado.set(null); this.paginaErrores = 0; this.mensaje.set('');
        const [inicio, fin] = this.periodo.split('|');
        const form = new FormData();
        form.append('archivo', archivo);
        this.ocupado.set(true);
        this.peticion = this.http.post<Validacion>('api/fiscalias/validar', form, { params: { inicio, fin } }).subscribe({
            next: r => { this.resultado.set(r); this.ocupado.set(false); },
            error: e => { this.mensaje.set(e.error?.mensaje ?? 'No fue posible validar el archivo.'); this.ocupado.set(false); }
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
    ngOnDestroy() { this.peticion?.unsubscribe(); }
}
