import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, map, switchMap, tap, throwError } from 'rxjs';
import { ConfiguracionService } from './configuracion.service';
import { Sesion, Usuario } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class SessionService
{
    private readonly http = inject(HttpClient);
    readonly configuracion = inject(ConfiguracionService);
    readonly sesion = signal<Sesion | null>(null);

    login(usuario: string, password: string)
    {
        return this.http.post<Sesion>('api/auth/login', { usuario, password }).pipe(
            switchMap(sesion => this.configuracion.cargar(sesion.token).pipe(
                tap(() => this.sesion.set(sesion)),
                map(() => sesion)
            ))
        );
    }

    cerrar()
    {
        this.sesion.set(null);
        this.configuracion.datos.set(null);
    }

    puede(permiso: string)
    {
        return this.configuracion.datos()?.permisos.includes(permiso) ?? false;
    }

    nombrePerfil(codigo: string)
    {
        return this.configuracion.datos()?.roles.find(rol => rol.codigo === codigo)?.nombre ?? codigo;
    }

    actualizarUsuario(usuario: Usuario)
    {
        const sesion = this.sesion();
        if(sesion)
        {
            this.sesion.set({ ...sesion, usuario });
        }
    }
}

export const authInterceptor: HttpInterceptorFn = (request, next) =>
{
    const session = inject(SessionService);
    const sesion = session.sesion();
    if(sesion && request.url.startsWith('api/'))
    {
        request = request.clone({ setHeaders: { Authorization: `Bearer ${sesion.token}` } });
    }
    return next(request).pipe(catchError((error: HttpErrorResponse) =>
    {
        if(error.status === 401 && request.url !== 'api/auth/login')
        {
            session.cerrar();
        }
        return throwError(() => error);
    }));
};
