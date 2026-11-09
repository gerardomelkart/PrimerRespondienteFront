# Primer Respondiente

Interfaz Angular del primer módulo de Eficiencia Ministerial. Presenta el acceso al sistema, la captura por Excel y las pantallas iniciales de consulta y administración, con identidad visual basada en el SIIID.

## Proyecto Eficiencia Ministerial

Eficiencia Ministerial es una plataforma en desarrollo para recibir información de detenciones y, en una etapa posterior, incorporar el seguimiento ministerial de las fiscalías. Su arquitectura contempla una API central y una base propia, con **Primer Respondiente** como primera interfaz de captura.

Esta versión incorpora las primeras reglas confirmadas del cuestionario: usuarios con múltiples accesos y validación básica de la captura. El seguimiento de fiscalías, el cruce con RND y los reportes productivos siguen en desarrollo.

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

- **Disponible:** autenticación JWT, selección de acceso, alta/edición/activación de usuarios, carga y validación de Excel, confirmación con folio, acuse y registros de operación.
- **Provisional:** pantallas de informes “Reporte primer respondiente” y “Reporte completo”, sin consultas ni indicadores definitivos.
- **Pendiente:** catálogo definitivo de fiscalías, plantilla de seguimiento, cruces automáticos, control de quincenas y reportes operativos.

Las futuras conexiones con SIIID e Ingesta de Datos no están implementadas. El cruce con RND/RND_FA, a partir de las copias generadas por DBBridge, también está pendiente. No existe actualmente un integrador entre estos sistemas.

## Puesta en marcha del conjunto

1. Preparar una instancia SQL Server de pruebas y ejecutar los scripts del repositorio de BD.
2. Configurar la conexión y la clave JWT fuera del código, crear el superusuario e iniciar la API.
3. Instalar las dependencias del front e iniciar Angular con su proxy local.

Cada repositorio detalla sus pasos más abajo. No se incluyen credenciales predeterminadas ni datos personales de ejemplo.

## Arranque local

Requiere Node compatible con Angular 21 (Node 22.12+ de la rama 22, o Node 24 compatible), npm y la API .NET 10 configurada con SQL Server.

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200`. `proxy.conf.json` envía `/api` a `http://127.0.0.1:5010`. Iniciar primero la API y crear el superusuario siguiendo su [guía de configuración](https://github.com/gerardomelkart/EficienciaMinisterialApi/blob/main/docs/configuracion-entornos.md).

No hay credenciales predeterminadas. Las cuentas se autentican contra la API y se almacenan en la base del proyecto.

## Pantallas actuales

| Pantalla | Estado |
| --- | --- |
| Acceso | Autenticación JWT y sesión en memoria. Recargar o cerrar la pestaña requiere volver a ingresar. |
| Inicio | Bienvenida y acceso a las operaciones del perfil. Se regresa desde la marca de la barra de navegación o desde el menú de la cuenta. |
| Carga de información | Plantilla, selección/arrastre XLSX, periodo declarado, errores por fila, observaciones, confirmación, folio y acuse. Disponible para primer respondiente y superusuario; este último elige la corporación. |
| Informes | Submenú con “Reporte primer respondiente” y “Reporte completo”. Ambas muestran el estado «En preparación», sin registros ni exportaciones. El primer respondiente no tiene acceso al reporte completo. |
| Usuarios | Listado de cuentas activas/inactivas, búsqueda, alta, edición y cambio de estado. Asignación de varios perfiles, instituciones y entidades. Disponible para superusuario. |

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

## Primera entrega operativa — noviembre de 2026

Aplicar primero los scripts 003 y 004 de BD y actualizar la API. Las cuentas existentes se conservan. La administración obtiene instituciones y entidades de la API; no inventa fiscalías estatales. Para desactivar/reactivar una cuenta, abrir Editar y cambiar su estado.

Una cuenta puede tener varios accesos. El selector «Trabajar con acceso» cambia de perfil/institución/entidad e inicia el contexto correspondiente mediante la API. Editar los accesos de una cuenta exige que vuelva a iniciar sesión; si se edita la propia cuenta, el front cierra su sesión.

La carga requiere corporación, fecha, entidad y al menos folio o nombre; autoridad y fuero son opcionales. IA/AI se rechazan. Los folios de nomenclatura incorrecta generan observación para el cruce posterior. El cruce real con RND, la bandera consolidada de duplicados, los cierres de quincenas y la carga de fiscalías siguen pendientes de implementación. Los informes permanecen en preparación hasta incorporar consultas reales.

## Navegación

La navegación horizontal sigue la distribución de FESE WEB y conserva los colores, encabezado, tarjetas y formularios actuales. Incluye carga para los perfiles autorizados, Informes con sus dos opciones, Usuarios para superusuario y un menú de cuenta con selector de acceso y cierre de sesión. En pantallas pequeñas se despliega desde «Menú».

Se retiraron la entrada sin autenticación por parámetro de URL, los registros sintéticos, la carga simulada y el PDF de muestra. Todas las entradas requieren autenticación. Los reportes todavía no consultan información real y muestran explícitamente su estado de preparación.
