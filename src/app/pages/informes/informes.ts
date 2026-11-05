import { Component, ElementRef, ViewChild, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { COLUMNAS_PRIMER_REPORTE, GRUPOS_DEMO, REGISTROS_DEMO, descargarCsvDemo, fechaDemo } from '../../demo/datos-demo';

@Component({
    selector: 'app-informes',
    imports: [FormsModule],
    templateUrl: './informes.html',
    styleUrl: './informes.css'
})
export class InformesPage
{
    @ViewChild('detalle', { static: true }) private detalle!: ElementRef<HTMLDialogElement>;
    readonly completo = input(false);
    readonly grupos = GRUPOS_DEMO;
    readonly instituciones = [...new Set(REGISTROS_DEMO.map(r => r['corporacion_reporta']))].sort();
    readonly entidades = [...new Set(REGISTROS_DEMO.map(r => r['entidad']))].sort();
    institucion = '';
    entidad = '';
    fuero = '';
    estado = '';
    busqueda = '';
    inicio = '';
    fin = '';
    pagina = 1;
    readonly porPagina = 10;
    seleccionado: Readonly<Record<string, string>> | null = null;

    get columnas()
    {
        return this.completo() ? this.grupos.flatMap(g => g.columnas) : COLUMNAS_PRIMER_REPORTE;
    }

    get filtrados()
    {
        const texto = this.busqueda.trim().toLocaleLowerCase('es');
        return REGISTROS_DEMO.filter(r => (!this.institucion || r['corporacion_reporta'] === this.institucion)
            && (!this.entidad || r['entidad'] === this.entidad)
            && (!this.fuero || r['tipo_fuero'] === this.fuero)
            && (!this.estado || r['estado'] === this.estado)
            && (!this.inicio || r['fecha_detencion_corporacion'] >= this.inicio)
            && (!this.fin || r['fecha_detencion_corporacion'] <= this.fin)
            && (!texto || Object.values(r).some(v => v.toLocaleLowerCase('es').includes(texto))));
    }

    get paginas() { return Math.max(1, Math.ceil(this.filtrados.length / this.porPagina)); }
    get visibles() { return this.filtrados.slice((this.pagina - 1) * this.porPagina, this.pagina * this.porPagina); }
    contar(estado: string) { return this.filtrados.filter(r => r['estado'] === estado).length; }
    mostrar(valor: string) { return fechaDemo(valor); }
    filtrar() { this.pagina = 1; }

    limpiar()
    {
        this.institucion = this.entidad = this.fuero = this.estado = this.busqueda = this.inicio = this.fin = '';
        this.pagina = 1;
    }

    ver(registro: Readonly<Record<string, string>>)
    {
        this.seleccionado = registro;
        this.detalle.nativeElement.showModal();
    }

    cerrar() { this.detalle.nativeElement.close(); }

    exportar()
    {
        descargarCsvDemo(this.columnas, this.filtrados, this.completo() ? 'DEMO_Reporte_completo.csv' : 'DEMO_Primer_respondiente.csv');
    }
}
