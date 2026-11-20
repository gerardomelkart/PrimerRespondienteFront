import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Sesion } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class SessionService
{
    private readonly http = inject(HttpClient);
    private readonly clave = 'eficiencia-ministerial.sesion';
    readonly sesion = signal<Sesion | null>(this.recuperar());

    private recuperar(): Sesion | null
    {
        try {
            const datos = sessionStorage.getItem(this.clave);
            if (!datos) return null;
            const sesion: Sesion = JSON.parse(datos);
            if (sesion?.token && sesion.usuario && Date.parse(sesion.venceUtc) > Date.now()) return sesion;
            sessionStorage.removeItem(this.clave);
        } catch {
            // El navegador puede bloquear el almacenamiento de la pestaña.
        }
        return null;
    }

    private guardar(sesion: Sesion | null)
    {
        this.sesion.set(sesion);
        try {
            if (sesion) sessionStorage.setItem(this.clave, JSON.stringify(sesion));
            else sessionStorage.removeItem(this.clave);
        } catch {
            // Con almacenamiento bloqueado, la sesión continúa en memoria.
        }
    }

    login(usuario: string, password: string)
    {
        return this.http.post<Sesion>('api/auth/login', { usuario, password }).pipe(tap(sesion => this.guardar(sesion)));
    }

    cambiarPassword(passwordActual: string, passwordNueva: string, confirmacion: string)
    {
        return this.http.post<Sesion>('api/auth/cambiar-password', { passwordActual, passwordNueva, confirmacion })
            .pipe(tap(sesion => this.guardar(sesion)));
    }

    cambiarAcceso(idAcceso: number)
    {
        return this.http.post<Sesion>('api/auth/acceso', { idAcceso }).pipe(tap(sesion => this.guardar(sesion)));
    }

    cerrar()
    {
        this.guardar(null);
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
