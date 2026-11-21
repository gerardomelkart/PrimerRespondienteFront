import { Component, inject, signal, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
interface Catalogos { anios:number[]; entidades:{id:number;nombre:string}[]; corporaciones:{codigo:string;nombre:string}[]; }
interface Entrega { modulo:string; folio:string; alcance:string; inicio:string; fin:string; reabierta:boolean; }
@Component({selector:'app-reaperturas',imports:[DatePipe,FormsModule],styles:[`
.filtros {display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;align-items:end}
.filtros label {display:grid;gap:6px}
.orden {border:0;background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}
.paginador, .grupo-pagina, .grupo-pagina label {display:flex;align-items:center;flex-wrap:wrap;gap:12px}
.paginador {justify-content:space-between;margin-top:16px;gap:16px}
.grupo-pagina label {margin:0;gap:8px}
.grupo-pagina select {width:auto;margin:0}
@media (max-width:600px) {.grupo-pagina {width:100%}}
`],template:`
<h1>Reapertura de entregas</h1><section class="tarjeta"><h2>Filtros de consulta</h2><div class="filtros">
<label>Año<select [(ngModel)]="anio" (ngModelChange)="filtrar()"><option value="">Todos</option>@for(a of catalogos().anios;track a){<option [value]="a">{{a}}</option>}</select></label>
<label>Mes<select [(ngModel)]="mes" (ngModelChange)="filtrar()"><option value="">Todos</option>@for(m of meses;track m;let i=$index){<option [value]="i+1">{{m}}</option>}</select></label>
<label>Periodo<select [(ngModel)]="quincena" (ngModelChange)="filtrar()"><option value="">Ambas quincenas</option><option value="1">Primera quincena</option><option value="2">Segunda quincena</option></select></label>
<label>Entidad<select [(ngModel)]="entidad" (ngModelChange)="filtrar()"><option value="">Todas</option>@for(e of catalogos().entidades;track e.id){<option [value]="e.id">{{e.nombre}}</option>}</select></label>
<label>Corporación<select [(ngModel)]="corporacion" (ngModelChange)="filtrar()"><option value="">Todas</option>@for(c of catalogos().corporaciones;track c.codigo){<option [value]="c.codigo">{{c.nombre}}</option>}</select></label>
<button class="secundario" (click)="limpiar()">Limpiar filtros</button></div></section><section class="tarjeta"><h2>Entregas vigentes</h2>
@if(mensaje()) { <p role="status">{{ mensaje() }}</p> }
<div class="tabla-scroll"><table><thead><tr>@for(c of columnas;track c.clave){<th scope="col" [attr.aria-sort]="orden===c.clave?(descendente?'descending':'ascending'):'none'"><button class="orden" (click)="ordenar(c.clave)">{{c.nombre}} {{orden===c.clave?(descendente?'▼':'▲'):'↕'}}</button></th>}</tr></thead>
<tbody>@for(e of entregas();track e.folio) { <tr><td>{{e.modulo}}</td><td>{{e.inicio|date:'dd/MM/yyyy'}} al {{e.fin|date:'dd/MM/yyyy'}}</td><td>{{e.alcance}}</td><td>{{e.folio}}</td><td>
@if(e.reabierta) { Autorizada para corrección } @else { <button class="secundario" [disabled]="ocupado()" (click)="preparar(e, dialogo)">Reabrir</button> }</td></tr> } @empty { <tr><td colspan="5">{{consultando()?'Consultando…':'Sin entregas para estos filtros.'}}</td></tr> }</tbody></table></div><nav class="paginador" aria-label="Paginación de entregas"><div class="grupo-pagina"><span>{{total()}} {{total() === 1 ? 'entrega' : 'entregas'}}</span><label>Filas por página <select [(ngModel)]="tamano" (ngModelChange)="filtrar()">@for(n of [20,50,100];track n){<option [ngValue]="n">{{n}}</option>}</select></label></div><div class="grupo-pagina"><button class="secundario" [disabled]="pagina<=1 || consultando()" (click)="mover(-1)">Anterior</button><span>Página {{pagina}} de {{paginas}}</span><button class="secundario" [disabled]="pagina>=paginas || consultando()" (click)="mover(1)">Siguiente</button></div></nav></section>
<dialog #dialogo><h2>Reabrir entrega</h2><p>¿Autorizar una corrección de {{elegida?.alcance}} para el folio {{elegida?.folio}}?</p>
<p>El acuse dejará de estar vigente al autorizar la reapertura.</p>
@if(afectadas().length) {
<p>También se reabrirán estas entregas completas de Fiscalía:</p>
<ul>@for(f of afectadas(); track f.id) { <li>{{f.alcance}} · {{f.folio}}</li> }</ul>
<p>Cuando Primer Respondiente confirme la corrección, cada fiscalía deberá descargar una plantilla nueva y entregar todas sus respuestas.</p>
}<div class="acciones"><button class="secundario" (click)="dialogo.close()">Cancelar</button><button class="primario" (click)="dialogo.close(); reabrir()">Autorizar reapertura</button></div></dialog>`})
export class ReaperturasPage implements OnDestroy {
    private http=inject(HttpClient);
    private consulta?:Subscription;
    private opciones?:Subscription;
    catalogos=signal<Catalogos>({anios:[],entidades:[],corporaciones:[]});
    entregas=signal<Entrega[]>([]); mensaje=signal(''); ocupado=signal(false); consultando=signal(false); total=signal(0);
    anio=''; mes=''; quincena=''; entidad=''; corporacion=''; pagina=1; tamano=20; orden='inicio'; descendente=true; elegida?:Entrega;
    readonly meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    readonly columnas=[{clave:'modulo',nombre:'Módulo'},{clave:'inicio',nombre:'Periodo'},{clave:'alcance',nombre:'Alcance'},{clave:'folio',nombre:'Folio vigente'},{clave:'reabierta',nombre:'Acción'}];
    constructor(){
        this.opciones=this.http.get<Catalogos>('api/reaperturas/catalogos').subscribe({next:r=>this.catalogos.set(r),error:()=>this.mensaje.set('No fue posible consultar los filtros.')});
        this.cargar();
    }
    ngOnDestroy(){this.consulta?.unsubscribe();this.opciones?.unsubscribe();}
    get paginas(){return Math.max(1,Math.ceil(this.total()/this.tamano));}
    limpiar(){this.anio=this.mes=this.quincena=this.entidad=this.corporacion='';this.filtrar();}
    ordenar(campo:string){this.descendente=this.orden===campo && !this.descendente;this.orden=campo;this.filtrar();}
    filtrar(){this.pagina=1;this.mensaje.set('');this.cargar();}
    mover(delta:number){this.pagina+=delta;this.cargar();}
    cargar(){
        this.consulta?.unsubscribe();
        const params:Record<string,string>={pagina:String(this.pagina),tamano:String(this.tamano),orden:this.orden,descendente:String(this.descendente)};
        for(const [k,v] of Object.entries({anio:this.anio,mes:this.mes,quincena:this.quincena,entidad:this.entidad,corporacion:this.corporacion})) if(v)params[k]=v;
        this.consultando.set(true);this.entregas.set([]);
        this.consulta=this.http.get<{total:number;filas:Entrega[]}>('api/reaperturas/consulta',{params}).subscribe({
            next:r=>{this.total.set(r.total);this.entregas.set(r.filas);this.consultando.set(false);},
            error:()=>{this.total.set(0);this.consultando.set(false);this.mensaje.set('No fue posible consultar las entregas.');}
        });
    }
    afectadas = signal<{id:number; folio:string; alcance:string}[]>([]);
    preparar(entrega:Entrega, dialogo:HTMLDialogElement){
        this.elegida=entrega;
        this.afectadas.set([]);
        if(entrega.modulo !== 'Primer respondiente'){ dialogo.showModal(); return; }
        this.ocupado.set(true);
        this.http.get<{id:number; folio:string; alcance:string}[]>('api/reaperturas/'+encodeURIComponent(entrega.folio)+'/impacto').subscribe({
            next:filas=>{this.afectadas.set(filas);this.ocupado.set(false);dialogo.showModal();},
            error:()=>{this.ocupado.set(false);this.mensaje.set('No fue posible consultar las entregas de Fiscalía afectadas.');}
        });
    }
    reabrir(){if(!this.elegida || this.ocupado())return;
        this.ocupado.set(true);
        this.http.post('api/reaperturas/'+encodeURIComponent(this.elegida.folio),{entregas:this.afectadas().map(f=>f.id)}).subscribe({
            next:()=>{this.mensaje.set('Reapertura autorizada para '+this.elegida!.folio+'.');this.ocupado.set(false);this.cargar();},
            error:e=>{this.mensaje.set(e.error?.mensaje ?? 'No fue posible reabrir la entrega.');this.ocupado.set(false);this.cargar();}
        });
    }
}
