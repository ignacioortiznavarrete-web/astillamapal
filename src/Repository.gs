var Repository = (function () {
  var HEADERS=['ID','FECHA','PROVEEDOR','PRODUCTO','TONELADAS','ESTADO','PROMEDIO_RESPALDO'];
  function save(config, rows) {
    if(!config.storeId) throw new Error('Falta PROCESSED_SPREADSHEET_ID. Cree una planilla independiente.');
    if(config.sources.some(function(s){return s.id===config.storeId;})) throw new Error('Escritura en fuente prohibida.');
    var book=SpreadsheetApp.openById(config.storeId), sheet=book.getSheetByName('ASTILLA_PROCESADO');
    if(!sheet) sheet=book.insertSheet('ASTILLA_PROCESADO');
    if(sheet.getLastRow() && sheet.getRange(1,1,1,HEADERS.length).getDisplayValues()[0].join('|')!==HEADERS.join('|')) throw new Error('La pestaña destino contiene datos ajenos. No se modificó.');
    var data=[HEADERS].concat(rows.map(function(r){return [r.id,r.date,r.supplier,r.product,r.tonnes,r.status,r.fallback?'SI':'NO'];}));
    // RAW via Sheets REST is unnecessary: force text prefixes to prevent formulas in imported strings.
    data=data.map(function(row){return row.map(function(v){return typeof v==='string' && /^[=+@-]/.test(v)?"'"+v:v;});});
    sheet.getRange(1,1,data.length,HEADERS.length).setValues(data);
    if(sheet.getLastRow()>data.length) sheet.getRange(data.length+1,1,sheet.getLastRow()-data.length,HEADERS.length).clearContent();
    return {count:rows.length,updatedAt:new Date().toISOString()};
  }
  return {save:save};
})();
