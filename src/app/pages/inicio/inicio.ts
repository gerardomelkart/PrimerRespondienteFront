import { Component, inject, output } from '@angular/core';
import { SessionService } from '../../core/services/session.service';

@Component({
    selector: 'app-inicio',
    templateUrl: './inicio.html',
    styleUrl: './inicio.css'
})
export class InicioPage
{
    readonly session = inject(SessionService);
    get puedeCargar()
    {
        const rol = this.session.sesion()!.usuario.rol;
        return rol === 'PRIMER_RESPONDIENTE' || rol === 'SUPER_USUARIO';
    }

    readonly ir = output<'carga' | 'reporte-primer-respondiente' | 'reporte-completo' | 'usuarios'>();
}
