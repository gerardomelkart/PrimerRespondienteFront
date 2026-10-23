import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SessionService } from '../../core/services/session.service';
import { CargasService } from '../../core/services/cargas.service';
import { Carga, Validacion, Usuario } from '../../core/models/modelos';

@Component({
    selector: 'app-login',
    imports: [CommonModule, FormsModule],
    templateUrl: './login.html'
})
export class LoginPage
{
    readonly session = inject(SessionService);
    readonly ocupado = signal(false);
    readonly mensaje = signal('');
    usuario = '';
    password = '';

    login()
    {
        if(this.ocupado())
        {
            return;
        }
        this.ocupado.set(true);
        this.mensaje.set('');
        this.session.login(this.usuario, this.password).subscribe({
            next: () =>
            {
                this.password = '';
                this.ocupado.set(false);
            },
            error: error => this.error(error)
        });
    }

    private error(error: HttpErrorResponse)
    {
        this.ocupado.set(false);
        const detalle = error.error?.mensaje;
        this.mensaje.set(detalle ?? (error.status === 0 ? 'No se pudo conectar con la API.' : error.status === 401 ? 'Usuario o contraseña incorrectos, o sesión vencida.' : error.status === 403 ? 'No tiene permisos para esta operación.' : error.status === 429 ? 'Demasiados intentos. Espere un minuto.' : 'No fue posible completar la operación. Revise los datos e intente de nuevo.'));
    }
}
