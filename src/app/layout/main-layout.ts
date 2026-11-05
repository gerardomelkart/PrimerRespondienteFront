import { Component, inject, input } from '@angular/core';
import { SessionService } from '../core/services/session.service';
import { InicioPage } from '../pages/inicio/inicio';
import { CargaPage } from '../pages/carga/carga';
import { UsuariosPage } from '../pages/usuarios/usuarios';
import { CargaDemoPage } from '../pages/carga-demo/carga-demo';
import { Usuario } from '../core/models/modelos';
import { InformesPage } from '../pages/informes/informes';

@Component({
    selector: 'app-main-layout',
    imports: [InicioPage, CargaPage, UsuariosPage, InformesPage, CargaDemoPage],
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.css'
})
export class MainLayout
{
    readonly demo = input(false);
    readonly session = inject(SessionService);
    pagina: 'inicio' | 'carga' | 'carga-demo' | 'reporte-primer-respondiente' | 'reporte-completo' | 'usuarios' = 'inicio';
    informesAbierto = false;
    administracionAbierta = false;
    cargaAbierta = false;
    menuAbierto = false;

    get usuario(): Usuario
    {
        return this.demo() ? { id: 0, usuario: 'demo', nombre: 'Presentación del sistema', rol: 'CONSULTA', institucion: null, ambito: 'NACIONAL', entidad: null } : this.session.sesion()!.usuario;
    }

    salir()
    {
        if(this.demo())
        {
            window.location.assign(window.location.pathname);
            return;
        }
        this.session.cerrar();
    }

    get tituloPagina()
    {
        switch(this.pagina)
        {
            case 'carga-demo': return 'Carga de demostración';
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
