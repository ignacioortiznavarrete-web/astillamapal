# Validación de la implementación

- `npm ci --ignore-scripts`: instalación reproducible con lockfile completada.
- `npm test`: 17 pruebas aprobadas, ninguna omitida. Promedios por proveedor, respaldo 11,5, filtros, productos, deduplicación, conciliación, conflictos, fechas y bloqueo de destino fuente.
- `npm run check`: sintaxis de módulos `.gs`, JavaScript cliente y manifiesto válida.
- `npm run clasp -- --version`: 3.1.3.
- Servidor de demostración: respuesta HTTP 200 y plantilla con estilos y cliente incluidos, sin etiquetas de inclusión pendientes.
- `git diff --check`: sin problemas de whitespace.

## No verificado

- Interfaz en navegador: Playwright disponible, pero Chromium ausente. Descarga bloqueada por política de red (403 para cdn.playwright.dev). No se ejecutó validación visual ni interacción de filtros en navegador.
- Google Sheets: exportaciones de ambos enlaces rechazadas por proxy (403). No se pudieron comprobar estructura, permisos, encabezados ni contenido.
- Apps Script: no hay autenticación clasp configurada ni proyecto remoto enlazado. No se desplegó ni ejecutó contra servicios Google.
- Escritura: no se hizo ninguna escritura externa. El bloqueo de un destino igual a una fuente se probó con servicios simulados.

La demostración usa datos ficticios. La validación productiva y conciliación con SAP requieren completar las instrucciones de README.md. No hay evidencia todavía para afirmar que el dashboard funciona con las planillas reales.
