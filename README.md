# ASTILLA MAPAL

Aplicación web Google Apps Script para Compras de Suministro: toneladas SAP, recepciones estimadas, homologación de proveedores y comparación contra plan mensual. Bootstrap 5 y Chart.js están incluidos en los archivos HTML: no depende de un CDN.

## Actualizar una instalación existente

1. Actualizar **todos** los archivos de `src/` en el proyecto Apps Script, incluidos los nuevos `Headers.gs`, `Analytics.gs`, `Automation.gs` y el manifiesto `appsscript.json`. Con clasp: `git pull` y `npm run clasp -- push`. No borrar propiedades ni hojas existentes.
2. En el editor, seleccionar **`activarAutomatico` → Ejecutar** y aceptar la autorización adicional de triggers. Ejecutar con la cuenta responsable de la base, con acceso lector a los originales.
3. La función reusa/crea la base independiente, detecta encabezados y pestañas compatibles, actualiza `FUENTES`, activa esas fuentes e instala **un trigger propio cada 15 minutos**. Retira filas de ejemplo antiguas con `CONFIRMAR_ID_SAP`/`COMPLETAR_PESTANA`. El registro incluye el enlace de la base y el resultado de la primera sincronización.
4. En **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**, actualizar la aplicación web y volver a abrirla. Sin una versión nueva, la URL publicada puede seguir sirviendo el código anterior.
5. Si el primer guardado informa proveedores sin homologar, completar `PROVEEDORES` usando `PROVEEDORES_PENDIENTES`. No se inventan equivalencias comerciales. La próxima sincronización vuelve a intentar automáticamente.

La configuración es automática cuando los campos pueden identificarse inequívocamente. Si una fecha realmente no existe o hay columnas ambiguas, el diagnóstico muestra los encabezados encontrados y permite un mapeo explícito, sin editar la fuente.

## Inicio en Google Apps Script

