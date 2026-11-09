import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Carga, Validacion, CatalogosCarga } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class CargasService
{
    private readonly http = inject(HttpClient);
    private readonly base = 'api/primer-respondiente';

    catalogos()
    {
        return this.http.get<CatalogosCarga>('api/catalogos/carga');
    }

    validar(archivo: File, idPeriodo: number, institucion?: string)
    {
        const datos = new FormData();
        datos.append('archivo', archivo);
        datos.append('idPeriodo', String(idPeriodo));
        if(institucion)
        {
            datos.append('institucion', institucion);
        }
        return this.http.post<Validacion>(`${this.base}/cargas/validar`, datos);
    }

    confirmar(idCarga: string)
    {
        return this.http.post<Carga>(`${this.base}/cargas/confirmar`, { idCarga });
    }

    descargar(ruta: string)
    {
        return this.http.get(`${this.base}/${ruta}`, { responseType: 'blob' });
    }
}
