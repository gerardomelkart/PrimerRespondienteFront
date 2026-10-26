import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface Configuracion
{
    roles: { codigo: string; nombre: string; tipoInstitucion: string | null; alcanceTotal: boolean }[];
    ambitos: { codigo: string; nombre: string; requiereEntidad: boolean; fuero: string | null }[];
    rolesAmbitos: { rol: string; ambito: string }[];
    instituciones: { codigo: string; nombre: string; tipo: string }[];
    entidades: { id: number; nombre: string; asignable: boolean }[];
    fueros: { codigo: string; nombre: string }[];
    permisos: string[];
    parametros: Record<string, string | number | boolean>;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService
{
    private readonly http = inject(HttpClient);
    readonly datos = signal<Configuracion | null>(null);

    cargar(token: string)
    {
        return this.http.get<Configuracion>('api/configuracion', { headers: { Authorization: 'Bearer ' + token } }).pipe(tap(config => this.datos.set(config)));
    }

    numero(clave: string)
    {
        const valor = this.datos()?.parametros[clave];
        if(typeof valor !== 'number' || !Number.isFinite(valor))
        {
            throw new Error('Falta el parámetro ' + clave + ' en la configuración de la base.');
        }
        return valor;
    }

    texto(clave: string)
    {
        const valor = this.datos()?.parametros[clave];
        if(typeof valor !== 'string')
        {
            throw new Error('Falta el parámetro ' + clave + ' en la configuración de la base.');
        }
        return valor;
    }
}
