import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
    readonly porPagina = 15;
    readonly perfiles = [
        { valor: 'PRIMER_RESPONDIENTE', nombre: 'Primer respondiente' },
        { valor: 'FISCALIA', nombre: 'Fiscalía' },
        { valor: 'SUPER_USUARIO', nombre: 'Superusuario' },
        { valor: 'CONSULTA', nombre: 'Consulta' }
    ];
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
        return this.perfiles.find(perfil => perfil.valor === rol)?.nombre ?? rol;
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
        return { usuario: '', nombre: '', password: '', rol: 'PRIMER_RESPONDIENTE', institucion: 'SEDENA', ambito: 'NACIONAL', entidad: null as number | null };
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
        const datos = { ...this.nuevo, institucion: this.nuevo.institucion || null, entidad: this.nuevo.ambito === 'ESTATAL' ? this.nuevo.entidad : null };
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
        this.nuevo.institucion = this.nuevo.rol === 'PRIMER_RESPONDIENTE' ? 'SEDENA' : this.nuevo.rol === 'FISCALIA' ? 'FGR' : '';
        this.nuevo.ambito = this.nuevo.rol === 'FISCALIA' ? 'FEDERAL' : 'NACIONAL';
        this.nuevo.entidad = null;
    }

    private detalleError(error: HttpErrorResponse)
    {
        return error.error?.mensaje ?? (error.status === 0 ? 'No se pudo conectar con la API.' : error.status === 401 ? 'La sesión venció.' : error.status === 403 ? 'No tiene permisos para esta operación.' : error.status === 429 ? 'Demasiados intentos. Espere un minuto.' : 'No fue posible completar la operación. Revise los datos e intente de nuevo.');
    }
}