Crear un proyecto **independiente** en [Google Apps Script](https://script.google.com/), subir todos los archivos de `src/` con clasp o mediante el editor y ejecutar `activarAutomatico`. Activar la visualización de `appsscript.json` en Configuración del proyecto para copiar también el manifiesto. La URL de **ASTILLA MAPAL · Base independiente** aparecerá en el registro de ejecución.

`prepararProyecto` crea/reusa hojas y activa las fuentes detectadas, pero no instala el trigger. `configurarProyecto` solo prepara la base. `detectarFuentes` inspecciona encabezados y conserva activaciones existentes. Volver a ejecutar `activarAutomatico`/`prepararProyecto` reactiva las pestañas compatibles detectadas; una desactivación manual posterior en FUENTES se respeta durante las consultas y sincronizaciones normales.

**Nunca se escriben fuentes ni se cambian sus permisos.** No se ha ejecutado configuración remota en la cuenta Google desde este entorno: la activación inicial debe hacerse con una cuenta autorizada en Apps Script.

## Hojas que se crean automáticamente

| Hoja | Uso |
|---|---|
| `FUENTES` | Archivo, pestaña y columnas para cada origen de solo lectura. |
| `PROVEEDORES` | Variantes de nombre → nombre oficial. |
| `PLAN_MENSUAL` | Plan por mes, proveedor y producto, en TS. |
| `ASTILLA_PROCESADO` | Camiones únicos y toneladas reales/estimadas. Salida regenerable. |
| `RESUMEN_MENSUAL` | SAP, estimado, plan y porcentajes por proveedor/producto/mes. |
| `INGRESOS_POR_MES` | Enero a diciembre **hacia la derecha**, separados por año, proveedor, producto y tipo SAP/ESTIMADO/PLAN. |
| `PROVEEDORES_PENDIENTES` | Nombres sin homologación para revisar. |
| `DIAGNOSTICO` | Problemas de configuración o datos. |

### FUENTES

Encabezados:

```text
ACTIVA | TIPO | ARCHIVO_ID | PESTANA | FILA_ENCABEZADOS | COL_FECHA | COL_PROVEEDOR | COL_PRODUCTO | COL_GUIA | COL_CANTIDAD
```

- `ACTIVA`: `SI` o `NO`. Solo se leen las filas activas.
- `TIPO`: `receipts` para recepción de camiones o `sap` para ingresos contabilizados.
- `ARCHIVO_ID`: el texto de la URL entre `/d/` y `/edit`.
- `PESTANA`: nombre exacto, por ejemplo `OCTUBRE 2026`. Agregar una fila por pestaña mensual.
- `FILA_ENCABEZADOS`: número entero, por ejemplo `1`. Si está vacío o es incorrecto, se busca la fila real de encabezados.
- Columnas de recepción confirmadas: `FECHA`, `PROVEEDOR`, `PRODUCTO`, `N° DE GUÍA`.
- SAP: mismos campos de identificación y `COL_CANTIDAD` = **`Cantidad`**, en **toneladas (TS)**. No usar `PESO BRUTO` como toneladas de astilla.

Los campos de columna son opcionales si se reconocen los encabezados. Se buscan en las primeras **50 filas y 200 columnas**, normalizando acentos, espacios, saltos de línea y puntuación. Se reconocen variantes como `Fecha de contabilización`, `Nombre 1`, `Texto breve de material`, `Nota de entrega` y `Cantidad en UM entrada`. El mapeo explícito, cuando existe, tiene prioridad; si no existe `FECHA`, SAP prefiere una única fecha de contabilización sobre la fecha de documento.

Si hay dos columnas con el mismo título, usar una referencia como **`@B`** en COL_FECHA para seleccionar la columna B sin cambiar la fuente. No se elige una columna ambigua al azar. Usar `*` en PESTANA para buscar pestañas compatibles en el archivo. Los archivos configurados como recepciones incluyen también las nuevas pestañas mensuales con nombre como `NOVIEMBRE 2026`, respetando filas desactivadas.

La clasificación automática usa el esquema completo: fecha, proveedor, producto y guía; `Cantidad` identifica el esquema SAP. Si un archivo de recepción utiliza también ese mismo esquema con Cantidad, configurar su TIPO explícitamente. Detectar encabezados no prueba que el contenido sea una exportación SAP auténtica ni que cada fila sea un camión: confirmar ese contrato al conectar el reporte real.

Archivos aportados:

- `1tOsKaZfFQIbnGxd_q89LjW5eM5hcReErw582gFCayGI`: rol exacto pendiente de verificación.
- `1jtF5B1DUQdx6eCWuFIp7k86suCY8XeBJ6_RoNJ3Bg-A`: recepciones aún no contabilizadas, según el usuario.

Si el reporte SAP está en otro archivo, agregar su ID y pestaña en `FUENTES`. Se aceptan tanto el ID como la URL completa de Google Sheets. Nunca se considera que una recepción está contabilizada solo porque el proveedor tiene otros registros SAP.

### PROVEEDORES

```text
NOMBRE_ORIGEN | PROVEEDOR_OFICIAL
```

Una fila por variante. Ejemplo **ficticio**:

| NOMBRE_ORIGEN | PROVEEDOR_OFICIAL |
|---|---|
| F. Sur Ltda. | FORESTAL SUR |
| Forestal Sur Limitada | FORESTAL SUR |

Se admiten varios alias para el mismo nombre oficial. Mayúsculas, acentos y espacios se normalizan. No se adivinan equivalencias por parecido. Un alias asignado a dos proveedores bloquea el cálculo. Un nombre no homologado se mantiene separado, genera alerta y bloquea guardar procesados hasta corregir el maestro. El original se conserva como `supplierOriginal` en el resultado del servidor.

### PLAN_MENSUAL

```text
MES | PROVEEDOR | PRODUCTO | PLAN_TS | PRECIO_TS
```

- `MES`: texto `2026-10` o una fecha de Sheets del mes correspondiente.
- `PROVEEDOR`: nombre oficial o alias registrado.
- `PRODUCTO`: `ASTILLA VERDE` o `ASTILLA VERDE C/CORT`.
- `PLAN_TS`: toneladas planificadas, numéricas y no negativas.
- `PRECIO_TS`: opcional, informativo; nunca se convierte precio en volumen.

Una fila por combinación mes/proveedor/producto. Los duplicados bloquean el cálculo. El plan existente en `plan material` **no se altera ni se importa automáticamente**, porque no se verificaron sus columnas ni la ubicación de sus volúmenes. Esta hoja nueva proporciona un formato inequívoco para cargar ese plan. No se inventan metas.

## Uso del dashboard

Implementar → Nueva implementación → Aplicación web. El manifiesto inicia con acceso **solo yo**, ejecutándose como **usuario que accede**. Autorizar y validar antes de ampliar el acceso a personas autorizadas. Cada usuario necesita lectura de las fuentes y escritura en la base si usa Guardar. No habilitar acceso público a datos de proveedores.

- Consultar filtra período, proveedor homologado y producto; no escribe en las fuentes ni en la base.
- **Guardar base procesada** recalcula todos los períodos configurados. Escribe únicamente en la base independiente. Si hay fuentes ilegibles, conflictos, valores inválidos o nombres sin homologar, actualiza el diagnóstico y bloquea reemplazar los totales anteriores. Los duplicados idénticos se depuran sin impedir el guardado.
- Cargar plan es opcional para consultar ingresos; sin él, el cumplimiento figura como no disponible.
- Las salidas son regenerables y no constituyen un registro histórico de auditoría. No editar manualmente hojas de salida: usar `FUENTES`, `PROVEEDORES` y `PLAN_MENSUAL`.
- Repetir `configurarProyecto` conserva el contenido y no crea otra base. Si una hoja tiene encabezados ajenos, se detiene para conservarla.

## Reglas de cálculo

1. Cada fila válida de recepción representa un camión. Solo se incluyen los dos productos autorizados.
2. Se homologa el proveedor **antes** de promediar, agrupar y cruzar.
3. Identidad de recepción: **proveedor oficial + N° DE GUÍA**. Una misma guía de proveedores distintos representa recepciones distintas. Conservar el mismo formato y ceros iniciales en ambos orígenes. Si una guía cubre varios camiones, este identificador no basta: debe configurarse una identificación por camión antes de usar esos datos.
4. SAP debe tener una fila por camión/guía con toneladas netas `Cantidad`. No se deben cargar líneas de materiales ni anulaciones como si fueran camiones. Duplicados idénticos se omiten con aviso informativo; contradicciones detienen el cálculo.
5. Camión ya encontrado en SAP: se muestra solo como SAP. Pendiente: promedio SAP del mismo proveedor × un camión. Sin antecedentes: **11,5 TS/camión**.
6. Promedio = toneladas SAP / camiones SAP únicos del proveedor, en el período seleccionado, incluyendo ambos productos. El filtro de producto se aplica después del promedio. Al guardar sin filtros, se usa el promedio de todo el período de fuentes configuradas.
7. La conciliación por guía ocurre antes del filtro temporal. El estado SAP usa su fecha configurada; si se contabilizó fuera del período, no se vuelve a presentar como pendiente dentro de él.
8. **Cumplimiento SAP** = TS SAP / PLAN_TS × 100. **Cobertura estimada** = (TS SAP + TS estimadas pendientes) / PLAN_TS × 100. Se muestran separados. Sin plan, con plan cero o con un filtro que cubre solo parte del mes, no se calcula porcentaje mensual.
9. Fechas: celdas fecha de Sheets, `AAAA-MM-DD`, `DD/MM/AAAA`, `DD.MM.AAAA` y marcas horarias compatibles. Cantidades: numéricas o decimales chilenos, por ejemplo `11,5`. Identificadores se leen como texto mostrado.

## Desarrollo y despliegue con clasp

Node.js 22+.

```sh
npm ci
npm test
npm run check
npm run clasp -- login
cp .clasp.example.json .clasp.json
# Editar scriptId con el ID del proyecto independiente creado en Apps Script.
npm run clasp -- push
npm run clasp -- open
```

Habilitar Apps Script API en la cuenta si clasp lo solicita. No guardar credenciales en Git. Los archivos de autenticación están ignorados. `src/` contiene todo lo desplegable. Para regenerar las bibliotecas incluidas con sus versiones fijadas: `npm run vendor`; conservar las licencias.

`npm test` no necesita credenciales ni servicios Google. Incluye pruebas de cálculo y flujo completo con hojas simuladas; comprueba que originales no cambian y que repetir setup/sincronización no duplica datos.

Vista local: `node scripts/preview.cjs`; en una máquina local abrir `http://localhost:8080`. Marca **DEMOSTRACIÓN**, usa datos ficticios y deshabilita guardar. No valida acceso a Google Sheets. La aplicación productiva no necesita Node en ejecución: la sirve Google Apps Script. Para comprobar la interfaz automáticamente: `npm run test:browser`; requiere Chromium del sistema, `CHROMIUM_PATH` o instalar el navegador con `npx playwright install chromium`.

## Configuración avanzada y permisos

Se conserva compatibilidad con propiedades `SOURCES_JSON` y `SUPPLIERS_JSON`. Las filas activas de `FUENTES` tienen prioridad sobre `SOURCES_JSON`; los proveedores de la hoja se combinan con `SUPPLIERS_JSON`, rechazando contradicciones. El mapeo de cantidad en JSON es `"tonnes":"Cantidad"` y guía `"guide":"N° DE GUÍA"`.

El asistente guarda automáticamente `PROCESSED_SPREADSHEET_ID` y `ASTILLA_MANAGED_BASE_ID`. No cambiar el ID a una fuente original. Si hay una base antigua no creada por el asistente, `configurarProyecto` se detiene: retirar su propiedad `PROCESSED_SPREADSHEET_ID` para crear una base nueva, conservando la anterior. La configuración manual de una base dedicada sigue siendo posible, pero debe tener los encabezados documentados.

OAuth requiere alcance de hojas de cálculo para crear/escribir la base. No existe un alcance por archivo para distinguir ambos usos: el lector carece de operaciones de escritura, la aplicación valida los IDs y la cuenta debe tener permiso **lector** en originales. No se cambian permisos. El alcance `script.scriptapp` permite instalar el trigger temporal solo cuando se ejecuta `activarAutomatico`. Configurarlo una vez con la cuenta responsable de la base; Apps Script administra triggers por usuario.

## Validación real pendiente

El entorno no ha accedido a los documentos de Google ni ejecutado funciones en Apps Script. Ejecutar `activarAutomatico` en Google, verificar las fuentes detectadas y las unidades, completar homologaciones/plan y comparar un período conocido. Comprobar un proveedor con antecedentes SAP y otro sin ellos, una guía conciliada, ambos productos y plan sin ingresos. Repetir guardar y comprobar los resultados de la base independiente. Ver [VALIDACION.md](VALIDACION.md) para las comprobaciones realizadas y sus límites.

Para tareas futuras usar el checkout existente; no crear worktrees.

## Actualización y control de calidad

- **Pantalla:** consulta fuentes cada 60 segundos mientras esté visible y la casilla esté activada. No superpone peticiones. Se puede actualizar manualmente o pausar la consulta automática.
- **Base independiente:** `activarAutomatico` instala un trigger cada 15 minutos. La cuenta que lo instala debe conservar acceso lector a las fuentes y editor a la base. `desactivarAutomatico` elimina únicamente sus triggers de ASTILLA MAPAL, sin tocar triggers ajenos.
- Se releen las filas actuales: incorporan nuevas recepciones, modificaciones, eliminaciones y reemplazos del reporte SAP. No se acumulan filas sobre una importación anterior. Las fuentes deben mantener el mismo contrato de un camión por fila y una guía única por proveedor.
- No se registra como cero una fuente SAP ilegible. El dashboard muestra estado de conexión, datos parciales y último guardado/error. Si SAP todavía no está configurado y solo hay recepciones, se permiten estimaciones de 11,5 TS sin mostrar cumplimiento SAP; las columnas SAP de la base se dejan vacías.
- Las unidades SAP detectadas deben ser toneladas. `KG` se rechaza; no se cambia silenciosamente la escala ni se usa peso bruto. No se asume la fecha de hoy cuando falta una fecha.
- Un bloqueo de validación conserva las salidas anteriores. Un fallo técnico durante escrituras puede dejar una base parcialmente actualizada porque Google Sheets no ofrece transacciones entre hojas; revisar el último estado/error y repetir la sincronización. El dashboard calcula desde fuentes, no desde un snapshot incompleto.
- Los nombres de empresas diferentes se homologan solo mediante el maestro explícito; no se fusionan automáticamente por semejanza.

## Indicadores y visualizaciones

Ocho KPIs: TS SAP, TS estimadas pendientes, cobertura con estimación, cumplimiento SAP, camiones únicos, camiones pendientes, brecha de cobertura al plan y proveedores activos. Se informa cuántos camiones utilizan respaldo de 11,5 TS.

Cuatro gráficos: evolución diaria de TS, composición SAP/estimado en TS, top 10 proveedores (sin excluir al resto de las tablas) y comparación mensual con plan. Búsqueda por guía/proveedor, filtros por período/producto/proveedor, tablas paginadas y exportación CSV con estado de validación y protección de fórmulas. El período inicial es el mes actual de Chile completo; los porcentajes de meses parciales no se prorratean.
