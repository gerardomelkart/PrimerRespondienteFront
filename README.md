# Primer Respondiente

Interfaz Angular del primer módulo de Eficiencia Ministerial. Presenta el acceso al sistema, la captura por Excel y las pantallas iniciales de consulta y administración, con identidad visual basada en el SIIID.

## Proyecto Eficiencia Ministerial

Eficiencia Ministerial es una plataforma en desarrollo para recibir información de detenciones y, en una etapa posterior, incorporar el seguimiento ministerial de las fiscalías. Su arquitectura contempla una API central y una base propia, con **Primer Respondiente** como primera interfaz de captura.

Esta versión reúne la base técnica y el diseño inicial. Las reglas operativas definitivas están pendientes de respuesta del área responsable; las funcionalidades provisionales no deben interpretarse como un proceso productivo terminado.

## Repositorios relacionados

| Repositorio | Responsabilidad | Tecnología |
| --- | --- | --- |
| [PrimerRespondienteFront](https://github.com/gerardomelkart/PrimerRespondienteFront) | Interfaz de acceso, captura por Excel, navegación e informes provisionales. | Angular, TypeScript, Bootstrap |
| [EficienciaMinisterialApi](https://github.com/gerardomelkart/EficienciaMinisterialApi) | Autenticación, autorización, validaciones, recepción de archivos y acceso a datos. | C#, ASP.NET Core, .NET 10 |
| [EficienciaMinisterialBD](https://github.com/gerardomelkart/EficienciaMinisterialBD) | Esquemas, tablas, catálogos, índices y secuencia de folios. | SQL Server 2019 o superior |

El navegador se comunica por HTTP con la API; la API consulta y persiste en SQL Server. **El front no se conecta directamente a la base.** Para ejecutar el sistema completo se requieren los tres repositorios.

## Flujo y alcance

El flujo implementado para las corporaciones permite descargar una plantilla, cargar un Excel, revisar errores y observaciones y confirmar una entrega para obtener un folio y un acuse HTML imprimible. El archivo original se conserva junto con los registros aceptados.

El flujo previsto para fiscalías consiste en descargar una plantilla con información de referencia y completar los campos de seguimiento ministerial. Esa segunda etapa todavía no está implementada.

- **Disponible:** autenticación JWT, perfiles iniciales, alta y listado de usuarios, carga y validación de Excel, confirmación con folio, acuse y registros de operación.
- **Provisional:** pantallas de informes “Reporte primer respondiente” y “Reporte completo”, sin consultas ni indicadores definitivos.
- **Pendiente:** catálogos y reglas definitivas, fiscalías estatales, plantilla de seguimiento, cruces automáticos, edición/baja de usuarios y reportes operativos.

Las futuras conexiones con SIIID e Ingesta de Datos no están implementadas. El cruce con RND/RND_FA, a partir de las copias generadas por DBBridge, también está pendiente. No existe actualmente un integrador entre estos sistemas.

## Puesta en marcha del conjunto

1. Preparar una instancia SQL Server de pruebas y ejecutar los scripts del repositorio de BD.
2. Configurar la conexión y la clave JWT fuera del código, crear el superusuario e iniciar la API.
3. Instalar las dependencias del front e iniciar Angular con su proxy local.

Cada repositorio detalla sus pasos más abajo. No se incluyen credenciales predeterminadas ni datos personales de ejemplo; las demostraciones deben utilizar datos ficticios.

## Arranque local

Requiere Node compatible con Angular 21 (Node 22.12+ de la rama 22, o Node 24 compatible), npm y la API .NET 10 configurada con SQL Server.

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200`. `proxy.conf.json` envía `/api` a `http://127.0.0.1:5010`. Iniciar primero la API y crear el superusuario siguiendo su [guía de configuración](https://github.com/gerardomelkart/EficienciaMinisterialApi/blob/main/docs/configuracion-entornos.md).

No hay credenciales de demostración. Las cuentas se autentican contra la API y se almacenan en la base del proyecto.

## Pantallas actuales

| Pantalla | Estado |
| --- | --- |
| Acceso | Autenticación JWT y sesión en memoria. Recargar o cerrar la pestaña requiere volver a ingresar. |
| Inicio | Bienvenida y acceso a las operaciones del perfil. Se regresa desde la tarjeta del usuario. |
| Carga de información | Plantilla, selección/arrastre XLSX, periodo declarado, errores por fila, observaciones, confirmación, folio y acuse. Disponible para primer respondiente. |
| Informes | Submenú con “Reporte primer respondiente” y “Reporte completo”. Ambas son vistas dummy de consulta de información. |
| Usuarios | Listado, búsqueda, contadores y panel lateral de alta. Disponible para superusuario; edición y baja no implementadas. |

La vista anterior de Entregas fue retirada de la navegación. Los endpoints de consulta y descarga siguen existiendo en la API, pero los informes del front aún no los utilizan. La API comprueba los permisos; ocultar opciones de menú no sustituye la autorización del servidor.

## Estructura

- `src/app/pages`: acceso, inicio, carga, informes y usuarios.
- `src/app/layout`: navegación y distribución de pantallas.
- `src/app/core/models`: contratos de datos.
- `src/app/core/services`: sesión, comunicación HTTP y operaciones de carga.
- `src/styles.css`: estilos compartidos.
- `public`: imágenes e icono institucional.

Se utilizan Bootstrap y Font Awesome. La paleta visual toma guinda `#691c32` y dorado `#bc955c` del diseño de referencia del SIIID.

## Compilar y publicar

```powershell
npm run build
npm run build:servidor
```

Salida: `dist/PrimerRespondienteFront/browser`. `build:servidor` utiliza base `/primer-respondiente/`. El servidor debe publicar el front bajo esa ruta y enviar `/primer-respondiente/api/` al `/api/` de Kestrel, conservando Authorization y usando HTTPS público.

Las URL de API y assets son relativas al base-href. El acuse actual es HTML descargable, imprimible o guardable como PDF desde el navegador; no es todavía un generador de PDF institucional.

## Desarrollo y verificaciones

Se mantiene sangría de cuatro espacios y un lockfile para instalar con `npm ci`. `.gitignore` excluye dependencias, compilados y archivos locales.

Se han realizado compilaciones de producción y pruebas visuales con respuestas HTTP simuladas. Estas pruebas no sustituyen la comprobación de persistencia y del flujo completo con una base SQL Server de pruebas. El módulo continúa en desarrollo y las reglas operativas actuales son provisionales.

## Configuración y datos

La conexión SQL y la clave JWT se configuran exclusivamente en la API mediante User Secrets o variables de entorno. No deben incorporarse secretos al código Angular: el navegador recibe los archivos compilados del front. No subir archivos reales de detenciones, datos personales ni logs a estos repositorios.
