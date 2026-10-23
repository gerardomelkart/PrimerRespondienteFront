# Primer Respondiente

Angular para el primer módulo de Eficiencia Ministerial. Usa logos y colores del SIIID: guinda `#691c32`, dorado `#bc955c`, Bootstrap y Font Awesome. Un solo módulo con operaciones según el perfil autenticado. Las páginas viven en `src/app/pages`, el layout en `src/app/layout` y los modelos/servicios en `src/app/core`.

## Arranque

Requiere Node 22.12+ o Node 24 compatible con Angular 21, npm y la API .NET 10 configurada con SQL Server.

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200`. `proxy.conf.json` envía `/api` a `http://127.0.0.1:5010`. No hay usuarios ni datos de demostración; crear el superusuario con el comando local de la API y después las cuentas de corporaciones desde Usuarios.

## Primera entrega

- Login y sesión en memoria. Al recargar o cerrar la pestaña se requiere ingresar nuevamente. El token vence en una hora; no se guarda en localStorage.
- Inicio y navegación según perfil. La API vuelve a verificar todos los permisos.
- Corporaciones: plantilla, selector/arrastre XLSX, periodo declarado, errores por fila, observaciones, confirmación, folio y acuse HTML imprimible.
- Entregas: últimas 200 visibles, búsqueda local por folio/institución/archivo, descarga original y acuse.
- Superusuario: consulta nacional, listado y creación de usuarios. El ámbito y la institución determinan el alcance; fiscalías estatales pendientes del catálogo autorizado.
- Fiscalía: acceso y aviso del seguimiento pendiente de implementación. No se simulan respuestas, cruces ni asignaciones.

## Compilar y publicar

```powershell
npm run build
npm run build:servidor
```

Salida: `dist/PrimerRespondienteFront/browser`. `build:servidor` usa base `/primer-respondiente/`. El servidor debe publicar el front bajo esa ruta y enviar `/primer-respondiente/api/` al `/api/` de Kestrel. El proxy debe conservar Authorization y tener HTTPS público. No se ha configurado ni desplegado ningún servidor en esta entrega.

Las URL de API y assets son relativas al base-href para admitir otras rutas de publicación. El acuse es HTML descargable con impresión/guardar PDF del navegador; el PDF institucional se trabajará después. No hay todavía edición/baja de usuarios, cambio de contraseña, plantilla de fiscalías, cruce automático o indicadores operativos.

## Estilo y verificaciones

Sangría de cuatro espacios y llaves en línea aparte, conforme al fragmento del usuario; `.editorconfig` y `.gitattributes` lo documentan. Se incluye lockfile para usar `npm ci`. `.gitignore` excluye dependencias, compilados, archivos de editor y secretos.

Se verificó compilación de producción y publicación bajo `/primer-respondiente/`. Se revisaron escritorio/móvil y el recorrido visual con respuestas HTTP simuladas (sin SQL); no representa validación de persistencia. La prueba de punta a punta de carga/folio requiere ejecutar los scripts SQL y configurar la conexión real de pruebas.
