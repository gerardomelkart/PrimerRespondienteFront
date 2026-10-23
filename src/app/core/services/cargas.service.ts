import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Carga, Validacion } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class CargasService
{
    private readonly http = inject(HttpClient);
    private readonly base = 'api/primer-respondiente';

    listar()
    {
        return this.http.get<Carga[]>(`${this.base}/cargas`);
    }

    validar(archivo: File, inicio: string, fin: string)
    {
        const datos = new FormData();
        datos.append('archivo', archivo);
        datos.append('periodoInicio', inicio);
        datos.append('periodoFin', fin);
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
