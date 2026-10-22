# Validación de ASTILLA MAPAL

## Resultado local

- **89 pruebas automatizadas aprobadas**, ninguna omitida (`npm test`). Servicios Google simulados: no se usan credenciales ni documentos reales.
- Sintaxis de servidor `.gs`, cliente JavaScript y manifiesto válida (`npm run check`).
- Dependencias fijadas con lockfile; Bootstrap 5.3.3 y Chart.js 4.4.8 incluidos en HTML, sin CDN en ejecución.
- Prueba de navegador reproducible (`npm run test:browser`) con Playwright 1.62.1 y Chromium del sistema.

## Casos cubiertos

- Fila de encabezados desplazada, acentos, puntuación, variantes SAP (Fecha de contabilización, Nombre 1, Texto breve de material, Nota de entrega y Cantidad en UM entrada).
- Prioridad de fecha de contabilización, mapeo explícito y selección por @B sin modificar el documento original. Los encabezados ambiguos no se eligen arbitrariamente.
- Migración de configuración anterior, retirada/omisión de placeholders y normalización de enlaces completos a IDs. Activaciones/desactivaciones respetadas en consultas normales.
- Nuevas filas de recepción, edición/reemplazo/eliminación de registros SAP y pestañas mensuales nuevas. Relectura completa, sin acumulación sobre importaciones previas.
- Homologación, proveedor + guía, promedios por proveedor, respaldo 11,5 TS, duplicados idénticos y contradicciones.
- Unidades KG rechazadas y hoja problemática sin importación parcial de sus primeras filas.
- Fuente SAP ausente: estimación provisional y porcentajes SAP no disponibles; fuente ilegible: señalización de datos parciales y bloqueo de guardado de totales.
- Plan mensual, plan cero/ausente/parcial, proveedor con plan y ningún ingreso, separación de años en pivot de meses y cumplimiento real versus cobertura estimada.
- Trigger propio único cada 15 minutos para la cuenta instaladora; desactivación conserva triggers ajenos.
- Flujo con Sheets simuladas: crear base, detectar/reparar fuentes, homologar, leer, calcular y guardar. Repetición sin duplicados ni modificación de originales. Los bloqueos de validación conservan los datos procesados anteriores.

## Navegador

- 8 KPIs y 4 gráficos, filtros por producto/proveedor/período, búsqueda por guía, exportación CSV y estado sin resultados.
- Pantalla móvil de 390 px sin desborde horizontal; ningún error JavaScript.
- Con backend simulado que ejecuta los módulos reales del servidor, una edición de Cantidad SAP pasa de 14 a 18 TS y se refleja automáticamente tanto en el KPI SAP como en el promedio usado para pendientes al avanzar el reloj 61 segundos.
- Desmarcar actualización automática evita la siguiente consulta. No se llamó a Google durante esta prueba.
- Capturas de demostración se generan en el directorio temporal; todos sus proveedores, ingresos y metas son ficticios.

## Pendiente en la cuenta Google

No hay sesión Google autorizada ni proyecto clasp remoto enlazado en este entorno. No se instalaron triggers, no se crearon hojas remotas y no se desplegó Apps Script durante estas pruebas. Los intentos anteriores de exportación HTTP de las hojas recibieron 403 del proxy.

Actualizar todos los archivos, ejecutar `activarAutomatico` con la cuenta responsable y publicar una nueva versión de la aplicación. Esa función requiere autorización Google para crear/reusar la base independiente e instalar el trigger. Confirmar en el reporte real que Cantidad está en TS y cada fila representa un camión. La presencia de encabezados por sí sola no demuestra esa semántica.

Si una fecha realmente no existe, un ID no identifica un camión único o las empresas tienen nombres distintos sin maestro, el sistema requiere corregir la configuración/homologación en la base independiente. No inventa equivalencias ni fechas. Ver README.md para el procedimiento.

## Instalador local sin copiar archivos

Cuatro pruebas con CLI simulada: respaldo obligatorio previo al push, conservación del contenido anterior y hashes, rechazo de proyecto local distinto y detección de una descarga de verificación diferente. No se ejecutaron login, pull ni push contra la cuenta Google real. Las rutas .gs/.js y saltos de línea se normalizan al comparar, así como el orden de claves del manifiesto JSON. El lanzador Windows no se ejecutó en Windows desde este entorno Linux.

## Salida del mes actual

Pruebas de período: calendario Chile en cambio de mes/año, febrero bisiesto, repetición BIOCHIPER histórica excluida y actual conservada con alerta, exportación ignorando rangos históricos solicitados, plan antiguo duplicado excluido, filas sin fecha conservadas como alerta y cambio de mes en salidas sin modificar fuentes. En navegador se consulta enero de 1900 y se comprueba que el CSV contiene las 27 filas ficticias del mes vigente, sin filas históricas.

## Complemento y guías repetidas

Diez casos adicionales: solo archivo de recepción indicado, cruce después de homologar, conservación de varias filas de una guía ausente en SAP, ubicación exacta de alertas, promedio/11,5 por fila, múltiples productos por guía, no doble lectura de una fila física, sincronización idempotente, y retirada de todos los estimados/alertas cuando llega la guía a SAP. SAP prevalece con aviso si el producto difiere. Las pruebas previas de depuración de guías de recepción se actualizaron a la regla explícita de conservar filas repetidas.

En navegador, backend simulado conserva dos filas de guía 1, muestra 2 camiones pendientes y 36 TS con promedio SAP 18, presenta dos distintivos de guía repetida y exporta el texto de alerta y columnas de origen. No se accedió a los documentos reales de Google.

Consultar SAP histórico explícitamente no incorpora recepciones estimadas históricas: el complemento siempre se limita al mes actual.
