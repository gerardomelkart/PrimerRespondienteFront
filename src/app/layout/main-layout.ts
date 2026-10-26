import { Component, inject } from '@angular/core';
import { SessionService } from '../core/services/session.service';
import { InicioPage } from '../pages/inicio/inicio';
import { CargaPage } from '../pages/carga/carga';
import { UsuariosPage } from '../pages/usuarios/usuarios';
import { InformesPage } from '../pages/informes/informes';

@Component({
    selector: 'app-main-layout',
    imports: [InicioPage, CargaPage, UsuariosPage, InformesPage],
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.css'
})
export class MainLayout
{
    readonly session = inject(SessionService);
    pagina: 'inicio' | 'carga' | 'reporte-primer-respondiente' | 'reporte-completo' | 'usuarios' = 'inicio';
    informesAbierto = false;
    administracionAbierta = false;
    cargaAbierta = false;
    menuAbierto = false;

    get tituloPagina()
    {
        switch(this.pagina)
        {
            case 'carga': return 'Integrar información';
            case 'reporte-primer-respondiente': return 'Reporte primer respondiente';
            case 'reporte-completo': return 'Reporte completo';
            case 'usuarios': return 'Usuarios';
            default: return 'Inicio';
        }
    }

    navegar(pagina: typeof this.pagina)
    {
        this.pagina = pagina;
        if(pagina === 'carga')
        {
            this.cargaAbierta = true;
        }
        if(pagina === 'reporte-primer-respondiente' || pagina === 'reporte-completo')
        {
            this.informesAbierto = true;
        }
        if(pagina === 'usuarios')
        {
            this.administracionAbierta = true;
        }
        this.menuAbierto = false;
    }
}
