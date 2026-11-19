import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
interface Entrega { modulo:string; folio:string; alcance:string; inicio:string; fin:string; reabierta:boolean; }
@Component({selector:'app-reaperturas',imports:[DatePipe,FormsModule],template:`
<h1>Reapertura de entregas</h1><section class="tarjeta"><label for="buscarEntrega">Buscar por folio, corporación o entidad</label>
<input id="buscarEntrega" type="search" [(ngModel)]="buscar">
@if(mensaje()) { <p role="status">{{ mensaje() }}</p> }
<div class="tabla-scroll"><table><thead><tr><th>Módulo</th><th>Periodo</th><th>Alcance</th><th>Folio vigente</th><th>Acción</th></tr></thead>
<tbody>@for(e of visibles;track e.folio) { <tr><td>{{e.modulo}}</td><td>{{e.inicio|date:'dd/MM/yyyy'}} al {{e.fin|date:'dd/MM/yyyy'}}</td><td>{{e.alcance}}</td><td>{{e.folio}}</td><td>
@if(e.reabierta) { Autorizada para corrección } @else { <button class="secundario" [disabled]="ocupado()" (click)="elegida=e; dialogo.showModal()">Reabrir</button> }</td></tr> } @empty { <tr><td colspan="5">Sin entregas para mostrar.</td></tr> }</tbody></table></div></section>
<dialog #dialogo><h2>Reabrir entrega</h2><p>¿Autorizar una corrección de {{elegida?.alcance}} para el folio {{elegida?.folio}}?</p>
<p>La entrega actual seguirá vigente hasta confirmar la corrección.</p><div class="acciones"><button class="secundario" (click)="dialogo.close()">Cancelar</button><button class="primario" (click)="dialogo.close(); reabrir()">Autorizar reapertura</button></div></dialog>`})
export class ReaperturasPage {
    private http=inject(HttpClient);
    entregas=signal<Entrega[]>([]); mensaje=signal(''); ocupado=signal(false); buscar=''; elegida?:Entrega;
    constructor(){ this.cargar(); }
    get visibles(){const q=this.buscar.trim().toLocaleLowerCase();return this.entregas().filter(e=>[e.folio,e.alcance,e.modulo].join(' ').toLocaleLowerCase().includes(q));}
    cargar(){this.http.get<Entrega[]>('api/reaperturas').subscribe({next:r=>this.entregas.set(r),error:()=>this.mensaje.set('No fue posible consultar las entregas.')});}
    reabrir(){if(!this.elegida || this.ocupado())return;
        this.ocupado.set(true);
        this.http.post('api/reaperturas/'+encodeURIComponent(this.elegida.folio),{}).subscribe({
            next:()=>{this.mensaje.set('Reapertura autorizada para '+this.elegida!.folio+'.');this.ocupado.set(false);this.cargar();},
            error:e=>{this.mensaje.set(e.error?.mensaje ?? 'No fue posible reabrir la entrega.');this.ocupado.set(false);this.cargar();}
        });
    }
}
