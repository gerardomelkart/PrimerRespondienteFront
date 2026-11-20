import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
interface Catalogos { periodos:{ inicio:string;fin:string;nombre:string }[]; entidades:{id:number;nombre:string}[]; nacional:boolean; }
interface Reporte { columnas:string[]; filas:string[][]; }
@Component({selector:'app-completo',imports:[FormsModule],styleUrl:'./informes.css',styles:[`
.pie-reporte,.opciones-pagina,.navegacion-pagina,.opciones-pagina label {display:flex;align-items:center;flex-wrap:wrap;gap:12px}
.pie-reporte {justify-content:space-between;margin-top:16px}
.opciones-pagina label {margin:0}.opciones-pagina select {width:auto;margin:0}
`],template:`
<section class="tarjeta"><h2>Filtros de consulta</h2><div class="filtros-informe">
<label>Año<select [(ngModel)]="anio" (ngModelChange)="cambiarAnio()">@for(a of anios;track a){<option>{{a}}</option>}</select></label>
<label>Periodo de entrega<select [(ngModel)]="inicio" (ngModelChange)="consultar()">@for(p of periodos;track p.inicio){<option [value]="p.inicio">{{p.nombre}}</option>}</select></label>
@if(catalogos()?.nacional){<label>Entidad de detención<select [(ngModel)]="entidad" (ngModelChange)="consultar()"><option value="">Todas las de mi acceso</option>@for(e of catalogos()?.entidades;track e.id){<option [value]="e.id">{{e.nombre}}</option>}</select></label>}
<button class="secundario" [disabled]="!reporte()?.filas?.length" (click)="exportar()">Descargar Excel</button></div></section>
@if(mensaje()){<p role="status">{{mensaje()}}</p>}
@if(reporte();as r){<section class="tarjeta"><h2>Seguimiento ministerial</h2><p>{{r.filas.length}} filas @if(r.filas.length){· <button type="button" class="orden-columna" (click)="pie.focus();pie.scrollIntoView({block:'end'})">Ir al final de la tabla ↓</button>}</p><div class="tabla-informe"><table><thead><tr>@for(c of r.columnas;track c;let i=$index){<th><button class="orden-columna" (click)="ordenar(i)">{{c}} {{orden===i?(desc?'▼':'▲'):'↕'}}</button></th>}</tr></thead><tbody>
@for(f of r.filas.slice(pagina*tamano,(pagina+1)*tamano);track $index){<tr>@for(v of f;track $index){<td>{{v || '—'}}</td>}</tr>}</tbody></table></div>
<nav #pie tabindex="-1" class="pie-reporte" aria-label="Paginación del seguimiento ministerial">
<div class="opciones-pagina"><span>{{r.filas.length ? pagina*tamano+1 : 0}}–{{finPagina}} de {{r.filas.length}} filas</span>
<label>Filas por página <select [(ngModel)]="tamano" (ngModelChange)="pagina=0">@for(n of [10,20,50,100];track n){<option [ngValue]="n">{{n}}</option>}</select></label></div>
<div class="navegacion-pagina"><button class="secundario" [disabled]="pagina===0" (click)="pagina=pagina-1">Anterior</button>
<span aria-live="polite">Página {{pagina+1}} de {{paginas}}</span>
<button class="secundario" [disabled]="pagina+1>=paginas" (click)="pagina=pagina+1">Siguiente</button></div></nav></section>}`})
export class CompletoPage implements OnDestroy {
    private http=inject(HttpClient); private peticion?:Subscription;
    catalogos=signal<Catalogos|null>(null); reporte=signal<Reporte|null>(null); mensaje=signal('');
    anio='';inicio='';entidad='';pagina=0;tamano=20;orden=-1;desc=false;
    get paginas(){return Math.max(1,Math.ceil((this.reporte()?.filas.length ?? 0)/this.tamano));}
    get finPagina(){return Math.min((this.pagina+1)*this.tamano,this.reporte()?.filas.length ?? 0);}
    get anios(){return [...new Set(this.catalogos()?.periodos.map(p=>p.inicio.slice(0,4)))];}
    get periodos(){return this.catalogos()?.periodos.filter(p=>p.inicio.startsWith(this.anio)) ?? [];}
    constructor(){this.peticion=this.http.get<Catalogos>('api/informes/completo/catalogos').subscribe({next:c=>{this.catalogos.set(c);this.anio=this.anios[0]??'';this.cambiarAnio();},error:()=>this.mensaje.set('No fue posible cargar los periodos.')});}
    cambiarAnio(){this.inicio=this.periodos[0]?.inicio ?? '';this.consultar();}
    private params(){const p:Record<string,string>={inicio:this.inicio};if(this.entidad)p['entidad']=this.entidad;return p;}
    consultar(){this.peticion?.unsubscribe();this.reporte.set(null);this.pagina=0;this.orden=-1;
        if(!this.inicio){this.mensaje.set('Sin entregas confirmadas para su acceso.');return;}
        this.mensaje.set('Consultando…');this.peticion=this.http.get<Reporte>('api/informes/completo',{params:this.params()}).subscribe({next:r=>{this.reporte.set(r);this.mensaje.set('');},error:()=>this.mensaje.set('No fue posible consultar el reporte.')});}
    ordenar(i:number){const r=this.reporte();if(!r)return;this.desc=this.orden===i && !this.desc;this.orden=i;this.pagina=0;
        const cmp=new Intl.Collator('es',{numeric:true});this.reporte.set({...r,filas:[...r.filas].sort((a,b)=>cmp.compare(a[i],b[i])*(this.desc?-1:1))});}
    exportar(){const periodo=this.periodos.find(p=>p.inicio===this.inicio);if(!periodo)return;
        this.http.get('api/informes/completo',{params:{...this.params(),excel:'true'},responseType:'blob'}).subscribe({next:b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Reporte_completo_'+periodo.inicio.slice(0,10)+'_al_'+periodo.fin.slice(0,10)+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},error:()=>this.mensaje.set('No fue posible exportar el reporte.')});}
    ngOnDestroy(){this.peticion?.unsubscribe();}
}
