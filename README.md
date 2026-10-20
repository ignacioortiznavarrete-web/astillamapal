# ASTILLA MAPAL

Dashboard para Compras de Suministro en Google Apps Script, Bootstrap 5 y Chart.js. Fuentes de solo lectura; almacenamiento procesado independiente. **La conexión real todavía no ha sido validada**: el entorno rechazó el acceso HTTP a Google Sheets (403 del proxy), y no dispone de conector Google Drive. No se ha accedido ni escrito en las planillas originales.

## Desarrollo

Node.js 22 o superior. `npm ci`, `npm test`, `npm run check`. Las pruebas son locales, con datos ficticios, sin credenciales ni escrituras externas. Los archivos desplegables están en `src/`. No se requiere compilación. `Domain.gs` contiene las reglas puras, `SheetsReader.gs` la lectura, `Repository.gs` la única escritura y `Config.gs` la configuración. `Code.gs` expone las funciones del dashboard. HTML separado para estructura, estilos y cliente.

## Contrato de datos y cálculo

- Recepciones: una fila por camión con ID de recepción estable, fecha, proveedor y producto. Solo ASTILLA VERDE y ASTILLA VERDE C/CORT, normalizados por mayúsculas, espacios y acentos.
- SAP: **una fila por camión/recepción** con ese mismo ID y toneladas netas positivas. No configurar un reporte de líneas de materiales o documentos repetidos sin agrupar previamente por recepción en una base independiente. Duplicados idénticos se omiten; contradicciones detienen el cálculo.
- IDs deben ser únicos entre pestañas, períodos y fuentes, y representar la misma recepción en SAP. No se inventan IDs a partir del número de fila. Si SAP no ofrece un identificador común, la conciliación automática requiere una tabla de equivalencias en un desarrollo posterior.
- Se estima solamente lo recibido que no tiene una recepción SAP válida. Una recepción conciliada se cuenta una vez, usando toneladas SAP. Los SAP sin recepción también se muestran como contabilizados.
- Promedio = toneladas SAP / camiones SAP únicos del mismo proveedor **dentro del período elegido**, incluyendo ambos productos permitidos. El filtro de producto se aplica después de calcular el promedio. Sin antecedentes: 11,5 t/camión. Este criterio temporal es explícito y puede ajustarse si se requiere promedio histórico.
- Fechas de recepción y contabilización pueden diferir: se concilia por ID globalmente antes de filtrar por fecha. El estado SAP usa la fecha configurada para SAP. Las recepciones conciliadas fuera del período no se presentan como pendientes.
- Proveedores se emparejan por nombre normalizado. Usar un nombre/código consistente en ambas fuentes. No se realiza coincidencia aproximada.
- Filas incompletas, pesos inválidos o duplicados generan alertas. Guardar la base procesada se bloquea ante cualquier alerta. No se interpreta un dato faltante como cero.
- La base es una proyección regenerable, no un historial de auditoría. Guardar sincroniza todos los períodos configurados con promedio SAP global; los filtros del dashboard se calculan directamente sobre fuentes, con promedio SAP del período.

## Configuración Google Apps Script

1. Crear proyecto independiente en script.google.com con una cuenta con acceso **lector** a las dos fuentes y editor a una tercera planilla nueva, dedicada a procesados. No cambiar permisos de las fuentes.
2. Confirmar cuál archivo es SAP. El segundo enlace fue identificado como recepciones pendientes; la función exacta y los encabezados del primero aún deben confirmarse:
   - Primer enlace: `1tOsKaZfFQIbnGxd_q89LjW5eM5hcReErw582gFCayGI`.
   - Recepciones pendientes: `1jtF5B1DUQdx6eCWuFIp7k86suCY8XeBJ6_RoNJ3Bg-A`.
3. Propiedades del script → agregar `SOURCES_JSON` y `PROCESSED_SPREADSHEET_ID`. Los siguientes encabezados son **ejemplos, no encabezados verificados**; reemplazarlos y seleccionar las pestañas exactas. Puede configurar varias fuentes de recepción, evitando duplicar el mismo archivo/pestaña.

