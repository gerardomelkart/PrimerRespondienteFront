import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SessionService } from '../../core/services/session.service';
import { CargasService } from '../../core/services/cargas.service';
import { Carga, Validacion, Usuario } from '../../core/models/modelos';

@Component({
    selector: 'app-inicio',
    imports: [CommonModule, FormsModule],
    templateUrl: './inicio.html'
})
export class InicioPage
{
    readonly session = inject(SessionService);
    private readonly cargasService = inject(CargasService);
    readonly cargas = signal<Carga[]>([]);
    readonly mensaje = signal('');
    readonly ocupado = signal(false);
    readonly ir = output<'carga' | 'entregas'>();

    constructor()
    {
        this.cargarEntregas();
    }

    cargarEntregas()
    {
        if(this.session.sesion()?.usuario.rol === 'FISCALIA')
        {
            return;
        }
        this.cargasService.listar().subscribe({ next: cargas => this.cargas.set(cargas), error: error => this.error(error) });
    }
    private error(error: HttpErrorResponse)
    {
        this.ocupado.set(false);
        const detalle = error.error?.mensaje;
        this.mensaje.set(detalle ?? (error.status === 0 ? 'No se pudo conectar con la API.' : error.status === 401 ? 'Usuario o contraseña incorrectos, o sesión vencida.' : error.status === 403 ? 'No tiene permisos para esta operación.' : error.status === 429 ? 'Demasiados intentos. Espere un minuto.' : 'No fue posible completar la operación. Revise los datos e intente de nuevo.'));
    }
}
