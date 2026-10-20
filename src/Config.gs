var Config = (function () {
  function read() {
    var p=PropertiesService.getScriptProperties(),storeId=p.getProperty('PROCESSED_SPREADSHEET_ID'),raw=p.getProperty('SOURCES_JSON');
    // Check declared source IDs before reading the independent workbook.
    var declared=raw?JSON.parse(raw):[];
    if(!Array.isArray(declared))throw new Error('SOURCES_JSON debe ser una lista.');
    if(storeId && (Setup.sourceIds.indexOf(storeId)>=0||declared.some(function(s){return s.id===storeId;})))throw new Error('La base procesada debe ser independiente de todas las fuentes.');
    var workspace=Workspace.load(storeId),sources=workspace.sources.length?workspace.sources:declared;
    if(!sources.length||!sources.some(function(s){return s.kind==='receipts';})||!sources.some(function(s){return s.kind==='sap';}))throw new Error('Complete y active al menos una fuente receipts y una sap en FUENTES. Ejecute configurarProyecto si falta la base.');
    sources.forEach(function(s){
      if(!s.id||!Array.isArray(s.sheets)||!s.sheets.length||!s.columns||['receipts','sap'].indexOf(s.kind)<0)throw new Error('Fuente incompleta.');
      if(s.headerRow!==undefined&&(!Number.isInteger(s.headerRow)||s.headerRow<1))throw new Error('Fila de encabezados inválida.');
      if(!s.columns.guide&&!s.columns.id)throw new Error('Falta columna guide (N° DE GUÍA).');
      ['date','supplier','product'].concat(s.kind==='sap'?['tonnes']:[]).forEach(function(k){if(!s.columns[k])throw new Error('Falta columna '+k);});
      if(s.id===storeId)throw new Error('Escritura en fuente prohibida.');
    });
    var suppliers=JSON.parse(p.getProperty('SUPPLIERS_JSON')||'[]').concat(workspace.suppliers);Suppliers.build(suppliers);
    return {sources:sources,storeId:storeId,suppliers:suppliers,plans:workspace.plans};
  }
  return {read:read};
})();
