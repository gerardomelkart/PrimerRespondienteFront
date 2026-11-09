import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { SessionService } from '../../core/services/session.service';
import { CargasService } from '../../core/services/cargas.service';
import { Carga, Validacion, CatalogosUsuarios, CatalogosCarga, IncidenciaValidacion } from '../../core/models/modelos';

@Component({
    selector: 'app-carga',
    imports: [CommonModule, FormsModule],
    templateUrl: './carga.html',
    styleUrl: './carga.css'
})
export class CargaPage
{
    readonly session = inject(SessionService);
    private readonly sanitizer = inject(DomSanitizer);
    readonly acuseUrl = signal<SafeResourceUrl | null>(null);
    readonly cargandoAcuse = signal(false);
    readonly errorAcuse = signal('');
    private acuseBlob: Blob | null = null;
    private acuseObjectUrl: string | null = null;
    private acuseSolicitud?: Subscription;
    private idAcuse = '';
    private nombreAcuse = 'Acuse_PrimerRespondiente.pdf';
    @ViewChild('modalAcuse') private modalAcuse?: ElementRef<HTMLDialogElement>;
    private readonly cargasService = inject(CargasService);
    readonly ocupado = signal(false);
    readonly mensaje = signal('');
    readonly validacion = signal<Validacion | null>(null);
    paginaResultado = 1;
    filasPorPagina = 20;
    readonly ordenResultado = signal<{ campo: keyof IncidenciaValidacion; ascendente: boolean }>({ campo: 'fila', ascendente: true });
    readonly columnasResultado: { campo: keyof IncidenciaValidacion; nombre: string }[] = [
        { campo: 'tipo', nombre: 'Tipo' }, { campo: 'fila', nombre: 'Fila del Excel' },
        { campo: 'campo', nombre: 'Campo' }, { campo: 'valor', nombre: 'Valor en el Excel' }, { campo: 'mensaje', nombre: 'Detalle' }
    ];
    private readonly comparador = new Intl.Collator('es-MX', { numeric: true, sensitivity: 'base' });
    @ViewChild('tablaResultados') private tablaResultados?: ElementRef<HTMLElement>;
    readonly exportando = signal(false);
    readonly incidencias = computed<IncidenciaValidacion[]>(() =>
    {
        const resultado = this.validacion();
        if(!resultado)
        {
            return [];
        }
        const errores = resultado.errores.map(e => ({ tipo: 'Error', fila: e.fila || null, campo: e.campo, mensaje: e.mensaje, valor: e.valor }));
        const avisos = resultado.avisos.map(aviso =>
        {
            if(typeof aviso !== 'string')
            {
                return { ...aviso, tipo: 'Observación', fila: aviso.fila || null };
            }
            const partes = /^Fila (\d+):\s*(.*)$/.exec(aviso);
            return { tipo: 'Observación', fila: partes ? Number(partes[1]) : null, campo: '', valor: null, mensaje: partes ? partes[2] : aviso };
        });
        const orden = this.ordenResultado();
        return [...errores, ...avisos].sort((a, b) =>
        {
            const primero = a[orden.campo];
            const segundo = b[orden.campo];
            if(primero == null || segundo == null)
            {
                return primero == null ? (segundo == null ? 0 : 1) : -1;
            }
            const comparacion = typeof primero === 'number' && typeof segundo === 'number'
                ? primero - segundo : this.comparador.compare(String(primero), String(segundo));
            return orden.ascendente ? comparacion : -comparacion;
        });
    });

    get totalPaginas()
    {
        return Math.max(1, Math.ceil(this.incidencias().length / this.filasPorPagina));
    }

    get incidenciasPagina()
    {
        const inicio = (this.paginaResultado - 1) * this.filasPorPagina;
        return this.incidencias().slice(inicio, inicio + this.filasPorPagina);
    }

    get paginasVisibles()
    {
        const inicio = Math.max(1, Math.min(this.paginaResultado - 2, this.totalPaginas - 4));
        return Array.from({ length: Math.min(5, this.totalPaginas) }, (_, indice) => inicio + indice);
    }

    irAPagina(pagina: number | null)
    {
        this.paginaResultado = Math.min(this.totalPaginas, Math.max(1, Math.trunc(Number(pagina)) || 1));
        if(this.tablaResultados)
        {
            this.tablaResultados.nativeElement.scrollTop = 0;
        }
    }

    ordenarResultados(campo: keyof IncidenciaValidacion)
    {
        const actual = this.ordenResultado();
        this.ordenResultado.set({ campo, ascendente: actual.campo === campo ? !actual.ascendente : true });
        this.irAPagina(1);
    }

