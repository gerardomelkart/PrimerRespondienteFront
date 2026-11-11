import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccesoUsuario, Usuario } from '../core/models/modelos';
import { SessionService } from '../core/services/session.service';
import { InicioPage } from '../pages/inicio/inicio';
import { CargaPage } from '../pages/carga/carga';
import { UsuariosPage } from '../pages/usuarios/usuarios';
import { FiscaliasPage } from '../pages/fiscalias/fiscalias';
import { InformesPage } from '../pages/informes/informes';

@Component({
    selector: 'app-main-layout',
    imports: [FormsModule, InicioPage, CargaPage, UsuariosPage, InformesPage, FiscaliasPage],
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.css'
})
export class MainLayout
{
    readonly session = inject(SessionService);
    private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
    pagina: 'inicio' | 'carga' | 'reporte-primer-respondiente' | 'reporte-completo' | 'usuarios' | 'fiscalias' = 'inicio';
    desplegable: 'informes' | 'cuenta' | null = null;
    menuAbierto = false;
    readonly cambiandoAcceso = signal(false);
    readonly errorAcceso = signal('');

    get usuario(): Usuario
    {
        return this.session.sesion()!.usuario;
    }

    get puedeCargar()
    {
        return this.usuario.rol === 'PRIMER_RESPONDIENTE' || this.usuario.rol === 'SUPER_USUARIO';
    }

    get puedeFiscalias() { return this.usuario.rol === 'SUPER_USUARIO' || (this.usuario.rol === 'FISCALIA' && this.usuario.institucion === 'FGR' && this.usuario.ambito === 'NACIONAL'); }

    get esInforme()
    {
        return this.pagina === 'reporte-primer-respondiente' || this.pagina === 'reporte-completo';
    }

    descripcionAcceso(acceso: AccesoUsuario)
    {
        return `${acceso.rol.replaceAll('_', ' ')} · ${acceso.institucion || 'Todas las instituciones'} · ${acceso.ambito === 'NACIONAL' ? 'Nacional' : 'Entidad ' + acceso.entidad}`;
    }

    cambiarAcceso(id: number)
    {
        if(this.cambiandoAcceso() || id === this.usuario.idAcceso)
        {
            return;
        }
        this.cambiandoAcceso.set(true);
        this.errorAcceso.set('');
        this.session.cambiarAcceso(id).subscribe({
            next: () =>
            {
                this.navegar('inicio');
                this.cambiandoAcceso.set(false);
            },
            error: () =>
            {
                this.errorAcceso.set('No fue posible cambiar de acceso.');
                this.cambiandoAcceso.set(false);
            }
        });
    }

    alternar(tipo: 'informes' | 'cuenta')
    {
        this.desplegable = this.desplegable === tipo ? null : tipo;
    }

    @HostListener('document:click', ['$event'])
    cerrarFuera(evento: MouseEvent)
    {
        if(!(evento.target instanceof Element) || !this.elemento.nativeElement.contains(evento.target)
            || !evento.target.closest('.nav-desplegable'))
        {
            this.desplegable = null;
        }
    }

    @HostListener('document:keydown.escape')
    cerrarMenus()
    {
        if(!this.desplegable && !this.menuAbierto)
        {
            return;
        }
        const boton = this.menuAbierto ? '#boton-menu' : `#boton-${this.desplegable}`;
        this.desplegable = null;
        this.menuAbierto = false;
        this.elemento.nativeElement.querySelector<HTMLButtonElement>(boton)?.focus();
    }

    salir()
    {
        this.session.cerrar();
    }

    get tituloPagina()
    {
        switch(this.pagina)
        {
            case 'carga': return 'Integrar información';
            case 'reporte-primer-respondiente': return 'Reporte primer respondiente';
            case 'reporte-completo': return 'Reporte completo';
            case 'fiscalias': return 'Plantilla de fiscalías';
            case 'usuarios': return 'Usuarios';
            default: return 'Inicio';
        }
    }

    navegar(pagina: typeof this.pagina)
    {
        if((pagina === 'fiscalias' && !this.puedeFiscalias)
            || (pagina === 'carga' && !this.puedeCargar)
            || (pagina === 'usuarios' && this.usuario.rol !== 'SUPER_USUARIO')
            || (pagina === 'reporte-completo' && this.usuario.rol === 'PRIMER_RESPONDIENTE'))
        {
            return;
        }
        this.pagina = pagina;
        this.menuAbierto = false;
        this.desplegable = null;
    }
}
