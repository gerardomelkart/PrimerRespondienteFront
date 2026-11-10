import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SessionService } from '../../core/services/session.service';

@Component({
    selector: 'app-login',
    imports: [CommonModule, FormsModule],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class LoginPage
{
    readonly session = inject(SessionService);
    readonly ocupado = signal(false);
    readonly mensaje = signal('');
    nueva = '';
    confirmacion = '';
    actual = '';
    usuario = '';
    password = '';

    login(usuario: string, password: string)
    {
        if(this.ocupado())
        {
            return;
        }
        if(!usuario.trim() || !password)
        {
            this.mensaje.set('Ingrese su usuario y contraseña.');
            return;
        }
        this.ocupado.set(true);
        this.mensaje.set('');
        this.session.login(usuario.trim(), password).subscribe({
            next: () =>
            {
                this.password = '';
                this.ocupado.set(false);
            },
            error: error => this.error(error)
        });
    }

    cambiarPassword()
    {
        if(this.ocupado()) return;
        if(this.nueva !== this.confirmacion)
        {
            this.mensaje.set('Las contraseñas no coinciden.');
            return;
        }
        this.ocupado.set(true);
        this.mensaje.set('');
        this.session.cambiarPassword(this.actual, this.nueva, this.confirmacion).subscribe({
            next: () =>
            {
                this.actual = this.nueva = this.confirmacion = '';
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
