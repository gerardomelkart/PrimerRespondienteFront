import { Component, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface Opciones { periodos: { inicio: string; fin: string; nombre: string }[]; }
@Component({
    selector: 'app-fiscalias', imports: [FormsModule], templateUrl: './fiscalias.html', styleUrl: './fiscalias.css'
})
export class FiscaliasPage
{
    private readonly espera = viewChild<ElementRef<HTMLDialogElement>>('espera');
    private readonly http = inject(HttpClient);
    readonly opciones = signal<Opciones | null>(null);
    readonly ocupado = signal(false);
    readonly mensaje = signal('');
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
    cambiarAnio() { this.periodo = this.periodos[0] ? this.valor(this.periodos[0]) : ''; }
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
