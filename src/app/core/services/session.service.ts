import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Sesion } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class SessionService
{
    private readonly http = inject(HttpClient);
    readonly sesion = signal<Sesion | null>(null);

    login(usuario: string, password: string)
    {
        return this.http.post<Sesion>('api/auth/login', { usuario, password }).pipe(tap(sesion => this.sesion.set(sesion)));
    }

    cambiarPassword(passwordActual: string, passwordNueva: string, confirmacion: string)
    {
        return this.http.post<Sesion>('api/auth/cambiar-password', { passwordActual, passwordNueva, confirmacion })
            .pipe(tap(sesion => this.sesion.set(sesion)));
    }

    cambiarAcceso(idAcceso: number)
    {
        return this.http.post<Sesion>('api/auth/acceso', { idAcceso }).pipe(tap(sesion => this.sesion.set(sesion)));
    }

    cerrar()
    {
        this.sesion.set(null);
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
