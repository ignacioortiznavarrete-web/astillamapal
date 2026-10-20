function doGet() { return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('ASTILLA MAPAL · Compras de Suministro').addMetaTag('viewport','width=device-width, initial-scale=1'); }
function include_(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }
function getDashboard(filters) {
  filters=filters || {};
  ['from','to'].forEach(function(k){if(filters[k] && !/^\d{4}-\d{2}-\d{2}$/.test(filters[k])) throw new Error('Fecha de filtro inválida.');});
  if(filters.from && filters.to && filters.from>filters.to) throw new Error('El inicio debe ser anterior al término.');
  var config=Config.read(), data=SheetsReader.read(config), result=Suppliers.calculate(data,config.suppliers,filters);
  result.updatedAt=new Date().toISOString(); return result;
}
function syncProcessed() {
  var lock=LockService.getScriptLock(); if(!lock.tryLock(1000)) throw new Error('Ya hay una sincronización en curso.');
  try {var config=Config.read(), data=SheetsReader.read(config), result=Suppliers.calculate(data,config.suppliers,{}); if(result.warnings.length) throw new Error('Sincronización detenida: revise alertas de datos antes de guardar.');return Repository.save(config,result.rows);}
  finally {lock.releaseLock();}
}
