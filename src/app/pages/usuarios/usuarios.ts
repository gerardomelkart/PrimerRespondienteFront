import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SessionService } from '../../core/services/session.service';
import { CargasService } from '../../core/services/cargas.service';
import { Carga, Validacion, Usuario } from '../../core/models/modelos';

@Component({
    selector: 'app-usuarios',
    imports: [CommonModule, FormsModule],
    templateUrl: './usuarios.html'
})
export class UsuariosPage
{
    readonly session = inject(SessionService);
    private readonly http = inject(HttpClient);
    readonly ocupado = signal(false);
    readonly mensaje = signal('');
    readonly usuarios = signal<Usuario[]>([]);
    nuevo = this.usuarioVacio();

    constructor()
    {
        this.cargarUsuarios();
    }

    usuarioVacio()
    {
        return { usuario: '', nombre: '', password: '', rol: 'PRIMER_RESPONDIENTE', institucion: 'SEDENA', ambito: 'NACIONAL', entidad: null as number | null };
    }
    cargarUsuarios()
    {
        this.http.get<Usuario[]>('api/usuarios').subscribe({ next: usuarios => this.usuarios.set(usuarios), error: error => this.error(error) });
    }
    crearUsuario()
    {
        if(this.ocupado())
        {
            return;
        }
        this.ocupado.set(true);
        this.mensaje.set('');
        const datos = { ...this.nuevo, institucion: this.nuevo.institucion || null, entidad: this.nuevo.ambito === 'ESTATAL' ? this.nuevo.entidad : null };
        this.http.post('api/usuarios', datos).subscribe({
            next: () =>
            {
                this.nuevo = this.usuarioVacio();
                this.ocupado.set(false);
                this.mensaje.set('Usuario creado.');
                this.cargarUsuarios();
            },
            error: error => this.error(error)
        });
    }
    cambiarPerfil()
    {
        this.nuevo.institucion = this.nuevo.rol === 'PRIMER_RESPONDIENTE' ? 'SEDENA' : this.nuevo.rol === 'FISCALIA' ? 'FGR' : '';
        this.nuevo.ambito = this.nuevo.rol === 'FISCALIA' ? 'FEDERAL' : 'NACIONAL';
        this.nuevo.entidad = null;
    }
    private error(error: HttpErrorResponse)
    {
        this.ocupado.set(false);
        const detalle = error.error?.mensaje;
        this.mensaje.set(detalle ?? (error.status === 0 ? 'No se pudo conectar con la API.' : error.status === 401 ? 'Usuario o contraseña incorrectos, o sesión vencida.' : error.status === 403 ? 'No tiene permisos para esta operación.' : error.status === 429 ? 'Demasiados intentos. Espere un minuto.' : 'No fue posible completar la operación. Revise los datos e intente de nuevo.'));
    }
}
