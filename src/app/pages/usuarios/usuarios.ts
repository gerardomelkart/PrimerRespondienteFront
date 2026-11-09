import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AccesoUsuario, CatalogosUsuarios, Usuario } from '../../core/models/modelos';
import { SessionService } from '../../core/services/session.service';

@Component({
    selector: 'app-usuarios',
    imports: [FormsModule],
    templateUrl: './usuarios.html',
    styleUrl: './usuarios.css'
})
export class UsuariosPage
{
    @ViewChild('editor', { static: true }) private editor!: ElementRef<HTMLDialogElement>;
    private readonly http = inject(HttpClient);
    private readonly session = inject(SessionService);
    readonly ocupado = signal(false);
    readonly cargando = signal(false);
    readonly mensaje = signal('');
    readonly mensajeFormulario = signal('');
    readonly usuarios = signal<Usuario[]>([]);
    readonly catalogos = signal<CatalogosUsuarios>({ entidades: [], instituciones: [], perfiles: [], ambitos: [] });
    readonly busqueda = signal('');
    readonly pagina = signal(1);
    readonly porPagina = 15;
    editando: number | null = null;
    get perfiles()
    {
        return this.catalogos().perfiles;
    }

    perfil(acceso: AccesoUsuario)
    {
        return this.perfiles.find(p => p.codigo === acceso.rol);
    }

    ambitos(acceso: AccesoUsuario)
    {
        const perfil = this.perfil(acceso);
        return perfil ? this.catalogos().ambitos.filter(a => perfil.permiteEstatal || !a.requiereEntidad) : [];
    }

    readonly filtrados = computed(() =>
    {
        const texto = this.normalizar(this.busqueda());
        return this.usuarios().filter(usuario => this.normalizar([
            usuario.nombre, usuario.usuario, usuario.activo ? 'activo' : 'inactivo',
            ...(usuario.accesos ?? []).map(a => this.descripcion(a))
        ].join(' ')).includes(texto));
    });
    readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.porPagina)));
    readonly paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas()));
    readonly visibles = computed(() => this.filtrados().slice((this.paginaActual() - 1) * this.porPagina, this.paginaActual() * this.porPagina));
    nuevo = this.usuarioVacio();

    constructor()
    {
        this.cargarUsuarios();
    }

    nombrePerfil(rol: string)
    {
        return this.perfiles.find(perfil => perfil.codigo === rol)?.nombre ?? rol;
    }

    contar(rol: string)
    {
        return this.usuarios().filter(u => u.activo && u.accesos?.some(a => a.rol === rol)).length;
    }

    activos()
    {
        return this.usuarios().filter(u => u.activo).length;
    }

    descripcion(acceso: AccesoUsuario)
    {
        const institucion = this.catalogos().instituciones.find(i => i.codigo === acceso.institucion)?.nombre ?? 'Todas las instituciones';
        const alcance = acceso.ambito === 'NACIONAL' ? 'Nacional' : this.catalogos().entidades.find(e => e.id === acceso.entidad)?.nombre ?? 'Entidad sin catálogo';
        return `${this.nombrePerfil(acceso.rol)} · ${institucion} · ${alcance}`;
    }

    instituciones(acceso: AccesoUsuario)
    {
        const tipo = this.perfil(acceso)?.tipoInstitucion;
        return this.catalogos().instituciones.filter(i => !tipo || i.tipo === tipo);
    }

    private normalizar(valor: string)
    {
        return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    accesoVacio(): AccesoUsuario
    {
        return { rol: '', institucion: null, ambito: '', entidad: null };
    }

    usuarioVacio()
    {
        return { usuario: '', nombre: '', password: '', activo: true, accesos: [this.accesoVacio()] };
    }

    abrirNuevo()
    {
        this.editando = null;
        this.nuevo = this.usuarioVacio();
        this.mensajeFormulario.set('');
        this.editor.nativeElement.showModal();
    }

    editar(usuario: Usuario)
    {
        this.editando = usuario.id;
        this.nuevo = { usuario: usuario.usuario, nombre: usuario.nombre, password: '', activo: usuario.activo !== false,
            accesos: (usuario.accesos ?? []).map(a => ({ ...a })) };
        this.mensajeFormulario.set('');
        this.editor.nativeElement.showModal();
    }

    cambiarPerfil(acceso: AccesoUsuario)
    {
        acceso.institucion = null;
        const ambitos = this.ambitos(acceso);
        if(!ambitos.some(a => a.codigo === acceso.ambito))
        {
            acceso.ambito = ambitos.length === 1 ? ambitos[0].codigo : '';
            acceso.entidad = null;
        }
    }

    cerrarEditor()
    {
        if(!this.ocupado())
        {
            this.editor.nativeElement.close();
            this.nuevo = this.usuarioVacio();
        }
    }

    cancelarCierre(evento: Event)
    {
        evento.preventDefault();
        this.cerrarEditor();
    }

    buscar(texto: string)
    {
        this.busqueda.set(texto);
        this.pagina.set(1);
    }

    cargarUsuarios()
    {
        this.cargando.set(true);
        forkJoin({ usuarios: this.http.get<Usuario[]>('api/usuarios'), catalogos: this.http.get<CatalogosUsuarios>('api/catalogos/usuarios') }).subscribe({
            next: datos =>
            {
                this.usuarios.set(datos.usuarios);
                this.catalogos.set(datos.catalogos);
                this.cargando.set(false);
            },
            error: error =>
            {
                this.cargando.set(false);
                this.mensaje.set(this.detalleError(error));
            }
        });
    }

    guardarUsuario()
    {
        if(this.ocupado())
        {
            return;
        }
        this.ocupado.set(true);
        this.mensajeFormulario.set('');
        const accesos = this.nuevo.accesos.map(a => ({ ...a, entidad: a.ambito === 'ESTATAL' ? a.entidad : null }));
        const datos = { usuario: this.nuevo.usuario, nombre: this.nuevo.nombre, activo: this.nuevo.activo, accesos };
        const operacion = this.editando === null
            ? this.http.post('api/usuarios', { ...datos, ...accesos[0], accesos, password: this.nuevo.password })
            : this.http.put(`api/usuarios/${this.editando}`, datos);
        const propia = this.editando === this.session.sesion()?.usuario.id;
        operacion.subscribe({
            next: () =>
            {
                this.ocupado.set(false);
                this.cerrarEditor();
                if(propia)
                {
                    this.session.cerrar();
                    return;
                }
                this.mensaje.set('Usuario guardado. Los cambios de permisos se aplican a sus próximas solicitudes.');
                this.cargarUsuarios();
            },
            error: error =>
            {
                this.ocupado.set(false);
                this.mensajeFormulario.set(this.detalleError(error));
            }
        });
    }

    private detalleError(error: HttpErrorResponse)
    {
        return error.error?.mensaje ?? (error.status === 0 ? 'No se pudo conectar con la API.' : error.status === 401 ? 'La sesión venció.' : error.status === 403 ? 'No tiene permisos para esta operación.' : 'No fue posible completar la operación. Revise los datos e intente de nuevo.');
    }
}
