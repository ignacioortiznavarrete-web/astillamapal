# Validación de ASTILLA MAPAL

## Resultado local

- **66 pruebas automatizadas aprobadas**, ninguna omitida (`npm test`). Servicios Google simulados: no se usan credenciales ni documentos reales.
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