    estadoOrden(campo: keyof IncidenciaValidacion): 'ascending' | 'descending' | 'none'
    {
        const actual = this.ordenResultado();
        return actual.campo === campo ? (actual.ascendente ? 'ascending' : 'descending') : 'none';
    }

    readonly aceptada = signal<Carga | null>(null);
    @ViewChild('selectorArchivo') private selectorArchivo?: ElementRef<HTMLInputElement>;
    readonly catalogos = signal<CatalogosCarga | null>(null);
    readonly cargandoCatalogos = signal(true);
    readonly instituciones = signal<CatalogosUsuarios['instituciones']>([]);
    institucion = '';

    constructor()
    {
        this.cargasService.catalogos().subscribe({
            next: datos =>
            {
                this.catalogos.set(datos);
                this.cargandoCatalogos.set(false);
            },
            error: error =>
            {
                this.cargandoCatalogos.set(false);
                this.error(error);
            }
        });
        if(this.session.sesion()?.usuario.rol === 'SUPER_USUARIO')
        {
            inject(HttpClient).get<CatalogosUsuarios>('api/catalogos/usuarios').subscribe({
                next: datos => this.instituciones.set(datos.instituciones.filter(i => i.tipo === 'CORPORACION')),
                error: error => this.error(error)
            });
        }
    }

    anio: number | null = null;
    mes: number | null = null;
    idPeriodo: number | null = null;

    get anios()
    {
        return [...new Set(this.catalogos()?.periodos.map(p => Number(p.inicio.slice(0, 4))) ?? [])].sort((a, b) => b - a);
    }

