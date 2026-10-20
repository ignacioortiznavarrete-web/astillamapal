var Config = (function () {
  function read() {
    var p = PropertiesService.getScriptProperties();
    var raw = p.getProperty('SOURCES_JSON');
    if (!raw) throw new Error('Falta SOURCES_JSON. Configure fuentes, pestañas y encabezados según README.');
    var sources = JSON.parse(raw), storeId = p.getProperty('PROCESSED_SPREADSHEET_ID');
    if (!Array.isArray(sources) || !sources.length || !sources.some(function(s){return s.kind==='receipts';}) || !sources.some(function(s){return s.kind==='sap';})) throw new Error('Se requieren fuentes receipts y sap.');
    sources.forEach(function(s){
      if (!s.id || !Array.isArray(s.sheets) || !s.sheets.length || !s.columns || ['receipts','sap'].indexOf(s.kind)<0) throw new Error('Fuente incompleta.');
      if (!s.columns.guide && !s.columns.id) throw new Error('Falta columna guide (N° DE GUÍA).');
      ['date','supplier','product'].concat(s.kind==='sap'?['tonnes']:[]).forEach(function(k){if(!s.columns[k]) throw new Error('Falta columna '+k);});
    });
    if (storeId && sources.some(function(s){return s.id===storeId;})) throw new Error('La base procesada debe ser independiente de todas las fuentes.');
    return {sources:sources, storeId:storeId};
  }
  return {read:read};
})();