```json
[
  {
    "kind": "receipts",
    "id": "1jtF5B1DUQdx6eCWuFIp7k86suCY8XeBJ6_RoNJ3Bg-A",
    "sheets": ["OCTUBRE 2026"],
    "headerRow": 1,
    "columns": {"id":"ID RECEPCION","date":"FECHA","supplier":"PROVEEDOR","product":"PRODUCTO"}
  },
  {
    "kind": "sap",
    "id": "REEMPLAZAR_CON_ID_SAP_CONFIRMADO",
    "sheets": ["REEMPLAZAR_PESTANA_SAP"],
    "headerRow": 1,
    "columns": {"id":"ID RECEPCION","date":"FECHA","supplier":"PROVEEDOR","product":"PRODUCTO","tonnes":"TONELADAS"}
  }
]
```

`PROCESSED_SPREADSHEET_ID` debe ser el ID de la planilla nueva. La aplicación rechaza cualquier ID destino que coincida con una fuente. Escribe únicamente en `ASTILLA_PROCESADO`, que debe estar vacía o contener el encabezado propio de la aplicación. Identificadores se leen como texto mostrado para conservar ceros iniciales. Fechas: celdas de fecha de Sheets, ISO `AAAA-MM-DD` o texto `DD/MM/AAAA`; pesos numéricos o decimales chilenos (`11,5`). No almacenar contraseñas en el código.

## Despliegue con clasp

```sh
npm ci
npm run clasp -- login
cp .clasp.example.json .clasp.json
# Editar scriptId con el ID del proyecto independiente creado
npm run clasp -- push
npm run clasp -- open
```

Habilitar Google Apps Script API en la configuración de la cuenta si clasp lo solicita. `.clasp.json` y archivos de autenticación están ignorados. Nunca subir credenciales. El manifiesto solicita alcance de hojas de cálculo porque necesita escribir en la base independiente; la restricción de lectura de las fuentes se implementa en el lector y con acceso lector de la cuenta, no mediante un alcance OAuth por archivo.

En Apps Script: Implementar → Nueva implementación → Aplicación web. Ejecutar como **usuario que accede**; el manifiesto inicia con acceso **solo yo**. Autorizar con la cuenta prevista y validar antes de ampliar acceso a usuarios autorizados. Cada usuario requiere lectura de las fuentes y, si usa Guardar, escritura en la base independiente. No habilitar acceso público a información de proveedores. No se creó ningún proyecto ni despliegue remoto durante esta implementación.

## Validación de integración pendiente

1. Confirmar fuente SAP, encabezados, pestañas, unidad de toneladas e ID compartido. Usar una copia de prueba para la primera integración y una base procesada nueva.
2. Abrir la implementación autenticada, consultar un período conocido y comparar camiones y toneladas contra las fuentes. Probar un proveedor con SAP, otro sin SAP y ambas categorías de producto.
3. Verificar que un ID presente en ambas fuentes aparece solo como SAP; verificar errores con IDs conflictivos y filtros sin resultados.
4. Guardar base procesada; comprobar registros en la tercera planilla y repetir para confirmar que no se agregan duplicados. Las fuentes no reciben llamadas de escritura.
5. Verificar filtros, pantallas pequeñas y acceso con el usuario final. Bootstrap y Chart.js se cargan de `cdn.jsdelivr.net`; las tablas e indicadores funcionan sin Chart.js, pero Bootstrap requiere conexión para el diseño.

Para inspeccionar la interfaz sin Apps Script, ejecutar `node scripts/preview.cjs` y abrir `http://localhost:8080` en una máquina local. La página marca explícitamente **DEMOSTRACIÓN**, usa datos ficticios y deshabilita Guardar. Este modo no prueba la integración real ni reemplaza las pruebas de dominio.

Para tareas futuras usar este checkout existente: no crear worktrees. La aplicación desplegada no requiere un proceso Node permanente; Apps Script sirve `doGet`.