    get meses()
    {
        const numeros = [...new Set(this.catalogos()?.periodos
            .filter(p => Number(p.inicio.slice(0, 4)) === this.anio)
            .map(p => Number(p.inicio.slice(5, 7))) ?? [])].sort((a, b) => a - b);
        return numeros.map(numero => ({ numero, nombre: new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(this.anio!, numero - 1, 1))) }));
    }

    get quincenas()
    {
        return this.catalogos()?.periodos.filter(p => Number(p.inicio.slice(0, 4)) === this.anio
            && Number(p.inicio.slice(5, 7)) === this.mes).sort((a, b) => a.inicio.localeCompare(b.inicio)) ?? [];
    }

    cambiarAnio()
    {
        this.mes = null;
        this.cambiarMes();
    }

    cambiarMes()
    {
        this.idPeriodo = null;
        this.cambiarPeriodo();
    }

    get periodoSeleccionado()
    {
        return this.catalogos()?.periodos.find(p => p.id === this.idPeriodo);
    }
    archivo: File | null = null;
    arrastrando = false;

    seleccionar(evento: Event)
    {
        const archivo = (evento.target as HTMLInputElement).files?.[0];
        if(archivo)
        {
            this.elegir(archivo);
        }
    }
    soltar(evento: DragEvent)
    {
        evento.preventDefault();
        this.arrastrando = false;
        if(!this.ocupado() && this.catalogos())
        {
            this.elegir(evento.dataTransfer?.files[0] ?? null);
        }
    }
    elegir(archivo: File | null)
    {
        this.validacion.set(null);
        this.aceptada.set(null);
        this.mensaje.set('');
        if(archivo && (!this.catalogos() || !archivo.name.toLowerCase().endsWith('.xlsx')
            || archivo.size <= 0 || archivo.size > this.catalogos()!.limites.maximoBytes))
        {
            this.archivo = null;
            this.mensaje.set('Seleccione un Excel .xlsx con contenido y dentro del tamaño permitido.');
            return;
        }
        this.archivo = archivo;
    }
    quitarArchivo()
    {
        if(this.ocupado())
        {
            return;
        }
        this.elegir(null);
        if(this.selectorArchivo)
        {
            this.selectorArchivo.nativeElement.value = '';
        }
    }

    cambiarPeriodo()
    {
        this.validacion.set(null);
        this.aceptada.set(null);
    }
    validar()
    {
        if(!this.archivo || this.ocupado())
        {
            return;
        }
        if(this.session.sesion()?.usuario.rol === 'SUPER_USUARIO' && !this.institucion)
        {
            this.mensaje.set('Seleccione la corporación para esta carga.');
            return;
        }
        if(!this.periodoSeleccionado)
        {
            this.mensaje.set('Seleccione un periodo quincenal habilitado.');
            return;
        }
        this.ocupado.set(true);
        this.mensaje.set('');
        this.validacion.set(null);
        this.aceptada.set(null);
        this.cargasService.validar(this.archivo, this.idPeriodo!, this.institucion).subscribe({
            next: resultado =>
            {
                this.paginaResultado = 1;
                this.validacion.set(resultado);
                this.ocupado.set(false);
                if(resultado.valido && resultado.idCarga)
                {
                    this.abrirAcuse(resultado.idCarga);
                }
                else
                {
                    setTimeout(() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }
            },
            error: error => this.error(error)
        });
    }
    confirmar()
    {
        const id = this.validacion()?.idCarga;
        if(!id || this.ocupado())
        {
            return;
        }
        this.ocupado.set(true);
        this.cargasService.confirmar(id).subscribe({
            next: carga =>
            {
                this.aceptada.set(carga);
                this.validacion.set(null);
                this.archivo = null;
                if(this.selectorArchivo)
                {
                    this.selectorArchivo.nativeElement.value = '';
                }
                this.ocupado.set(false);
                this.abrirAcuse(carga.id);
            },
            error: error =>
            {
                this.error(error);
                this.errorAcuse.set(error.error?.mensaje ?? 'No se pudo confirmar la entrega. Vuelva a intentarlo.');
            }
        });
    }
    abrirAcuse(id: string)
    {
        this.acuseSolicitud?.unsubscribe();
        this.limpiarAcuse();
        this.idAcuse = id;
        this.errorAcuse.set('');
        this.cargandoAcuse.set(true);
        if(!this.modalAcuse?.nativeElement.open)
        {
            this.modalAcuse?.nativeElement.showModal();
        }
        this.acuseSolicitud = this.cargasService.descargar('cargas/' + id + '/acuse').subscribe({
            next: respuesta =>
            {
                this.cargandoAcuse.set(false);
                if(!respuesta.body || respuesta.body.type !== 'application/pdf')
                {
                    this.errorAcuse.set('No se recibió un PDF válido. Puede volver a intentarlo.');
                    return;
                }
                this.acuseBlob = respuesta.body;
                this.nombreAcuse = this.nombreRespuesta(respuesta, 'Acuse_PrimerRespondiente.pdf');
                this.acuseObjectUrl = URL.createObjectURL(respuesta.body);
                this.acuseUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.acuseObjectUrl + '#toolbar=0'));
            },
            error: () =>
            {
                this.cargandoAcuse.set(false);
                this.errorAcuse.set(this.aceptada() ? 'La entrega fue recibida, pero no se pudo cargar el acuse. Vuelva a intentarlo.' : 'No se pudo cargar el acuse previo. Vuelva a intentarlo.');
            }
        });
    }

    reintentarAcuse()
    {
        this.abrirAcuse(this.idAcuse);
    }

    descargarAcuse()
    {
        if(this.acuseBlob)
        {
            this.guardarDescarga(this.acuseBlob, this.nombreAcuse);
        }
    }

    cerrarAcuse(evento?: Event)
    {
        if(this.ocupado())
        {
            evento?.preventDefault();
            return;
        }
        this.acuseSolicitud?.unsubscribe();
        this.modalAcuse?.nativeElement.close();
        this.limpiarAcuse();
        this.cargandoAcuse.set(false);
    }

    private limpiarAcuse()
    {
        if(this.acuseObjectUrl)
        {
            URL.revokeObjectURL(this.acuseObjectUrl);
        }
        this.acuseObjectUrl = null;
        this.acuseBlob = null;
        this.acuseUrl.set(null);
    }

    ngOnDestroy()
    {
        this.acuseSolicitud?.unsubscribe();
        this.limpiarAcuse();
    }

    private nombreRespuesta(respuesta: HttpResponse<Blob>, respaldo: string)
    {
        const cabecera = respuesta.headers.get('Content-Disposition') ?? '';
        const extendido = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(cabecera);
        let nombre = /filename\s*=\s*"([^"]+)"/i.exec(cabecera)?.[1]
            ?? /filename\s*=\s*([^;]+)/i.exec(cabecera)?.[1] ?? respaldo;
        if(extendido)
        {
            try
            {
                nombre = decodeURIComponent(extendido[1]);
            }
            catch
            {
                nombre = respaldo;
            }
        }
        return nombre.replace(/[\\/\x00-\x1f]/g, '_').trim() || respaldo;
    }

    exportarValidacion()
    {
        if(this.exportando() || !this.incidencias().length)
        {
            return;
        }
        this.exportando.set(true);
        this.cargasService.exportarValidacion(this.incidencias()).subscribe({
            next: blob =>
            {
                this.guardarDescarga(blob, 'Resultado_validacion.xlsx');
                this.exportando.set(false);
            },
            error: error =>
            {
                this.exportando.set(false);
                this.error(error);
            }
        });
    }

    private guardarDescarga(blob: Blob, nombre: string)
    {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    descargar(ruta: string, nombre: string)
    {
        this.cargasService.descargar(ruta).subscribe({
            next: respuesta =>
            {
                if(respuesta.body)
                {
                    this.guardarDescarga(respuesta.body, this.nombreRespuesta(respuesta, nombre));
                }
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
