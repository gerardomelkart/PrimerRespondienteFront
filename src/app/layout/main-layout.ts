import { Component, inject } from '@angular/core';
import { SessionService } from '../core/services/session.service';
import { InicioPage } from '../pages/inicio/inicio';
import { CargaPage } from '../pages/carga/carga';
import { EntregasPage } from '../pages/entregas/entregas';
import { UsuariosPage } from '../pages/usuarios/usuarios';

@Component({
    selector: 'app-main-layout',
    imports: [InicioPage, CargaPage, EntregasPage, UsuariosPage],
    templateUrl: './main-layout.html'
})
export class MainLayout
{
    readonly session = inject(SessionService);
    pagina: 'inicio' | 'carga' | 'entregas' | 'usuarios' = 'inicio';

    navegar(pagina: typeof this.pagina)
    {
        this.pagina = pagina;
    }
}
