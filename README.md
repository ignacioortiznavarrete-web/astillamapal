# ASTILLA MAPAL

Aplicación web Google Apps Script para Compras de Suministro: toneladas SAP, recepciones estimadas, homologación de proveedores y comparación contra plan mensual. Bootstrap 5 y Chart.js están incluidos en los archivos HTML: no depende de un CDN.

## Inicio en Google Apps Script

1. Crear un proyecto **independiente** en [Google Apps Script](https://script.google.com/).
2. Subir todos los archivos de `src/` con clasp (instrucciones abajo), o crear los archivos `.gs` y HTML con sus nombres y contenidos en el editor. Activar la visualización de `appsscript.json` desde Configuración del proyecto y copiar el manifiesto.
3. En el selector de funciones, seleccionar **`prepararProyecto`** y pulsar **Ejecutar**. Autorizar con una cuenta que tenga lectura de los dos archivos fuente. **No cambiar permisos de las fuentes.**
4. En el registro de ejecución aparecerá la URL de una **nueva base independiente**. La función crea sus hojas y encabezados; después inspecciona los encabezados de las fuentes, sin escribir en ellas.
5. Abrir esa base y completar las hojas siguientes. No es necesario escribir `SOURCES_JSON` ni `SUPPLIERS_JSON` si se usa este método.

La aplicación aún no está conectada ni desplegada en una cuenta Google real desde este entorno. Los pasos anteriores deben ejecutarse en Apps Script con una cuenta autorizada. No se crearon hojas remotas durante el desarrollo local.

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
- `FILA_ENCABEZADOS`: número entero, por ejemplo `1`.
- Columnas de recepción confirmadas: `FECHA`, `PROVEEDOR`, `PRODUCTO`, `N° DE GUÍA`.
- SAP: mismos campos de identificación y `COL_CANTIDAD` = **`Cantidad`**, en **toneladas (TS)**. No usar `PESO BRUTO` como toneladas de astilla.

`prepararProyecto` deja filas de ejemplo desactivadas y candidatas detectadas también desactivadas. Revisar el rol de cada archivo y cambiar a `SI` únicamente las filas correctas. La presencia de un encabezado no garantiza que un archivo provenga de SAP. Los encabezados se buscan en las primeras 30 filas y hasta 100 columnas de cada pestaña. Se puede repetir `detectarFuentes`: agrega candidatas nuevas sin duplicarlas ni reemplazar las filas existentes.

Archivos aportados:

- `1tOsKaZfFQIbnGxd_q89LjW5eM5hcReErw582gFCayGI`: rol exacto pendiente de verificación.
- `1jtF5B1DUQdx6eCWuFIp7k86suCY8XeBJ6_RoNJ3Bg-A`: recepciones aún no contabilizadas, según el usuario.

Si el reporte SAP está en otro archivo, agregarlo manualmente en `FUENTES`. Nunca se considera que una recepción está contabilizada solo porque el proveedor tiene otros registros SAP.

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
- **Guardar base procesada** recalcula todos los períodos configurados. Escribe únicamente en la base independiente. Si hay datos dudosos, actualiza `DIAGNOSTICO` y `PROVEEDORES_PENDIENTES`, y bloquea guardar totales.
- Cargar plan es opcional para consultar ingresos; sin él, el cumplimiento figura como no disponible.
- Las salidas son regenerables y no constituyen un registro histórico de auditoría. No editar manualmente hojas de salida: usar `FUENTES`, `PROVEEDORES` y `PLAN_MENSUAL`.
- Repetir `configurarProyecto` conserva el contenido y no crea otra base. Si una hoja tiene encabezados ajenos, se detiene para conservarla.

## Reglas de cálculo

1. Cada fila válida de recepción representa un camión. Solo se incluyen los dos productos autorizados.
2. Se homologa el proveedor **antes** de promediar, agrupar y cruzar.
3. Identidad de recepción: **proveedor oficial + N° DE GUÍA**. Una misma guía de proveedores distintos representa recepciones distintas. Conservar el mismo formato y ceros iniciales en ambos orígenes. Si una guía cubre varios camiones, este identificador no basta: debe configurarse una identificación por camión antes de usar esos datos.
4. SAP debe tener una fila por camión/guía con toneladas netas `Cantidad`. No se deben cargar líneas de materiales ni anulaciones como si fueran camiones. Duplicados idénticos se omiten con alerta; contradicciones detienen el cálculo.
5. Camión ya encontrado en SAP: se muestra solo como SAP. Pendiente: promedio SAP del mismo proveedor × un camión. Sin antecedentes: **11,5 TS/camión**.
6. Promedio = toneladas SAP / camiones SAP únicos del proveedor, en el período seleccionado, incluyendo ambos productos. El filtro de producto se aplica después del promedio. Al guardar sin filtros, se usa el promedio de todo el período de fuentes configuradas.
7. La conciliación por guía ocurre antes del filtro temporal. El estado SAP usa su fecha configurada; si se contabilizó fuera del período, no se vuelve a presentar como pendiente dentro de él.
8. **Cumplimiento SAP** = TS SAP / PLAN_TS × 100. **Cobertura estimada** = (TS SAP + TS estimadas pendientes) / PLAN_TS × 100. Se muestran separados. Sin plan, con plan cero o con un filtro que cubre solo parte del mes, no se calcula porcentaje mensual.
9. Fechas: celdas fecha de Sheets, `AAAA-MM-DD` o texto `DD/MM/AAAA`. Cantidades: numéricas o decimales chilenos, por ejemplo `11,5`. Identificadores se leen como texto mostrado.

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

Vista local: `node scripts/preview.cjs`; en una máquina local abrir `http://localhost:8080`. Marca **DEMOSTRACIÓN**, usa datos ficticios y deshabilita guardar. No valida acceso a Google Sheets. La aplicación productiva no necesita Node en ejecución: la sirve Google Apps Script.

## Configuración avanzada y permisos

Se conserva compatibilidad con propiedades `SOURCES_JSON` y `SUPPLIERS_JSON`. Las filas activas de `FUENTES` tienen prioridad sobre `SOURCES_JSON`; los proveedores de la hoja se combinan con `SUPPLIERS_JSON`, rechazando contradicciones. El mapeo de cantidad en JSON es `"tonnes":"Cantidad"` y guía `"guide":"N° DE GUÍA"`.

El asistente guarda automáticamente `PROCESSED_SPREADSHEET_ID` y `ASTILLA_MANAGED_BASE_ID`. No cambiar el ID a una fuente original. Si hay una base antigua no creada por el asistente, `configurarProyecto` se detiene: retirar su propiedad `PROCESSED_SPREADSHEET_ID` para crear una base nueva, conservando la anterior. La configuración manual de una base dedicada sigue siendo posible, pero debe tener los encabezados documentados.

OAuth requiere alcance de hojas de cálculo para crear/escribir la base. No existe un alcance por archivo para distinguir ambos usos: el lector carece de operaciones de escritura, la aplicación valida los IDs y la cuenta debe tener permiso **lector** en originales. No se cambian permisos ni se crean triggers automáticos.

## Validación real pendiente

El entorno no ha accedido a los documentos de Google ni ejecutado funciones en Apps Script. Ejecutar `prepararProyecto` en Google, verificar las fuentes detectadas y las unidades, completar homologaciones/plan y comparar un período conocido. Comprobar un proveedor con antecedentes SAP y otro sin ellos, una guía conciliada, ambos productos y plan sin ingresos. Repetir guardar y comprobar los resultados de la base independiente. Ver [VALIDACION.md](VALIDACION.md) para las comprobaciones realizadas y sus límites.

Para tareas futuras usar el checkout existente; no crear worktrees.
