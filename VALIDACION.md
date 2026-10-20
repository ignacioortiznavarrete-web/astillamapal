# Validación de ASTILLA MAPAL

## Comprobado localmente

- `npm ci --ignore-scripts`: instalación reproducible desde lockfile.
- `npm run vendor`: genera Bootstrap 5.3.3 y Chart.js 4.4.8 incluidos en HTML, conservando avisos de licencia. Sin CDN en tiempo de ejecución.
- `npm test`: **40 pruebas aprobadas**, ninguna omitida. Reglas de cálculo, proveedor + guía, homologación, plan mensual, períodos parciales, pivot de meses/años y protecciones de escritura.
- Incluye flujo completo con servicios Google simulados: crear base/encabezados, configurar fuentes/maestro/plan, leer, conciliar, promediar, guardar salidas y repetir. Verifica que las fuentes no cambian, que no se duplican salidas y que nombres pendientes bloquean guardar.
- `npm run check`: sintaxis de módulos `.gs`, JavaScript cliente y manifiesto.
- `clasp --version`: 3.1.3.
- Vista de demostración: HTTP 200 y plantilla completamente incluida.
- Chromium del sistema con Playwright: KPI, filtros de proveedor/producto, respaldo 11,5 TS, estado vacío, Bootstrap y gráficos cargados; pantalla móvil de 390 px sin desborde horizontal; ningún error JavaScript.
- Navegador con backend **simulado**: proveedor homologado, comparación de 14 TS SAP + 14 TS estimadas frente a plan de 100 TS, porcentajes 14% y 28%; período parcial suprime porcentajes mensuales. No son datos reales ni llamadas a Google.
- `git diff --check`: sin errores de whitespace en código propio; se conservan archivos de terceros tal como los distribuye npm, salvo envoltura HTML y eliminación de enlaces de source maps.

## Pendiente en la cuenta Google

- Ejecutar `prepararProyecto` para crear la base independiente y detectar las fuentes. Este desarrollo **no creó archivos remotos**.
- Autorizar acceso con cuenta lectora de originales; revisar las pestañas y los encabezados detectados y activar solo las filas correctas de FUENTES.
- Confirmar que SAP tiene una fila por camión/guía y que `Cantidad` está en TS. Cargar equivalencias reales de proveedores y metas mensuales sin inventarlas.
- Desplegar Apps Script y comparar un período contra los documentos originales. No hay autenticación clasp ni proyecto remoto enlazado en este entorno.
- No se hicieron escrituras en Google Sheets ni cambios de permisos. La protección e idempotencia se verificaron con hojas simuladas; falta validación real.

Los intentos de leer ambas hojas por exportación HTTP fueron rechazados por el proxy (403). La interfaz ya no depende de descargas de CDN: se corrigió la ausencia de estilos y gráficos detectada inicialmente.
