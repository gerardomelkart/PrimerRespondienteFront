import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { COLUMNAS_PRIMER_REPORTE, REGISTROS_DEMO, fechaDemo } from '../../demo/datos-demo';

@Component({
    selector: 'app-carga-demo',
    imports: [FormsModule],
    templateUrl: './carga-demo.html',
    styleUrl: './carga-demo.css'
})
export class CargaDemoPage
{
    institucion = 'SEDENA';
    inicio = '2026-10-01';
    fin = '2026-10-31';
    nombre = '';
    paso = 1;
    observaciones = false;
    mensaje = '';
    arrastrando = false;
    readonly columnas = COLUMNAS_PRIMER_REPORTE;
    readonly instituciones = ['SEDENA', 'SEMAR', 'GN', 'SSPC'];
    readonly folio = 'DEMO-EM-PR-2026-0001';
    get muestra() { return REGISTROS_DEMO.filter(r => r['corporacion_reporta'] === this.institucion); }
    mostrar(valor: string) { return fechaDemo(valor); }

    elegir(archivo: File | null)
    {
        if(!archivo) { return; }
        this.reiniciar();
        if(!archivo.name.toLowerCase().endsWith('.xlsx'))
        {
            this.nombre = '';
            this.mensaje = 'Selecciona un archivo .xlsx o utiliza el archivo de ejemplo.';
            return;
        }
        // Solo se muestra el nombre: no se leen ni envían los bytes del archivo.
        this.nombre = archivo.name;
    }

    seleccionar(evento: Event)
    {
        const selector = evento.target as HTMLInputElement;
        this.elegir(selector.files?.[0] ?? null);
        selector.value = '';
    }

    soltar(evento: DragEvent)
    {
        evento.preventDefault();
        this.arrastrando = false;
        this.elegir(evento.dataTransfer?.files[0] ?? null);
    }

    ejemplo()
    {
        this.reiniciar();
        this.nombre = 'DEMO_Detenciones_' + this.institucion + '_Octubre_2026.xlsx';
    }

    reiniciar()
    {
        this.paso = 1;
        this.mensaje = '';
    }

    validar()
    {
        if(!this.nombre || !this.inicio || !this.fin || this.fin < this.inicio)
        {
            this.mensaje = 'Selecciona un archivo de ejemplo y un periodo válido.';
            return;
        }
        this.mensaje = '';
        this.paso = 2;
        this.desplazar();
    }

    confirmar()
    {
        this.paso = 3;
        this.desplazar();
    }

    nueva()
    {
        this.nombre = '';
        this.reiniciar();
        document.getElementById('titulo-carga-demo')?.scrollIntoView({ behavior: 'smooth' });
    }

    private desplazar()
    {
        setTimeout(() => document.getElementById('resultado-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
}
