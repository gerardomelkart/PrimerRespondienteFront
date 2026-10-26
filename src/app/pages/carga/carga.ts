import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SessionService } from '../../core/services/session.service';
import { CargasService } from '../../core/services/cargas.service';
import { Carga, Validacion, Usuario } from '../../core/models/modelos';

@Component({
    selector: 'app-carga',
    imports: [CommonModule, FormsModule],
    templateUrl: './carga.html'
})
export class CargaPage
{
    readonly session = inject(SessionService);
    private readonly cargasService = inject(CargasService);
    readonly ocupado = signal(false);
    readonly mensaje = signal('');
    readonly validacion = signal<Validacion | null>(null);
    readonly aceptada = signal<Carga | null>(null);
    inicio = '';
    fin = '';
    archivo: File | null = null;
    arrastrando = false;

    seleccionar(evento: Event)
    {
        this.elegir((evento.target as HTMLInputElement).files?.[0] ?? null);
    }
    soltar(evento: DragEvent)
    {
        evento.preventDefault();
        this.arrastrando = false;
        if(!this.ocupado())
        {
            this.elegir(evento.dataTransfer?.files[0] ?? null);
        }
    }
    elegir(archivo: File | null)
    {
        this.validacion.set(null);
        this.aceptada.set(null);
        this.mensaje.set('');
        if(archivo && (!archivo.name.toLowerCase().endsWith('.xlsx') || archivo.size > 10000000))
        {
            this.archivo = null;
            this.mensaje.set('Seleccione un Excel .xlsx de hasta 10 MB.');
            return;
        }
        this.archivo = archivo;
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
        if(!this.inicio || !this.fin || this.fin < this.inicio)
        {
            this.mensaje.set('Seleccione el inicio y fin del periodo.');
            return;
        }
        this.ocupado.set(true);
        this.mensaje.set('');
        this.validacion.set(null);
        this.aceptada.set(null);
        this.cargasService.validar(this.archivo, this.inicio, this.fin).subscribe({
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
