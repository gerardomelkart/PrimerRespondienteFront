import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { Usuario } from '../../core/models/modelos';

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
    readonly ocupado = signal(false);
    readonly cargando = signal(false);
    readonly mensaje = signal('');
    readonly mensajeFormulario = signal('');
    readonly usuarios = signal<Usuario[]>([]);
    readonly busqueda = signal('');
    readonly pagina = signal(1);
    readonly configuracion = inject(ConfiguracionService);
    get porPagina() { return this.configuracion.numero('Usuarios.PorPagina'); }
    get perfiles() { return this.configuracion.datos()!.roles; }
    get rolSeleccionado() { return this.perfiles.find(rol => rol.codigo === this.nuevo.rol); }
    get ambitosDisponibles()
    {
        const config = this.configuracion.datos()!;
        return config.ambitos.filter(ambito => config.rolesAmbitos.some(item => item.rol === this.nuevo.rol && item.ambito === ambito.codigo));
    }
    get institucionesDisponibles()
    {
        return this.configuracion.datos()!.instituciones.filter(institucion => !this.rolSeleccionado?.tipoInstitucion || institucion.tipo === this.rolSeleccionado.tipoInstitucion);
    }
    get requiereEntidad() { return this.configuracion.datos()!.ambitos.find(ambito => ambito.codigo === this.nuevo.ambito)?.requiereEntidad ?? false; }
    readonly filtrados = computed(() =>
    {
        const texto = this.normalizar(this.busqueda());
        return this.usuarios().filter(usuario => this.normalizar([
            usuario.nombre, usuario.usuario, this.nombrePerfil(usuario.rol), usuario.institucion ?? '', usuario.ambito
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

    nombreEntidad(id: number | null)
    {
        return this.configuracion.datos()!.entidades.find(entidad => entidad.id === id)?.nombre ?? '—';
    }

    contar(rol: string)
    {
        return this.usuarios().filter(usuario => usuario.rol === rol).length;
    }

    private normalizar(valor: string)
    {
        return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    usuarioVacio()
    {
        return { usuario: '', nombre: '', password: '', rol: '', institucion: '', ambito: '', entidad: null as number | null };
    }

    abrirNuevo()
    {
        this.nuevo = this.usuarioVacio();
        this.mensajeFormulario.set('');
        this.editor.nativeElement.showModal();
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
        this.http.get<Usuario[]>('api/usuarios').subscribe({
            next: usuarios =>
            {
                this.usuarios.set(usuarios);
                this.cargando.set(false);
            },
            error: error =>
            {
                this.cargando.set(false);
                this.mensaje.set(this.detalleError(error));
            }
        });
    }

    crearUsuario()
    {
        if(this.ocupado())
        {
            return;
        }
        this.ocupado.set(true);
        this.mensajeFormulario.set('');
        const datos = { ...this.nuevo, institucion: this.nuevo.institucion || null, entidad: this.requiereEntidad ? this.nuevo.entidad : null };
        this.http.post('api/usuarios', datos).subscribe({
            next: () =>
            {
                this.ocupado.set(false);
                this.cerrarEditor();
                this.mensaje.set('Usuario creado.');
                this.cargarUsuarios();
            },
            error: error =>
            {
                this.ocupado.set(false);
                this.mensajeFormulario.set(this.detalleError(error));
            }
        });
    }

    cambiarPerfil()
    {
        this.nuevo.institucion = '';
        this.nuevo.ambito = this.ambitosDisponibles.length === 1 ? this.ambitosDisponibles[0].codigo : '';
        this.nuevo.entidad = null;
    }

    private detalleError(error: HttpErrorResponse)
    {
        return error.error?.mensaje ?? (error.status === 0 ? 'No se pudo conectar con la API.' : error.status === 401 ? 'La sesión venció.' : error.status === 403 ? 'No tiene permisos para esta operación.' : error.status === 429 ? 'Demasiados intentos. Espere un minuto.' : 'No fue posible completar la operación. Revise los datos e intente de nuevo.');
    }
}
