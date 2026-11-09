import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SessionService } from '../../core/services/session.service';
import { CargasService } from '../../core/services/cargas.service';
import { Carga, Validacion, CatalogosUsuarios, CatalogosCarga } from '../../core/models/modelos';

@Component({
    selector: 'app-carga',
    imports: [CommonModule, FormsModule],
    templateUrl: './carga.html',
    styleUrl: './carga.css'
})
export class CargaPage
{
    readonly session = inject(SessionService);
    private readonly cargasService = inject(CargasService);
    readonly ocupado = signal(false);
    readonly mensaje = signal('');
    readonly validacion = signal<Validacion | null>(null);
    readonly aceptada = signal<Carga | null>(null);
    @ViewChild('selectorArchivo') private selectorArchivo?: ElementRef<HTMLInputElement>;
    readonly catalogos = signal<CatalogosCarga | null>(null);
    readonly cargandoCatalogos = signal(true);
    readonly instituciones = signal<CatalogosUsuarios['instituciones']>([]);
    institucion = '';

    constructor()
    {
        this.cargasService.catalogos().subscribe({
            next: datos =>
            {
                this.catalogos.set(datos);
                this.cargandoCatalogos.set(false);
            },
            error: error =>
            {
                this.cargandoCatalogos.set(false);
                this.error(error);
            }
        });
        if(this.session.sesion()?.usuario.rol === 'SUPER_USUARIO')
        {
            inject(HttpClient).get<CatalogosUsuarios>('api/catalogos/usuarios').subscribe({
                next: datos => this.instituciones.set(datos.instituciones.filter(i => i.tipo === 'CORPORACION')),
                error: error => this.error(error)
            });
        }
    }

    idPeriodo: number | null = null;

    get periodoSeleccionado()
    {
        return this.catalogos()?.periodos.find(p => p.id === this.idPeriodo);
    }
    archivo: File | null = null;
    arrastrando = false;

    seleccionar(evento: Event)
    {
        const archivo = (evento.target as HTMLInputElement).files?.[0];
        if(archivo)
        {
            this.elegir(archivo);
        }
    }
    soltar(evento: DragEvent)
    {
        evento.preventDefault();
        this.arrastrando = false;
        if(!this.ocupado() && this.catalogos())
        {
            this.elegir(evento.dataTransfer?.files[0] ?? null);
        }
    }
    elegir(archivo: File | null)
    {
        this.validacion.set(null);
        this.aceptada.set(null);
        this.mensaje.set('');
        if(archivo && (!this.catalogos() || !archivo.name.toLowerCase().endsWith('.xlsx')
            || archivo.size <= 0 || archivo.size > this.catalogos()!.limites.maximoBytes))
        {
            this.archivo = null;
            this.mensaje.set('Seleccione un Excel .xlsx con contenido y dentro del tamaño permitido.');
            return;
        }
        this.archivo = archivo;
    }
    quitarArchivo()
    {
        if(this.ocupado())
        {
            return;
        }
        this.elegir(null);
        if(this.selectorArchivo)
        {
            this.selectorArchivo.nativeElement.value = '';
        }
    }

    cambiarPeriodo()
    {
        this.validacion.set(null);
        this.aceptada.set(null);
    }
    validar()
    {
        if(!this.archivo || this.ocupado())
        {
            return;
        }
        if(this.session.sesion()?.usuario.rol === 'SUPER_USUARIO' && !this.institucion)
        {
            this.mensaje.set('Seleccione la corporación para esta carga.');
            return;
        }
        if(!this.periodoSeleccionado)
        {
            this.mensaje.set('Seleccione un periodo quincenal habilitado.');
            return;
        }
        this.ocupado.set(true);
        this.mensaje.set('');
        this.validacion.set(null);
        this.aceptada.set(null);
        this.cargasService.validar(this.archivo, this.idPeriodo!, this.institucion).subscribe({
            next: resultado =>
            {
                this.validacion.set(resultado);
                this.ocupado.set(false);
                setTimeout(() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            },
            error: error => this.error(error)
        });
    }
    confirmar()
    {
        const id = this.validacion()?.idCarga;
        if(!id || this.ocupado())
        {
            return;
        }
        this.ocupado.set(true);
        this.cargasService.confirmar(id).subscribe({
            next: carga =>
            {
                this.aceptada.set(carga);
                this.validacion.set(null);
                this.ocupado.set(false);
            },
            error: error => this.error(error)
        });
    }
    descargar(ruta: string, nombre: string)
    {
        this.cargasService.descargar(ruta).subscribe({
            next: blob =>
            {
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = nombre;
                enlace.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            },
            error: error => this.error(error)
        });
    }
    private error(error: HttpErrorResponse)
    {
        this.ocupado.set(false);
        const detalle = error.error?.mensaje;
        this.mensaje.set(detalle ?? (error.status === 0 ? 'No se pudo conectar con la API.' : error.status === 401 ? 'Usuario o contraseña incorrectos, o sesión vencida.' : error.status === 403 ? 'No tiene permisos para esta operación.' : error.status === 429 ? 'Demasiados intentos. Espere un minuto.' : 'No fue posible completar la operación. Revise los datos e intente de nuevo.'));
    }
}
