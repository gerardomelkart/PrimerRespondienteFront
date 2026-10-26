import { Component, inject, output } from '@angular/core';
import { SessionService } from '../../core/services/session.service';

@Component({
    selector: 'app-inicio',
    templateUrl: './inicio.html'
})
export class InicioPage
{
    readonly session = inject(SessionService);
    readonly ir = output<'carga' | 'reporte-primer-respondiente'>();
}
